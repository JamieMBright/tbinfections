/**
 * Simulation Engine for TB Epidemiological Modeling
 *
 * This module provides the core simulation engine that orchestrates the
 * extended SEIR model for tuberculosis. It manages simulation state,
 * runs numerical integration, tracks metrics, and maintains a parallel
 * counterfactual simulation for measuring vaccination impact.
 *
 * @module simulation/engine
 */

import type {
  CompartmentState,
  DiseaseParameters,
  SimulationConfig,
  SimulationEvent,
  SimulationMetrics,
  SimulationState,
  TimeSeriesPoint,
  RegionState,
} from '@/types/simulation';

import {
  rungeKutta4,
  calculateEffectiveR,
  getTotalPopulation,
  createInitialState,
  calculateNewInfections,
  calculateNewDeaths,
  calculateIncidenceRate,
  calculatePrevalence,
  cloneState,
} from './seir-model';

import { adjustParametersForPolicy, createDiseaseParameters } from './tb-parameters';

/**
 * Unique ID generator for simulation events
 */
let eventIdCounter = 0;

/**
 * Generates a unique event ID
 * @returns Unique string identifier
 */
function generateEventId(): string {
  eventIdCounter += 1;
  return `evt_${Date.now()}_${eventIdCounter}`;
}

/**
 * WHO low-incidence threshold (per 100,000 population)
 * Countries below this are considered "low TB burden"
 */
const WHO_LOW_INCIDENCE_THRESHOLD = 10;

/**
 * WHO 2035 elimination target (per 100,000 population)
 * 90% reduction from 2015 levels
 */
const WHO_2035_TARGET_RATE = 10;

/**
 * Default number of days in a simulation year
 */
const DAYS_PER_YEAR = 365;

/**
 * SimulationEngine Class
 *
 * Manages the complete lifecycle of a TB epidemiological simulation,
 * including state management, numerical integration, event tracking,
 * and counterfactual comparison for measuring intervention effects.
 *
 * @example
 * ```typescript
 * const config: SimulationConfig = { ... };
 * const engine = new SimulationEngine(config);
 * engine.initialize();
 *
 * // Run simulation for 365 days
 * const states = engine.run(365);
 *
 * // Get final metrics
 * const metrics = engine.getMetrics();
 * console.log(`Infections prevented: ${metrics.infectionsPrevented}`);
 * ```
 */
export class SimulationEngine {
  /** Simulation configuration */
  private config: SimulationConfig;

  /** Current simulation state */
  private state: SimulationState;

  /** Current compartment values */
  private compartments: CompartmentState;

  /** Current disease parameters (may be modified by policies) */
  private currentParams: DiseaseParameters;

  /** Base disease parameters (without policy modifications) */
  private baseParams: DiseaseParameters;

  /** Counterfactual compartment state (no vaccination scenario) */
  private counterfactualCompartments: CompartmentState;

  /** Counterfactual disease parameters (no vaccination) */
  private counterfactualParams: DiseaseParameters;

  /** Time series history */
  private history: TimeSeriesPoint[];

  /** Event log */
  private events: SimulationEvent[];

  /** Cumulative infections in main simulation */
  private cumulativeInfections: number;

  /** Cumulative deaths in main simulation */
  private cumulativeDeaths: number;

  /** Cumulative vaccinations given */
  private cumulativeVaccinations: number;

  /** Cumulative infections in counterfactual */
  private counterfactualInfections: number;

  /** Cumulative deaths in counterfactual */
  private counterfactualDeaths: number;

  /** Start timestamp for simulation */
  private startTimestamp: number;

  /**
   * Creates a new SimulationEngine instance
   *
   * @param config - Complete simulation configuration
   *
   * @example
   * ```typescript
   * const engine = new SimulationEngine({
   *   id: 'sim-001',
   *   name: 'UK TB Simulation',
   *   duration: 3650,
   *   timeStep: 0.1,
   *   totalPopulation: 67000000,
   *   // ... other config options
   * });
   * ```
   */
  constructor(config: SimulationConfig) {
    this.config = config;
    this.baseParams = config.diseaseParams;
    this.currentParams = { ...config.diseaseParams };

    // Initialize counterfactual params (no vaccination)
    this.counterfactualParams = {
      ...config.diseaseParams,
      rho: 0, // No vaccination
      ve: 0, // No vaccine efficacy
    };

    // Initialize compartments to zero - will be set in initialize()
    this.compartments = {
      S: 0,
      V: 0,
      E_H: 0,
      E_L: 0,
      I: 0,
      R: 0,
      D: 0,
    };

    this.counterfactualCompartments = { ...this.compartments };

    // Initialize tracking variables
    this.history = [];
    this.events = [];
    this.cumulativeInfections = 0;
    this.cumulativeDeaths = 0;
    this.cumulativeVaccinations = 0;
    this.counterfactualInfections = 0;
    this.counterfactualDeaths = 0;
    this.startTimestamp = Date.now();

    // Initialize simulation state
    this.state = this.createInitialSimulationState();
  }

  /**
   * Creates the initial SimulationState object
   *
   * @returns Initial simulation state with default values
   */
  private createInitialSimulationState(): SimulationState {
    return {
      currentDay: 0,
      currentTime: new Date(this.startTimestamp),
      compartments: cloneState(this.compartments),
      regionStates: new Map<string, RegionState>(),
      groupStates: new Map<string, CompartmentState>(),
      history: this.history,
      events: this.events,
      metrics: this.createInitialMetrics(),
      status: 'idle',
      speed: 1,
    };
  }

  /**
   * Creates initial metrics with zero values
   *
   * @returns Initial SimulationMetrics object
   */
  private createInitialMetrics(): SimulationMetrics {
    return {
      totalInfections: 0,
      totalDeaths: 0,
      totalRecovered: 0,
      totalVaccinated: 0,
      infectionsPrevented: 0,
      deathsPrevented: 0,
      currentIncidenceRate: 0,
      currentPrevalence: 0,
      effectiveR: 0,
      whoTargetProgress: 0,
      lowIncidenceStatus: true,
    };
  }

  /**
   * Initializes the simulation with initial conditions from config
   *
   * Sets up:
   * - Initial compartment populations
   * - Regional state distribution (if configured)
   * - Counterfactual baseline state
   * - First history point
   *
   * @throws Error if configuration is invalid
   *
   * @example
   * ```typescript
   * const engine = new SimulationEngine(config);
   * engine.initialize();
   * console.log(`Initial susceptible: ${engine.getState().compartments.S}`);
   * ```
   */
  public initialize(): void {
    const { totalPopulation, initialInfected, initialLatent, vaccinationPolicy } = this.config;

    // Calculate initial vaccinated population based on policy
    const initialVaccinated = this.calculateInitialVaccinated(
      totalPopulation,
      vaccinationPolicy
    );

    // Create initial compartment state
    this.compartments = createInitialState(
      totalPopulation,
      initialInfected,
      initialLatent,
      initialVaccinated
    );

    // Initialize counterfactual with same initial conditions but no vaccination
    this.counterfactualCompartments = createInitialState(
      totalPopulation,
      initialInfected,
      initialLatent,
      0 // No vaccinated individuals in counterfactual
    );

    // Set initial cumulative values
    this.cumulativeInfections = initialInfected + initialLatent;
    this.cumulativeVaccinations = initialVaccinated;
    this.counterfactualInfections = initialInfected + initialLatent;

    // Initialize regional states if configured
    this.initializeRegionalStates();

    // Apply initial policies to parameters
    this.applyPolicies(0);

    // Record initial state in history
    this.recordHistoryPoint(0, 0, 0);

    // Record initialization event
    this.recordEvent(
      0,
      'policy_change',
      'Simulation initialized',
      {
        totalPopulation,
        initialInfected,
        initialLatent,
        initialVaccinated,
      }
    );

    // Update simulation state
    this.state = {
      ...this.state,
      currentDay: 0,
      currentTime: new Date(this.startTimestamp),
      compartments: cloneState(this.compartments),
      history: this.history,
      events: this.events,
      metrics: this.updateMetrics(),
      status: 'idle',
    };
  }

  /**
   * Calculates initial vaccinated population based on policy configuration
   *
   * @param totalPopulation - Total population size
   * @param policy - Vaccination policy configuration
   * @returns Number of initially vaccinated individuals
   */
  private calculateInitialVaccinated(
    totalPopulation: number,
    policy: SimulationConfig['vaccinationPolicy']
  ): number {
    let vaccinated = 0;

    // Calculate based on neonatal BCG coverage (historical)
    if (policy.neonatalBCG.enabled) {
      // Assume historical coverage affects current population under 40
      // (BCG was universally given until ~1980s in UK)
      const coverageRate = policy.neonatalBCG.coverageTarget;
      const eligibleProportion = 0.3; // Rough estimate of population under 40
      vaccinated += totalPopulation * eligibleProportion * coverageRate;
    }

    // Add healthcare worker vaccination
    if (policy.healthcareWorkerBCG.enabled) {
      const healthcareWorkerProportion = 0.05; // ~5% of population in healthcare
      vaccinated +=
        totalPopulation * healthcareWorkerProportion * policy.healthcareWorkerBCG.coverageTarget;
    }

    return Math.round(vaccinated);
  }

  /**
   * Initializes regional state distribution based on configuration
   */
  private initializeRegionalStates(): void {
    const regionStates = new Map<string, RegionState>();

    for (const region of this.config.regions) {
      const regionProportion = region.population / this.config.totalPopulation;

      // Distribute compartments proportionally to regional population
      // Adjust based on regional TB incidence rate
      const incidenceMultiplier = region.tbIncidenceRate / 10; // Normalize to average

      const regionCompartments: CompartmentState = {
        S: Math.round(this.compartments.S * regionProportion),
        V: Math.round(this.compartments.V * regionProportion * region.vaccinationCoverage),
        E_H: Math.round(this.compartments.E_H * regionProportion * incidenceMultiplier),
        E_L: Math.round(this.compartments.E_L * regionProportion * incidenceMultiplier),
        I: Math.round(this.compartments.I * regionProportion * incidenceMultiplier),
        R: Math.round(this.compartments.R * regionProportion),
        D: 0,
      };

      regionStates.set(region.id, {
        regionId: region.id,
        compartments: regionCompartments,
        population: region.population,
        incidenceRate: region.tbIncidenceRate,
      });
    }

    this.state.regionStates = regionStates;
  }

  /**
   * Runs one time step of the simulation
   *
   * Performs:
   * 1. Policy parameter adjustments
   * 2. Imported case injection
   * 3. Runge-Kutta numerical integration
   * 4. Counterfactual simulation step
   * 5. Metric updates
   * 6. Event recording for significant changes
   *
   * @returns Current simulation state after the step
   *
   * @example
   * ```typescript
   * engine.initialize();
   * for (let i = 0; i < 100; i++) {
   *   const state = engine.step();
   *   console.log(`Day ${state.currentDay}: ${state.compartments.I} infectious`);
   * }
   * ```
   */
  public step(): SimulationState {
    const currentDay = this.state.currentDay;
    const nextDay = currentDay + 1;
    const dt = this.config.timeStep;
    const stepsPerDay = Math.ceil(1 / dt);

    // Apply policies for current day
    this.applyPolicies(nextDay);

    // Track daily changes for events
    const startVaccinated = this.compartments.V;

    // Run multiple integration steps per day for accuracy
    let dailyNewInfections = 0;
    let dailyNewDeaths = 0;

    for (let step = 0; step < stepsPerDay; step++) {
      // Calculate new infections and deaths before step
      const newInfections = calculateNewInfections(this.compartments, this.currentParams, dt);
      const newDeaths = calculateNewDeaths(this.compartments, this.currentParams, dt);

      dailyNewInfections += newInfections;
      dailyNewDeaths += newDeaths;

      // Run main simulation step
      this.compartments = rungeKutta4(this.compartments, this.currentParams, dt);

      // Run counterfactual step
      const cfNewInfections = calculateNewInfections(
        this.counterfactualCompartments,
        this.counterfactualParams,
        dt
      );
      const cfNewDeaths = calculateNewDeaths(
        this.counterfactualCompartments,
        this.counterfactualParams,
        dt
      );

      this.counterfactualCompartments = rungeKutta4(
        this.counterfactualCompartments,
        this.counterfactualParams,
        dt
      );

      this.counterfactualInfections += cfNewInfections;
      this.counterfactualDeaths += cfNewDeaths;
    }

    // Add imported cases (daily)
    this.applyImportedCases(nextDay);

    // Update cumulative counts
    this.cumulativeInfections += dailyNewInfections;
    this.cumulativeDeaths += dailyNewDeaths;

    // Track vaccinations
    const dailyVaccinations = Math.max(0, this.compartments.V - startVaccinated);
    this.cumulativeVaccinations += dailyVaccinations;

    // Record history point
    this.recordHistoryPoint(nextDay, dailyNewInfections, dailyNewDeaths);

    // Check for significant events
    this.checkAndRecordEvents(nextDay, dailyNewInfections);

    // Update simulation state
    const timestamp = this.startTimestamp + nextDay * 24 * 60 * 60 * 1000;

    this.state = {
      ...this.state,
      currentDay: nextDay,
      currentTime: new Date(timestamp),
      compartments: cloneState(this.compartments),
      history: this.history,
      events: this.events,
      metrics: this.updateMetrics(),
      status: nextDay >= this.config.duration ? 'completed' : 'running',
    };

    return this.state;
  }

  /**
   * Runs multiple simulation steps
   *
   * @param steps - Number of days to simulate
   * @returns Array of simulation states, one per day
   *
   * @example
   * ```typescript
   * engine.initialize();
   * const results = engine.run(365);
   * const finalState = results[results.length - 1];
   * console.log(`Final infections: ${finalState.metrics.totalInfections}`);
   * ```
   */
  public run(steps: number): SimulationState[] {
    const states: SimulationState[] = [];
    const maxSteps = Math.min(steps, this.config.duration - this.state.currentDay);

    this.state.status = 'running';

    for (let i = 0; i < maxSteps; i++) {
      const state = this.step();
      states.push({ ...state, compartments: cloneState(state.compartments) });

      if (state.status === 'completed') {
        break;
      }
    }

    return states;
  }

  /**
   * Returns the current simulation state
   *
   * @returns Deep copy of current SimulationState
   */
  public getState(): SimulationState {
    return {
      ...this.state,
      compartments: cloneState(this.compartments),
      history: [...this.history],
      events: [...this.events],
      regionStates: new Map(this.state.regionStates),
      groupStates: new Map(this.state.groupStates),
    };
  }

  /**
   * Calculates and returns current simulation metrics
   *
   * @returns Current SimulationMetrics including counterfactual comparisons
   *
   * @example
   * ```typescript
   * const metrics = engine.getMetrics();
   * console.log(`Effective R: ${metrics.effectiveR.toFixed(2)}`);
   * console.log(`Infections prevented: ${metrics.infectionsPrevented}`);
   * ```
   */
  public getMetrics(): SimulationMetrics {
    return this.updateMetrics();
  }

  /**
   * Calculates infections and deaths prevented by vaccination
   *
   * Compares the main simulation (with vaccination) against the
   * counterfactual simulation (without vaccination) to estimate
   * the impact of the vaccination program.
   *
   * @returns Object containing prevented infections and deaths
   *
   * @example
   * ```typescript
   * const prevented = engine.calculatePrevented();
   * console.log(`Vaccination prevented ${prevented.infections} infections`);
   * console.log(`Vaccination prevented ${prevented.deaths} deaths`);
   * ```
   */
  public calculatePrevented(): { infections: number; deaths: number } {
    const infectionsPrevented = Math.max(
      0,
      this.counterfactualInfections - this.cumulativeInfections
    );

    const deathsPrevented = Math.max(
      0,
      this.counterfactualDeaths - this.cumulativeDeaths
    );

    return {
      infections: Math.round(infectionsPrevented),
      deaths: Math.round(deathsPrevented),
    };
  }

  /**
   * Updates metrics based on current state
   *
   * @returns Updated SimulationMetrics
   */
  private updateMetrics(): SimulationMetrics {
    const N = getTotalPopulation(this.compartments);
    const effectiveR = calculateEffectiveR(this.compartments, this.currentParams);
    const prevalence = calculatePrevalence(this.compartments);
    const prevented = this.calculatePrevented();

    // Calculate current annual incidence rate (per 100,000)
    // Use last 365 days of history if available
    let recentInfections = 0;
    const historyLength = this.history.length;
    const lookback = Math.min(DAYS_PER_YEAR, historyLength);

    for (let i = historyLength - lookback; i < historyLength; i++) {
      if (i >= 0) {
        recentInfections += this.history[i].newInfections;
      }
    }

    const annualizedInfections = lookback > 0
      ? (recentInfections / lookback) * DAYS_PER_YEAR
      : 0;
    const currentIncidenceRate = calculateIncidenceRate(annualizedInfections, N);

    // WHO target progress (% toward 10/100,000)
    // Baseline UK rate was ~15/100,000 in 2015
    const baselineRate = 15;
    const targetRate = WHO_2035_TARGET_RATE;
    const reduction = baselineRate - currentIncidenceRate;
    const targetReduction = baselineRate - targetRate;
    const whoTargetProgress = Math.min(100, Math.max(0, (reduction / targetReduction) * 100));

    const lowIncidenceStatus = currentIncidenceRate < WHO_LOW_INCIDENCE_THRESHOLD;

    return {
      totalInfections: Math.round(this.cumulativeInfections),
      totalDeaths: Math.round(this.compartments.D),
      totalRecovered: Math.round(this.compartments.R),
      totalVaccinated: Math.round(this.cumulativeVaccinations),
      infectionsPrevented: prevented.infections,
      deathsPrevented: prevented.deaths,
      currentIncidenceRate,
      currentPrevalence: prevalence,
      effectiveR,
      whoTargetProgress,
      lowIncidenceStatus,
    };
  }

  /**
   * Applies vaccination effects for the current time step
   *
   * Handles:
   * - Neonatal BCG (daily births)
   * - Catch-up vaccination campaigns
   * - Healthcare worker vaccination
   *
   * @param day - Current simulation day
   */
  private applyVaccination(day: number): void {
    const policy = this.config.vaccinationPolicy;
    const N = getTotalPopulation(this.compartments);

    // Daily birth rate (approximately 1.1 births per 1000 population per year in UK)
    const dailyBirthRate = 0.0011 / DAYS_PER_YEAR;
    const dailyBirths = N * dailyBirthRate;

    // Neonatal BCG
    if (policy.neonatalBCG.enabled && policy.neonatalBCG.eligibilityCriteria !== 'none') {
      let eligibleProportion = 1;

      if (policy.neonatalBCG.eligibilityCriteria === 'risk-based') {
        // Only vaccinate newborns from high-risk backgrounds
        // Approximate proportion based on UK demographics
        eligibleProportion = 0.15; // ~15% of births in high-risk areas
      }

      const vaccinatedNewborns =
        dailyBirths * eligibleProportion * policy.neonatalBCG.coverageTarget;

      // Move from susceptible to vaccinated
      const toVaccinate = Math.min(vaccinatedNewborns, this.compartments.S);
      this.compartments.S -= toVaccinate;
      this.compartments.V += toVaccinate;
    }

    // Healthcare worker catch-up vaccination (happens once at start)
    if (policy.healthcareWorkerBCG.enabled && day <= 30) {
      const healthcareWorkerProportion = 0.05;
      const dailyRate = (healthcareWorkerProportion * policy.healthcareWorkerBCG.coverageTarget) / 30;
      const toVaccinate = Math.min(N * dailyRate, this.compartments.S);
      this.compartments.S -= toVaccinate;
      this.compartments.V += toVaccinate;
    }

    // Catch-up vaccination campaign
    if (policy.catchUpVaccination.enabled) {
      const [minAge, maxAge] = policy.catchUpVaccination.targetAgeGroup;
      // Approximate proportion of population in age range
      const ageRangeProportion = (maxAge - minAge) / 80; // Rough estimate
      const targetPopulation = N * ageRangeProportion;
      const campaignDuration = 365; // 1 year campaign

      if (day <= campaignDuration) {
        const dailyVaccinations =
          (targetPopulation * policy.catchUpVaccination.coverageTarget) / campaignDuration;
        const toVaccinate = Math.min(dailyVaccinations, this.compartments.S);
        this.compartments.S -= toVaccinate;
        this.compartments.V += toVaccinate;
      }
    }
  }

  /**
   * Applies policy interventions to modify disease parameters
   *
   * @param day - Current simulation day
   */
  private applyPolicies(day: number): void {
    // Adjust base parameters based on active policies
    this.currentParams = adjustParametersForPolicy(
      this.baseParams,
      this.config.activeInterventions,
      day
    );

    // Also apply vaccination-specific effects
    this.applyVaccination(day);
  }

  /**
   * Applies imported cases to the simulation
   *
   * Models TB cases imported through immigration/travel
   *
   * @param day - Current simulation day
   */
  private applyImportedCases(day: number): void {
    const importedCases = this.config.importedCasesPerDay;

    if (importedCases > 0) {
      // Check if immigrant screening is active
      let screeningEfficacy = 0;
      if (this.config.vaccinationPolicy.immigrantScreening.enabled) {
        screeningEfficacy = this.config.vaccinationPolicy.immigrantScreening.efficacy;
      }

      // Also check for policy-based screening
      for (const policy of this.config.activeInterventions) {
        if (
          policy.type === 'pre_entry_screening' &&
          day >= policy.startDay &&
          (policy.endDay === undefined || day <= policy.endDay)
        ) {
          screeningEfficacy = Math.max(screeningEfficacy, 0.7);
        }
      }

      // Reduce imported cases by screening efficacy
      const effectiveImports = importedCases * (1 - screeningEfficacy);

      // Add to high-risk exposed (not immediately infectious)
      this.compartments.E_H += effectiveImports;
      this.cumulativeInfections += effectiveImports;

      // Counterfactual also gets imports (but without screening benefit)
      this.counterfactualCompartments.E_H += importedCases;
      this.counterfactualInfections += importedCases;
    }
  }

  /**
   * Records a simulation event to the event log
   *
   * @param day - Day the event occurred
   * @param type - Type of event
   * @param description - Human-readable description
   * @param details - Additional event details
   * @param location - Optional location identifier
   */
  private recordEvent(
    day: number,
    type: SimulationEvent['type'],
    description: string,
    details: Record<string, unknown>,
    location?: string
  ): void {
    const event: SimulationEvent = {
      id: generateEventId(),
      day,
      type,
      description,
      details,
      location,
    };

    this.events.push(event);

    // Keep event log from growing unbounded
    const maxEvents = 1000;
    if (this.events.length > maxEvents) {
      this.events = this.events.slice(-maxEvents);
    }
  }

  /**
   * Records a time series history point
   *
   * @param day - Current simulation day
   * @param newInfections - New infections this day
   * @param newDeaths - New deaths this day
   */
  private recordHistoryPoint(
    day: number,
    newInfections: number,
    newDeaths: number
  ): void {
    const effectiveR = calculateEffectiveR(this.compartments, this.currentParams);
    const prevented = this.calculatePrevented();
    const timestamp = this.startTimestamp + day * 24 * 60 * 60 * 1000;

    // Calculate vaccinations given this day
    const previousVaccinated = this.history.length > 0
      ? this.history[this.history.length - 1].compartments.V
      : 0;
    const vaccinationsGiven = Math.max(0, this.compartments.V - previousVaccinated);

    const point: TimeSeriesPoint = {
      day,
      timestamp,
      compartments: cloneState(this.compartments),
      newInfections: Math.round(newInfections),
      newDeaths: Math.round(newDeaths),
      preventedInfections: prevented.infections,
      effectiveR,
      vaccinationsGiven: Math.round(vaccinationsGiven),
    };

    this.history.push(point);
  }

  /**
   * Checks for significant events and records them
   *
   * @param day - Current simulation day
   * @param newInfections - New infections this day
   */
  private checkAndRecordEvents(
    day: number,
    newInfections: number
  ): void {
    const N = getTotalPopulation(this.compartments);
    const metrics = this.updateMetrics();

    // Check for outbreak (sudden increase in infections)
    if (this.history.length > 7) {
      const recentAvg = this.history
        .slice(-7)
        .reduce((sum, p) => sum + p.newInfections, 0) / 7;

      if (newInfections > recentAvg * 2 && newInfections > 10) {
        this.recordEvent(day, 'outbreak', 'Significant increase in infections detected', {
          newInfections: Math.round(newInfections),
          previousAverage: Math.round(recentAvg),
          increase: Math.round((newInfections / recentAvg - 1) * 100),
        });
      }
    }

    // Check for crossing WHO low-incidence threshold
    if (this.history.length > 1) {
      const previousPoint = this.history[this.history.length - 2];
      const previousIncidenceRate = calculateIncidenceRate(
        previousPoint.newInfections * DAYS_PER_YEAR,
        N
      );

      const crossedBelow = previousIncidenceRate >= WHO_LOW_INCIDENCE_THRESHOLD &&
        metrics.currentIncidenceRate < WHO_LOW_INCIDENCE_THRESHOLD;
      const crossedAbove = previousIncidenceRate < WHO_LOW_INCIDENCE_THRESHOLD &&
        metrics.currentIncidenceRate >= WHO_LOW_INCIDENCE_THRESHOLD;

      if (crossedBelow) {
        this.recordEvent(
          day,
          'policy_change',
          'Achieved WHO low-incidence status',
          { incidenceRate: metrics.currentIncidenceRate }
        );
      } else if (crossedAbove) {
        this.recordEvent(
          day,
          'policy_change',
          'Lost WHO low-incidence status',
          { incidenceRate: metrics.currentIncidenceRate }
        );
      }
    }

    // Check for policy start/end days
    for (const policy of this.config.activeInterventions) {
      if (policy.startDay === day) {
        this.recordEvent(day, 'policy_change', `Policy started: ${policy.name}`, {
          policyId: policy.id,
          policyType: policy.type,
          effectOnR0: policy.effectOnR0,
        });
      }

      if (policy.endDay === day) {
        this.recordEvent(day, 'policy_change', `Policy ended: ${policy.name}`, {
          policyId: policy.id,
          policyType: policy.type,
        });
      }
    }

    // Record milestone deaths
    const milestones = [100, 500, 1000, 5000, 10000];
    for (const milestone of milestones) {
      const previousDeaths = this.history.length > 1
        ? this.history[this.history.length - 2].compartments.D
        : 0;

      if (previousDeaths < milestone && this.compartments.D >= milestone) {
        this.recordEvent(day, 'death', `${milestone} cumulative TB deaths`, {
          totalDeaths: Math.round(this.compartments.D),
        });
      }
    }
  }

  /**
   * Resets the simulation to initial state
   *
   * @example
   * ```typescript
   * engine.run(365);
   * engine.reset();
   * // Simulation is now back at day 0
   * ```
   */
  public reset(): void {
    this.history = [];
    this.events = [];
    this.cumulativeInfections = 0;
    this.cumulativeDeaths = 0;
    this.cumulativeVaccinations = 0;
    this.counterfactualInfections = 0;
    this.counterfactualDeaths = 0;
    this.startTimestamp = Date.now();
    eventIdCounter = 0;

    this.currentParams = { ...this.baseParams };
    this.counterfactualParams = {
      ...this.baseParams,
      rho: 0,
      ve: 0,
    };

    this.state = this.createInitialSimulationState();
    this.initialize();
  }

  /**
   * Updates the simulation configuration
   *
   * @param newConfig - Partial configuration to merge
   *
   * @example
   * ```typescript
   * engine.updateConfig({
   *   vaccinationPolicy: {
   *     ...engine.getState().config.vaccinationPolicy,
   *     neonatalBCG: { enabled: true, coverageTarget: 0.95, eligibilityCriteria: 'universal' }
   *   }
   * });
   * ```
   */
  public updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.diseaseParams) {
      this.baseParams = newConfig.diseaseParams;
      this.applyPolicies(this.state.currentDay);
    }

    if (newConfig.activeInterventions) {
      this.applyPolicies(this.state.currentDay);
    }
  }

  /**
   * Gets the current configuration
   *
   * @returns Current SimulationConfig
   */
  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  /**
   * Pauses the simulation
   */
  public pause(): void {
    if (this.state.status === 'running') {
      this.state.status = 'paused';
    }
  }

  /**
   * Resumes a paused simulation
   */
  public resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
    }
  }

  /**
   * Sets the simulation playback speed
   *
   * @param speed - Speed multiplier (1 = normal, 2 = double, etc.)
   */
  public setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed));
  }

  /**
   * Gets current disease parameters (with policy adjustments applied)
   *
   * @returns Current DiseaseParameters
   */
  public getCurrentParams(): DiseaseParameters {
    return { ...this.currentParams };
  }

  /**
   * Gets the counterfactual compartment state for comparison
   *
   * @returns Counterfactual CompartmentState (no vaccination scenario)
   */
  public getCounterfactualState(): CompartmentState {
    return cloneState(this.counterfactualCompartments);
  }
}

/**
 * Factory function to create a SimulationEngine with default parameters
 *
 * @param overrides - Partial configuration overrides
 * @returns Configured and initialized SimulationEngine
 *
 * @example
 * ```typescript
 * const engine = createSimulationEngine({
 *   totalPopulation: 67000000,
 *   duration: 3650,
 * });
 * const results = engine.run(365);
 * ```
 */
export function createSimulationEngine(
  overrides?: Partial<SimulationConfig>
): SimulationEngine {
  const defaultConfig: SimulationConfig = {
    id: `sim_${Date.now()}`,
    name: 'UK TB Simulation',
    description: 'TB epidemiological simulation for the UK',
    duration: 3650, // 10 years
    timeStep: 0.1,
    displayInterval: 100,
    totalPopulation: 67000000, // UK population
    populationGroups: [],
    ageDistribution: {
      '0-4': 0.056,
      '5-14': 0.115,
      '15-24': 0.116,
      '25-44': 0.264,
      '45-64': 0.256,
      '65+': 0.193,
    },
    regions: [],
    interRegionMixing: 0.1,
    diseaseParams: createDiseaseParameters(),
    vaccinationPolicy: {
      neonatalBCG: {
        enabled: true,
        coverageTarget: 0.89,
        eligibilityCriteria: 'risk-based',
        riskBasedThreshold: 40,
      },
      healthcareWorkerBCG: {
        enabled: true,
        coverageTarget: 0.95,
      },
      immigrantScreening: {
        enabled: true,
        screeningCountryThreshold: 150,
        efficacy: 0.7,
      },
      catchUpVaccination: {
        enabled: false,
        targetAgeGroup: [0, 16],
        coverageTarget: 0.8,
      },
    },
    activeInterventions: [],
    initialInfected: 5480, // Current UK annual cases
    initialLatent: 500000, // Estimated latent TB in UK
    importedCasesPerDay: 15, // ~5500 cases/year, mostly imported
    visualizationMode: 'aggregate',
    showTransmissionEvents: true,
  };

  const config: SimulationConfig = { ...defaultConfig, ...overrides };
  const engine = new SimulationEngine(config);
  engine.initialize();

  return engine;
}
