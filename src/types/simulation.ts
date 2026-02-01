/**
 * TB Simulation Type Definitions
 * Core types for the epidemiological simulation engine
 */

/**
 * SEIR compartment state representing disease progression
 */
export interface CompartmentState {
  /** Susceptible - never infected, unvaccinated */
  S: number;
  /** Vaccinated - BCG vaccinated with partial protection */
  V: number;
  /** Exposed High-risk - recently infected, higher progression risk */
  E_H: number;
  /** Exposed Low-risk - latent TB, stable state */
  E_L: number;
  /** Infectious - active TB disease, can transmit */
  I: number;
  /** Recovered - treated or self-cured (can be reinfected) */
  R: number;
  /** Deceased - cumulative TB deaths */
  D: number;
}

/**
 * Time series data point for tracking simulation history
 */
export interface TimeSeriesPoint {
  /** Day number in simulation */
  day: number;
  /** Unix timestamp */
  timestamp: number;
  /** Compartment state at this point */
  compartments: CompartmentState;
  /** New infections this day */
  newInfections: number;
  /** New deaths this day */
  newDeaths: number;
  /** Infections prevented by vaccination this day */
  preventedInfections: number;
  /** Effective reproduction number */
  effectiveR: number;
  /** Vaccinations given this day */
  vaccinationsGiven: number;
}

/**
 * Derived metrics from simulation state
 */
export interface SimulationMetrics {
  // Cumulative totals
  totalInfections: number;
  totalDeaths: number;
  totalRecovered: number;
  totalVaccinated: number;

  // Prevented (counterfactual comparison)
  infectionsPrevented: number;
  deathsPrevented: number;

  // Current rates
  currentIncidenceRate: number; // per 100,000
  currentPrevalence: number; // Active cases / population
  effectiveR: number; // Current reproduction number

  // WHO targets
  whoTargetProgress: number; // % toward 2035 elimination
  lowIncidenceStatus: boolean; // Below 10/100,000
}

/**
 * Simulation event for logging and visualization
 */
export interface SimulationEvent {
  id: string;
  day: number;
  type:
    | 'infection'
    | 'recovery'
    | 'death'
    | 'vaccination'
    | 'policy_change'
    | 'outbreak';
  description: string;
  location?: string;
  details: Record<string, unknown>;
}

/**
 * Current simulation state
 */
export interface SimulationState {
  /** Current day in simulation */
  currentDay: number;
  /** Current simulated date */
  currentTime: Date;
  /** Total compartment counts */
  compartments: CompartmentState;
  /** State by region */
  regionStates: Map<string, RegionState>;
  /** State by population group */
  groupStates: Map<string, CompartmentState>;
  /** Historical time series */
  history: TimeSeriesPoint[];
  /** Event log */
  events: SimulationEvent[];
  /** Derived metrics */
  metrics: SimulationMetrics;
  /** Simulation status */
  status: 'idle' | 'running' | 'paused' | 'completed';
  /** Playback speed multiplier */
  speed: number;
}

/**
 * Region-specific state
 */
export interface RegionState {
  regionId: string;
  compartments: CompartmentState;
  population: number;
  incidenceRate: number;
}

/**
 * Disease parameters for SEIR model
 */
export interface DiseaseParameters {
  /** Transmission rate per contact */
  beta: number;
  /** Fast progression rate (E_H -> I) */
  epsilon: number;
  /** Stabilization rate (E_H -> E_L) */
  kappa: number;
  /** Reactivation rate (E_L -> I) */
  omega: number;
  /** Recovery rate */
  gamma: number;
  /** Natural mortality rate */
  mu: number;
  /** TB mortality rate */
  muTb: number;
  /** Vaccination rate */
  rho: number;
  /** Vaccine efficacy */
  ve: number;
  /** Reinfection susceptibility */
  sigma: number;
}

/**
 * Complete simulation configuration
 */
export interface SimulationConfig {
  id: string;
  name: string;
  description: string;

  // Time settings
  /** Total days to simulate */
  duration: number;
  /** Integration time step (days) */
  timeStep: number;
  /** UI update interval (ms) */
  displayInterval: number;

  // Population settings
  totalPopulation: number;
  populationGroups: PopulationGroupConfig[];
  ageDistribution: AgeDistribution;

  // Geographic settings
  regions: RegionConfig[];
  /** Inter-region mixing coefficient (0-1) */
  interRegionMixing: number;

  // Disease parameters
  diseaseParams: DiseaseParameters;

  // Vaccination settings
  vaccinationPolicy: VaccinationPolicy;

  // Policy interventions
  activeInterventions: PolicyIntervention[];

  // Initial conditions
  initialInfected: number;
  initialLatent: number;
  importedCasesPerDay: number;

  // Visualization
  visualizationMode: 'aggregate' | 'agent-based' | 'map';
  showTransmissionEvents: boolean;
}

/**
 * Population group configuration
 */
export interface PopulationGroupConfig {
  id: string;
  label: string;
  /** Fraction of total population */
  proportion: number;
  characteristics: {
    ukBorn: boolean;
    countryOfOrigin?: string;
    /** TB incidence in origin country (per 100,000) */
    tbIncidenceAtOrigin?: number;
    yearsInUK?: number;
  };
  vaccinationCoverage: number;
  contactPattern: ContactPattern;
}

/**
 * Contact pattern between population groups
 */
export interface ContactPattern {
  /** Average daily contacts */
  dailyContacts: number;
  /** Proportion of contacts within same group */
  withinGroupMixing: number;
  /** Contact settings breakdown */
  settings: {
    household: number;
    workplace: number;
    school: number;
    community: number;
    healthcare: number;
  };
}

/**
 * Age distribution configuration
 */
export interface AgeDistribution {
  '0-4': number;
  '5-14': number;
  '15-24': number;
  '25-44': number;
  '45-64': number;
  '65+': number;
}

/**
 * Region configuration
 */
export interface RegionConfig {
  id: string;
  name: string;
  population: number;
  area: number; // km²
  density: number; // per km²
  urbanization: number; // 0-1
  deprivationIndex: number; // 1-10 (IMD decile)
  tbIncidenceRate: number; // per 100,000
  vaccinationCoverage: number;
  healthcareCapacity: number;
}

/**
 * Vaccination policy configuration
 */
export interface VaccinationPolicy {
  neonatalBCG: {
    enabled: boolean;
    coverageTarget: number;
    eligibilityCriteria: 'universal' | 'risk-based' | 'none';
    /** Parent from country with incidence > threshold */
    riskBasedThreshold: number;
  };
  healthcareWorkerBCG: {
    enabled: boolean;
    coverageTarget: number;
  };
  immigrantScreening: {
    enabled: boolean;
    /** Screen if from country with > threshold/100k */
    screeningCountryThreshold: number;
    efficacy: number;
  };
  catchUpVaccination: {
    enabled: boolean;
    targetAgeGroup: [number, number];
    coverageTarget: number;
  };
}

/**
 * Policy intervention configuration
 */
export interface PolicyIntervention {
  id: string;
  type: PolicyType;
  name: string;
  description: string;
  /** Day intervention starts */
  startDay: number;
  /** Day intervention ends (undefined = indefinite) */
  endDay?: number;
  parameters: Record<string, number | boolean | string>;
  /** Effect multiplier on R0 (e.g., 0.8 = 20% reduction) */
  effectOnR0: number;
}

/**
 * Available policy intervention types
 */
export type PolicyType =
  | 'pre_entry_screening'
  | 'active_case_finding'
  | 'contact_tracing'
  | 'directly_observed_therapy'
  | 'latent_tb_treatment'
  | 'universal_bcg'
  | 'healthcare_worker_bcg'
  | 'border_health_checks'
  | 'public_awareness_campaign';

/**
 * Pre-built scenario preset
 */
export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<SimulationConfig>;
  expectedOutcome: string;
}
