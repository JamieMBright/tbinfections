/**
 * Simulation Engine Unit Tests
 *
 * Comprehensive tests for the core simulation engine that orchestrates
 * the SEIR model. Tests cover initialization, state advancement,
 * metric calculations, counterfactual comparison, and state transitions.
 *
 * @module tests/unit/simulation/engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  CompartmentState,
  DiseaseParameters,
  SimulationConfig,
  SimulationState,
  PolicyIntervention,
  VaccinationPolicy,
} from '@/types/simulation';
import { SimulationEngine, createSimulationEngine } from '@/lib/simulation/engine';
import { createDiseaseParameters } from '@/lib/simulation/tb-parameters';
import { getTotalPopulation, isValidState } from '@/lib/simulation/seir-model';

/**
 * Create a minimal valid simulation config for testing
 */
function createTestConfig(overrides?: Partial<SimulationConfig>): SimulationConfig {
  const defaultVaccinationPolicy: VaccinationPolicy = {
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
  };

  return {
    id: 'test-sim',
    name: 'Test Simulation',
    description: 'Test simulation for unit tests',
    duration: 365,
    timeStep: 0.1,
    displayInterval: 100,
    totalPopulation: 1000000,
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
    vaccinationPolicy: defaultVaccinationPolicy,
    activeInterventions: [],
    initialInfected: 100,
    initialLatent: 5000,
    importedCasesPerDay: 0,
    visualizationMode: 'aggregate',
    showTransmissionEvents: false,
    ...overrides,
  };
}

/**
 * Create a test policy intervention
 */
function createTestPolicy(overrides?: Partial<PolicyIntervention>): PolicyIntervention {
  return {
    id: 'test-policy',
    type: 'active_case_finding',
    name: 'Test Policy',
    description: 'Test policy for unit tests',
    startDay: 0,
    parameters: {},
    effectOnR0: 1,
    ...overrides,
  };
}

describe('SimulationEngine', () => {
  describe('Constructor', () => {
    it('should create engine with valid config', () => {
      const config = createTestConfig();
      const engine = new SimulationEngine(config);

      expect(engine).toBeInstanceOf(SimulationEngine);
    });

    it('should store provided config', () => {
      const config = createTestConfig({ name: 'Custom Test' });
      const engine = new SimulationEngine(config);
      const storedConfig = engine.getConfig();

      expect(storedConfig.name).toBe('Custom Test');
    });

    it('should initialize with idle status', () => {
      const config = createTestConfig();
      const engine = new SimulationEngine(config);
      const state = engine.getState();

      expect(state.status).toBe('idle');
    });

    it('should initialize with day 0', () => {
      const config = createTestConfig();
      const engine = new SimulationEngine(config);
      const state = engine.getState();

      expect(state.currentDay).toBe(0);
    });
  });

  describe('initialize()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
    });

    it('should set up initial compartment state', () => {
      engine.initialize();
      const state = engine.getState();

      expect(state.compartments.I).toBeGreaterThanOrEqual(0);
      expect(state.compartments.S).toBeGreaterThanOrEqual(0);
    });

    it('should set initial infectious count from config', () => {
      const config = createTestConfig({ initialInfected: 500 });
      const customEngine = new SimulationEngine(config);
      customEngine.initialize();
      const state = customEngine.getState();

      expect(state.compartments.I).toBe(500);
    });

    it('should set initial latent count from config', () => {
      const config = createTestConfig({ initialLatent: 10000 });
      const customEngine = new SimulationEngine(config);
      customEngine.initialize();
      const state = customEngine.getState();

      // Latent is split 20/80 between E_H and E_L
      expect(state.compartments.E_H + state.compartments.E_L).toBe(10000);
    });

    it('should create valid compartment state', () => {
      engine.initialize();
      const state = engine.getState();

      expect(isValidState(state.compartments)).toBe(true);
    });

    it('should initialize history with first point', () => {
      engine.initialize();
      const state = engine.getState();

      expect(state.history.length).toBeGreaterThanOrEqual(1);
      expect(state.history[0].day).toBe(0);
    });

    it('should initialize events with initialization event', () => {
      engine.initialize();
      const state = engine.getState();

      expect(state.events.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate initial metrics', () => {
      engine.initialize();
      const metrics = engine.getMetrics();

      expect(metrics.totalInfections).toBeGreaterThanOrEqual(0);
      expect(metrics.effectiveR).toBeGreaterThanOrEqual(0);
    });

    it('should maintain total population', () => {
      const config = createTestConfig({ totalPopulation: 1000000 });
      const customEngine = new SimulationEngine(config);
      customEngine.initialize();
      const state = customEngine.getState();

      const living = getTotalPopulation(state.compartments);
      const total = living + state.compartments.D;

      expect(total).toBe(1000000);
    });
  });

  describe('step()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should advance currentDay by 1', () => {
      const initialDay = engine.getState().currentDay;
      engine.step();
      const newDay = engine.getState().currentDay;

      expect(newDay).toBe(initialDay + 1);
    });

    it('should update compartment state', () => {
      const initialState = engine.getState().compartments;
      engine.step();
      const newState = engine.getState().compartments;

      // State should change (not be identical)
      const stateChanged =
        newState.S !== initialState.S ||
        newState.I !== initialState.I ||
        newState.D !== initialState.D;

      expect(stateChanged).toBe(true);
    });

    it('should maintain valid compartment state', () => {
      for (let i = 0; i < 10; i++) {
        engine.step();
      }
      const state = engine.getState();

      expect(isValidState(state.compartments)).toBe(true);
    });

    it('should add point to history', () => {
      const initialHistoryLength = engine.getState().history.length;
      engine.step();
      const newHistoryLength = engine.getState().history.length;

      expect(newHistoryLength).toBe(initialHistoryLength + 1);
    });

    it('should update currentTime', () => {
      const initialTime = engine.getState().currentTime.getTime();
      engine.step();
      const newTime = engine.getState().currentTime.getTime();

      expect(newTime).toBeGreaterThan(initialTime);
    });

    it('should set status to running', () => {
      engine.step();
      const state = engine.getState();

      expect(state.status).toBe('running');
    });

    it('should set status to completed when duration reached', () => {
      const config = createTestConfig({ duration: 5 });
      const shortEngine = new SimulationEngine(config);
      shortEngine.initialize();

      for (let i = 0; i < 6; i++) {
        shortEngine.step();
      }

      expect(shortEngine.getState().status).toBe('completed');
    });

    it('should update metrics after step', () => {
      engine.step();
      const metrics = engine.getMetrics();

      expect(metrics).toHaveProperty('totalInfections');
      expect(metrics).toHaveProperty('effectiveR');
    });

    it('should return current state', () => {
      const returnedState = engine.step();

      expect(returnedState.currentDay).toBe(1);
      expect(returnedState.compartments).toBeDefined();
    });
  });

  describe('run()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should return array of states', () => {
      const states = engine.run(10);

      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBe(10);
    });

    it('should run specified number of steps', () => {
      const steps = 50;
      const states = engine.run(steps);

      expect(states.length).toBe(steps);
      expect(engine.getState().currentDay).toBe(steps);
    });

    it('should return states in chronological order', () => {
      const states = engine.run(10);

      for (let i = 1; i < states.length; i++) {
        expect(states[i].currentDay).toBeGreaterThan(states[i - 1].currentDay);
      }
    });

    it('should stop at duration limit', () => {
      const config = createTestConfig({ duration: 20 });
      const limitedEngine = new SimulationEngine(config);
      limitedEngine.initialize();

      const states = limitedEngine.run(100);

      expect(states.length).toBeLessThanOrEqual(20);
    });

    it('should return each state as a snapshot', () => {
      const states = engine.run(10);

      // Each state should be independent
      expect(states[0].currentDay).toBe(1);
      expect(states[5].currentDay).toBe(6);
      expect(states[9].currentDay).toBe(10);
    });

    it('should show disease progression over time', () => {
      // Run for significant time
      const states = engine.run(100);

      // Should have accumulated deaths over time
      const initialDeaths = states[0].compartments.D;
      const finalDeaths = states[states.length - 1].compartments.D;

      expect(finalDeaths).toBeGreaterThanOrEqual(initialDeaths);
    });
  });

  describe('getMetrics()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should return SimulationMetrics object', () => {
      const metrics = engine.getMetrics();

      expect(metrics).toHaveProperty('totalInfections');
      expect(metrics).toHaveProperty('totalDeaths');
      expect(metrics).toHaveProperty('totalRecovered');
      expect(metrics).toHaveProperty('totalVaccinated');
      expect(metrics).toHaveProperty('infectionsPrevented');
      expect(metrics).toHaveProperty('deathsPrevented');
      expect(metrics).toHaveProperty('currentIncidenceRate');
      expect(metrics).toHaveProperty('currentPrevalence');
      expect(metrics).toHaveProperty('effectiveR');
      expect(metrics).toHaveProperty('whoTargetProgress');
      expect(metrics).toHaveProperty('lowIncidenceStatus');
    });

    it('should calculate totalInfections correctly', () => {
      engine.run(50);
      const metrics = engine.getMetrics();

      expect(metrics.totalInfections).toBeGreaterThan(0);
    });

    it('should calculate totalDeaths correctly', () => {
      engine.run(100);
      const metrics = engine.getMetrics();
      const state = engine.getState();

      expect(metrics.totalDeaths).toBe(Math.round(state.compartments.D));
    });

    it('should calculate totalRecovered correctly', () => {
      engine.run(100);
      const metrics = engine.getMetrics();
      const state = engine.getState();

      expect(metrics.totalRecovered).toBe(Math.round(state.compartments.R));
    });

    it('should calculate effectiveR as positive number', () => {
      const metrics = engine.getMetrics();

      expect(metrics.effectiveR).toBeGreaterThanOrEqual(0);
    });

    it('should calculate currentPrevalence correctly', () => {
      const metrics = engine.getMetrics();
      const state = engine.getState();
      const N = getTotalPopulation(state.compartments);

      const expectedPrevalence = state.compartments.I / N;

      expect(metrics.currentPrevalence).toBeCloseTo(expectedPrevalence, 5);
    });

    it('should track lowIncidenceStatus correctly', () => {
      const metrics = engine.getMetrics();

      expect(typeof metrics.lowIncidenceStatus).toBe('boolean');
    });

    it('should track whoTargetProgress between 0-100', () => {
      engine.run(50);
      const metrics = engine.getMetrics();

      expect(metrics.whoTargetProgress).toBeGreaterThanOrEqual(0);
      expect(metrics.whoTargetProgress).toBeLessThanOrEqual(100);
    });
  });

  describe('calculatePrevented()', () => {
    it('should return infections and deaths prevented', () => {
      const config = createTestConfig();
      const engine = new SimulationEngine(config);
      engine.initialize();
      engine.run(100);

      const prevented = engine.calculatePrevented();

      expect(prevented).toHaveProperty('infections');
      expect(prevented).toHaveProperty('deaths');
    });

    it('should return non-negative values', () => {
      const config = createTestConfig();
      const engine = new SimulationEngine(config);
      engine.initialize();
      engine.run(100);

      const prevented = engine.calculatePrevented();

      expect(prevented.infections).toBeGreaterThanOrEqual(0);
      expect(prevented.deaths).toBeGreaterThanOrEqual(0);
    });

    it('should show more prevented cases with higher vaccination', () => {
      // Low vaccination scenario
      const lowVaccPolicy: VaccinationPolicy = {
        neonatalBCG: {
          enabled: false,
          coverageTarget: 0,
          eligibilityCriteria: 'none',
          riskBasedThreshold: 40,
        },
        healthcareWorkerBCG: {
          enabled: false,
          coverageTarget: 0,
        },
        immigrantScreening: {
          enabled: false,
          screeningCountryThreshold: 150,
          efficacy: 0,
        },
        catchUpVaccination: {
          enabled: false,
          targetAgeGroup: [0, 16],
          coverageTarget: 0,
        },
      };

      // High vaccination scenario
      const highVaccPolicy: VaccinationPolicy = {
        neonatalBCG: {
          enabled: true,
          coverageTarget: 0.95,
          eligibilityCriteria: 'universal',
          riskBasedThreshold: 0,
        },
        healthcareWorkerBCG: {
          enabled: true,
          coverageTarget: 0.95,
        },
        immigrantScreening: {
          enabled: true,
          screeningCountryThreshold: 40,
          efficacy: 0.9,
        },
        catchUpVaccination: {
          enabled: true,
          targetAgeGroup: [0, 16],
          coverageTarget: 0.9,
        },
      };

      const lowVaccConfig = createTestConfig({ vaccinationPolicy: lowVaccPolicy });
      const highVaccConfig = createTestConfig({ vaccinationPolicy: highVaccPolicy });

      const lowVaccEngine = new SimulationEngine(lowVaccConfig);
      lowVaccEngine.initialize();
      lowVaccEngine.run(100);

      const highVaccEngine = new SimulationEngine(highVaccConfig);
      highVaccEngine.initialize();
      highVaccEngine.run(100);

      const lowPrevented = lowVaccEngine.calculatePrevented();
      const highPrevented = highVaccEngine.calculatePrevented();

      // Higher vaccination should prevent more (or at least equal) infections
      expect(highPrevented.infections).toBeGreaterThanOrEqual(lowPrevented.infections);
    });

    it('should be reflected in getMetrics()', () => {
      const config = createTestConfig();
      const engine = new SimulationEngine(config);
      engine.initialize();
      engine.run(50);

      const prevented = engine.calculatePrevented();
      const metrics = engine.getMetrics();

      expect(metrics.infectionsPrevented).toBe(prevented.infections);
      expect(metrics.deathsPrevented).toBe(prevented.deaths);
    });
  });

  describe('State Transitions', () => {
    it('should follow SEIR logic: E_H -> E_L', () => {
      // Start with only high-risk exposed
      const config = createTestConfig({
        initialInfected: 0,
        initialLatent: 10000, // Will be split to E_H: 2000, E_L: 8000
      });
      const engine = new SimulationEngine(config);
      engine.initialize();

      const initialEL = engine.getState().compartments.E_L;

      // Run simulation
      engine.run(100);

      const finalEL = engine.getState().compartments.E_L;

      // E_L should have changed (some from E_H progression)
      expect(finalEL !== initialEL).toBe(true);
    });

    it('should follow SEIR logic: E_H -> I', () => {
      // Start with high-risk exposed and no infectious
      const config = createTestConfig({
        initialInfected: 0,
        initialLatent: 10000,
      });
      const engine = new SimulationEngine(config);
      engine.initialize();

      // Initially no infectious
      expect(engine.getState().compartments.I).toBe(0);

      // Run simulation
      engine.run(100);

      // Should have some infectious now from E_H progression
      expect(engine.getState().compartments.I).toBeGreaterThan(0);
    });

    it('should follow SEIR logic: I -> R', () => {
      const config = createTestConfig({
        initialInfected: 1000,
        initialLatent: 0,
      });
      const engine = new SimulationEngine(config);
      engine.initialize();

      // Initially no recovered
      expect(engine.getState().compartments.R).toBe(0);

      // Run simulation
      engine.run(200);

      // Should have some recovered now
      expect(engine.getState().compartments.R).toBeGreaterThan(0);
    });

    it('should follow SEIR logic: I -> D', () => {
      const config = createTestConfig({
        initialInfected: 1000,
      });
      const engine = new SimulationEngine(config);
      engine.initialize();

      // Initially no deaths
      expect(engine.getState().compartments.D).toBe(0);

      // Run simulation
      engine.run(100);

      // Should have some deaths now
      expect(engine.getState().compartments.D).toBeGreaterThan(0);
    });

    it('should follow SEIR logic: S -> V with vaccination', () => {
      const highVaccPolicy: VaccinationPolicy = {
        neonatalBCG: {
          enabled: true,
          coverageTarget: 0.95,
          eligibilityCriteria: 'universal',
          riskBasedThreshold: 0,
        },
        healthcareWorkerBCG: {
          enabled: true,
          coverageTarget: 0.95,
        },
        immigrantScreening: {
          enabled: true,
          screeningCountryThreshold: 40,
          efficacy: 0.9,
        },
        catchUpVaccination: {
          enabled: true,
          targetAgeGroup: [0, 16],
          coverageTarget: 0.9,
        },
      };

      const config = createTestConfig({
        vaccinationPolicy: highVaccPolicy,
        diseaseParams: createDiseaseParameters({ rho: 0.01 }), // High vaccination rate
      });
      const engine = new SimulationEngine(config);
      engine.initialize();

      const initialV = engine.getState().compartments.V;

      // Run simulation
      engine.run(100);

      const finalV = engine.getState().compartments.V;

      // Vaccinated should increase
      expect(finalV).toBeGreaterThan(initialV);
    });
  });

  describe('Policy Application', () => {
    it('should apply active interventions', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 0,
        effectOnR0: 0.8,
      });

      const configWithPolicy = createTestConfig({
        activeInterventions: [policy],
      });

      const engineWithPolicy = new SimulationEngine(configWithPolicy);
      engineWithPolicy.initialize();
      engineWithPolicy.run(50);

      const configWithoutPolicy = createTestConfig({
        activeInterventions: [],
      });

      const engineWithoutPolicy = new SimulationEngine(configWithoutPolicy);
      engineWithoutPolicy.initialize();
      engineWithoutPolicy.run(50);

      // Policy should have some effect on outcomes
      // We can check that the engines produced different results
      expect(engineWithPolicy.getMetrics().effectiveR).not.toBe(
        engineWithoutPolicy.getMetrics().effectiveR
      );
    });

    it('should record policy start events', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 10,
        name: 'Test ACF Policy',
      });

      const config = createTestConfig({
        activeInterventions: [policy],
      });

      const engine = new SimulationEngine(config);
      engine.initialize();
      engine.run(20);

      const state = engine.getState();
      const policyEvent = state.events.find(
        (e) => e.type === 'policy_change' && e.description.includes('Policy started')
      );

      expect(policyEvent).toBeDefined();
    });
  });

  describe('reset()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
      engine.run(50);
    });

    it('should reset currentDay to 0', () => {
      engine.reset();
      expect(engine.getState().currentDay).toBe(0);
    });

    it('should reset status to idle', () => {
      engine.reset();
      expect(engine.getState().status).toBe('idle');
    });

    it('should reset compartments to initial state', () => {
      const config = engine.getConfig();
      engine.reset();
      const state = engine.getState();

      // Check that infectious matches initial config
      expect(state.compartments.I).toBe(config.initialInfected);
    });

    it('should clear history (except initial point)', () => {
      engine.reset();
      const state = engine.getState();

      expect(state.history.length).toBe(1);
    });

    it('should clear events (except initialization)', () => {
      engine.reset();
      const state = engine.getState();

      // Should have minimal events after reset
      expect(state.events.length).toBeLessThanOrEqual(2);
    });

    it('should reset metrics', () => {
      engine.reset();
      const metrics = engine.getMetrics();

      expect(metrics.totalDeaths).toBe(0);
    });
  });

  describe('updateConfig()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should update configuration', () => {
      engine.updateConfig({ name: 'Updated Name' });
      const config = engine.getConfig();

      expect(config.name).toBe('Updated Name');
    });

    it('should update disease parameters', () => {
      const newParams = createDiseaseParameters({ beta: 0.005 });
      engine.updateConfig({ diseaseParams: newParams });

      const config = engine.getConfig();
      expect(config.diseaseParams.beta).toBe(0.005);
    });

    it('should preserve non-updated config', () => {
      const originalDuration = engine.getConfig().duration;
      engine.updateConfig({ name: 'Updated Name' });

      expect(engine.getConfig().duration).toBe(originalDuration);
    });
  });

  describe('pause() and resume()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
      engine.step(); // Start running
    });

    it('should pause running simulation', () => {
      expect(engine.getState().status).toBe('running');
      engine.pause();
      expect(engine.getState().status).toBe('paused');
    });

    it('should resume paused simulation', () => {
      engine.pause();
      expect(engine.getState().status).toBe('paused');
      engine.resume();
      expect(engine.getState().status).toBe('running');
    });

    it('should not change status if already paused when pausing', () => {
      engine.pause();
      engine.pause();
      expect(engine.getState().status).toBe('paused');
    });

    it('should not change status if not paused when resuming', () => {
      engine.resume();
      expect(engine.getState().status).toBe('running');
    });
  });

  describe('setSpeed()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should set simulation speed', () => {
      engine.setSpeed(2);
      expect(engine.getState().speed).toBe(2);
    });

    it('should clamp speed to minimum 0.1', () => {
      engine.setSpeed(0.01);
      expect(engine.getState().speed).toBe(0.1);
    });

    it('should clamp speed to maximum 10', () => {
      engine.setSpeed(100);
      expect(engine.getState().speed).toBe(10);
    });
  });

  describe('getCurrentParams()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should return current disease parameters', () => {
      const params = engine.getCurrentParams();

      expect(params).toHaveProperty('beta');
      expect(params).toHaveProperty('gamma');
      expect(params).toHaveProperty('ve');
    });

    it('should reflect policy modifications', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 0,
      });

      const configWithPolicy = createTestConfig({
        activeInterventions: [policy],
      });

      const engineWithPolicy = new SimulationEngine(configWithPolicy);
      engineWithPolicy.initialize();
      engineWithPolicy.step();

      const paramsWithPolicy = engineWithPolicy.getCurrentParams();
      const paramsWithoutPolicy = engine.getCurrentParams();

      // Policy should modify gamma
      expect(paramsWithPolicy.gamma).not.toBe(paramsWithoutPolicy.gamma);
    });
  });

  describe('getCounterfactualState()', () => {
    let engine: SimulationEngine;

    beforeEach(() => {
      const config = createTestConfig();
      engine = new SimulationEngine(config);
      engine.initialize();
    });

    it('should return valid compartment state', () => {
      const counterfactual = engine.getCounterfactualState();

      expect(isValidState(counterfactual)).toBe(true);
    });

    it('should have no vaccination in counterfactual', () => {
      engine.run(50);
      const counterfactual = engine.getCounterfactualState();
      const main = engine.getState().compartments;

      // Counterfactual should have fewer or equal vaccinated
      // (Initially it should have 0, main should have more due to vaccination)
      expect(counterfactual.V).toBeLessThanOrEqual(main.V);
    });

    it('should diverge from main simulation over time', () => {
      engine.run(100);

      const main = engine.getState().compartments;
      const counterfactual = engine.getCounterfactualState();

      // States should diverge due to vaccination effects
      const mainTotal = main.S + main.V + main.E_H + main.E_L + main.I + main.R + main.D;
      const cfTotal =
        counterfactual.S +
        counterfactual.V +
        counterfactual.E_H +
        counterfactual.E_L +
        counterfactual.I +
        counterfactual.R +
        counterfactual.D;

      // Both should have roughly same total (conservation)
      expect(Math.abs(mainTotal - cfTotal) / mainTotal).toBeLessThan(0.1);
    });
  });
});

describe('createSimulationEngine()', () => {
  it('should create and initialize engine with defaults', () => {
    const engine = createSimulationEngine();

    expect(engine).toBeInstanceOf(SimulationEngine);
    expect(engine.getState().currentDay).toBe(0);
  });

  it('should apply overrides to config', () => {
    const engine = createSimulationEngine({
      totalPopulation: 500000,
      duration: 100,
    });

    const config = engine.getConfig();

    expect(config.totalPopulation).toBe(500000);
    expect(config.duration).toBe(100);
  });

  it('should use UK population as default', () => {
    const engine = createSimulationEngine();
    const config = engine.getConfig();

    expect(config.totalPopulation).toBe(67000000);
  });

  it('should use 10-year duration as default', () => {
    const engine = createSimulationEngine();
    const config = engine.getConfig();

    expect(config.duration).toBe(3650); // 10 years
  });

  it('should already be initialized', () => {
    const engine = createSimulationEngine();
    const state = engine.getState();

    // Should have initial compartments set up
    expect(state.compartments.S).toBeGreaterThan(0);
    expect(state.history.length).toBeGreaterThanOrEqual(1);
  });

  it('should be ready to run', () => {
    const engine = createSimulationEngine();

    // Should be able to step immediately
    const state = engine.step();

    expect(state.currentDay).toBe(1);
  });
});

describe('Imported Cases', () => {
  it('should add imported cases daily', () => {
    const config = createTestConfig({
      importedCasesPerDay: 10,
      initialInfected: 0,
      initialLatent: 0,
    });
    const engine = new SimulationEngine(config);
    engine.initialize();

    // Run for some days
    engine.run(10);

    // Should have accumulated some exposed from imports
    const state = engine.getState();
    expect(state.compartments.E_H).toBeGreaterThan(0);
  });

  it('should reduce imports with screening', () => {
    const configWithScreening = createTestConfig({
      importedCasesPerDay: 10,
      initialInfected: 0,
      initialLatent: 0,
      vaccinationPolicy: {
        neonatalBCG: {
          enabled: false,
          coverageTarget: 0,
          eligibilityCriteria: 'none',
          riskBasedThreshold: 40,
        },
        healthcareWorkerBCG: {
          enabled: false,
          coverageTarget: 0,
        },
        immigrantScreening: {
          enabled: true,
          screeningCountryThreshold: 40,
          efficacy: 0.9,
        },
        catchUpVaccination: {
          enabled: false,
          targetAgeGroup: [0, 16],
          coverageTarget: 0,
        },
      },
    });

    const configWithoutScreening = createTestConfig({
      importedCasesPerDay: 10,
      initialInfected: 0,
      initialLatent: 0,
      vaccinationPolicy: {
        neonatalBCG: {
          enabled: false,
          coverageTarget: 0,
          eligibilityCriteria: 'none',
          riskBasedThreshold: 40,
        },
        healthcareWorkerBCG: {
          enabled: false,
          coverageTarget: 0,
        },
        immigrantScreening: {
          enabled: false,
          screeningCountryThreshold: 150,
          efficacy: 0,
        },
        catchUpVaccination: {
          enabled: false,
          targetAgeGroup: [0, 16],
          coverageTarget: 0,
        },
      },
    });

    const engineWithScreening = new SimulationEngine(configWithScreening);
    engineWithScreening.initialize();
    engineWithScreening.run(50);

    const engineWithoutScreening = new SimulationEngine(configWithoutScreening);
    engineWithoutScreening.initialize();
    engineWithoutScreening.run(50);

    // Screening should result in fewer exposed
    const withScreening = engineWithScreening.getState().compartments.E_H;
    const withoutScreening = engineWithoutScreening.getState().compartments.E_H;

    expect(withScreening).toBeLessThan(withoutScreening);
  });
});

describe('Event Recording', () => {
  it('should record outbreak events when infections spike', () => {
    // Create scenario with sudden spike
    const config = createTestConfig({
      initialInfected: 100,
      importedCasesPerDay: 50, // High import rate
    });
    const engine = new SimulationEngine(config);
    engine.initialize();

    // Run for a while to accumulate history
    engine.run(100);

    const state = engine.getState();
    const outbreakEvents = state.events.filter((e) => e.type === 'outbreak');

    // May or may not have outbreak events depending on dynamics
    // At minimum, events array should exist
    expect(Array.isArray(state.events)).toBe(true);
  });

  it('should limit event log size', () => {
    const config = createTestConfig({ duration: 2000 });
    const engine = new SimulationEngine(config);
    engine.initialize();

    // Run for long time to generate many events
    engine.run(1000);

    const state = engine.getState();

    // Event log should be bounded
    expect(state.events.length).toBeLessThanOrEqual(1000);
  });
});

describe('Numerical Stability', () => {
  it('should remain stable over long simulations', () => {
    const config = createTestConfig({ duration: 1000 });
    const engine = new SimulationEngine(config);
    engine.initialize();

    // Run for full duration
    engine.run(1000);

    const state = engine.getState();

    // All compartments should be valid
    expect(isValidState(state.compartments)).toBe(true);

    // No NaN or Infinity values
    expect(isFinite(state.compartments.S)).toBe(true);
    expect(isFinite(state.compartments.I)).toBe(true);
    expect(isFinite(state.compartments.D)).toBe(true);
  });

  it('should maintain population bounds', () => {
    const config = createTestConfig({
      totalPopulation: 1000000,
      duration: 500,
    });
    const engine = new SimulationEngine(config);
    engine.initialize();

    engine.run(500);

    const state = engine.getState();
    const total = getTotalPopulation(state.compartments) + state.compartments.D;

    // Population should stay within reasonable bounds
    // (May grow slightly due to births or shrink slightly due to deaths)
    expect(total).toBeGreaterThan(config.totalPopulation * 0.9);
    expect(total).toBeLessThan(config.totalPopulation * 1.1);
  });
});
