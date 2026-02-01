/**
 * Simulation Store - Zustand State Management for TB Simulation
 *
 * This store manages the complete simulation state including:
 * - Simulation configuration
 * - Current simulation state (compartments, metrics, events)
 * - Playback controls (start, pause, resume, reset)
 * - Comparison mode for baseline analysis
 *
 * @module stores/simulation-store
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  SimulationConfig,
  SimulationState,
  CompartmentState,
  SimulationMetrics,
  DiseaseParameters,
  VaccinationPolicy,
  ScenarioPreset,
} from '@/types/simulation';

/**
 * Simulation store interface defining state and actions
 */
export interface SimulationStore {
  // ============ STATE ============

  /** Current simulation configuration */
  config: SimulationConfig;

  /** Current simulation state */
  state: SimulationState;

  /** Whether comparison mode is enabled */
  comparisonEnabled: boolean;

  /** Baseline state for comparison (when comparison mode is active) */
  baselineState: SimulationState | null;

  // ============ ACTIONS ============

  /**
   * Merge partial config updates into current configuration
   * @param config - Partial configuration to merge
   */
  setConfig: (config: Partial<SimulationConfig>) => void;

  /**
   * Initialize simulation with current configuration
   * Sets up initial compartment states based on config
   */
  initialize: () => void;

  /**
   * Start the simulation
   * Changes status from 'idle' to 'running'
   */
  start: () => void;

  /**
   * Pause the running simulation
   * Changes status from 'running' to 'paused'
   */
  pause: () => void;

  /**
   * Resume a paused simulation
   * Changes status from 'paused' to 'running'
   */
  resume: () => void;

  /**
   * Reset simulation to initial state
   * Clears history and events, resets compartments
   */
  reset: () => void;

  /**
   * Advance simulation by one time step
   * Used for manual step-through debugging
   */
  step: () => void;

  /**
   * Update playback speed multiplier
   * @param speed - Speed multiplier (1 = normal, 2 = 2x, etc.)
   */
  setSpeed: (speed: number) => void;

  /**
   * Load a pre-built scenario by ID
   * @param scenarioId - ID of the scenario preset to load
   */
  loadScenario: (scenarioId: string) => void;

  /**
   * Update simulation state (typically called from worker)
   * @param newState - Partial state update to merge
   */
  updateState: (newState: Partial<SimulationState>) => void;

  /**
   * Enable or disable comparison mode
   * @param enable - Whether to enable comparison mode
   */
  enableComparison: (enable: boolean) => void;

  /**
   * Set the baseline state for comparison
   * @param state - Baseline simulation state or null to clear
   */
  setBaselineState: (state: SimulationState | null) => void;
}

// ============ DEFAULT VALUES ============

/**
 * Default disease parameters based on UK TB epidemiology
 * Values derived from UKHSA TB reports and WHO guidelines
 */
const DEFAULT_DISEASE_PARAMS: DiseaseParameters = {
  /** Transmission rate per contact per day */
  beta: 0.0001,
  /** Fast progression rate (E_H -> I): ~5% progress in 2 years */
  epsilon: 0.0014,
  /** Stabilization rate (E_H -> E_L): move to low-risk latent */
  kappa: 0.001,
  /** Reactivation rate (E_L -> I): lifetime ~5-10% */
  omega: 0.0001,
  /** Recovery rate (treatment ~6 months) */
  gamma: 1 / 180,
  /** Natural mortality rate (UK life expectancy ~81 years) */
  mu: 1 / (81 * 365),
  /** TB-specific mortality rate */
  muTb: 0.04 / 365,
  /** Vaccination rate (neonatal coverage ~89%) */
  rho: 0.89 / 365,
  /** BCG vaccine efficacy (~70% for childhood TB) */
  ve: 0.7,
  /** Reinfection susceptibility (partial immunity from prior infection) */
  sigma: 0.3,
};

/**
 * Default vaccination policy reflecting current UK practice
 * Risk-based neonatal BCG since 2005
 */
const DEFAULT_VACCINATION_POLICY: VaccinationPolicy = {
  neonatalBCG: {
    enabled: true,
    coverageTarget: 0.89,
    eligibilityCriteria: 'risk-based',
    riskBasedThreshold: 40, // Countries with >40/100,000 incidence
  },
  healthcareWorkerBCG: {
    enabled: true,
    coverageTarget: 0.95,
  },
  immigrantScreening: {
    enabled: true,
    screeningCountryThreshold: 150,
    efficacy: 0.70,
  },
  catchUpVaccination: {
    enabled: false,
    targetAgeGroup: [0, 5],
    coverageTarget: 0,
  },
};

/**
 * Default compartment state based on UK population (~67 million)
 * Approximately 5,500 active cases, 100,000 latent infections
 */
const DEFAULT_COMPARTMENTS: CompartmentState = {
  S: 56_000_000, // Susceptible
  V: 10_000_000, // Vaccinated (BCG coverage ~15% of population)
  E_H: 10_000, // Recent latent TB (high-risk)
  E_L: 90_000, // Stable latent TB (low-risk)
  I: 5_500, // Active TB cases
  R: 900_000, // Recovered/treated
  D: 0, // Deaths (cumulative for simulation)
};

/**
 * Default simulation metrics
 */
const DEFAULT_METRICS: SimulationMetrics = {
  totalInfections: 0,
  totalDeaths: 0,
  totalRecovered: 0,
  totalVaccinated: 0,
  infectionsPrevented: 0,
  deathsPrevented: 0,
  currentIncidenceRate: 9.5, // UK 2024 rate per 100,000
  currentPrevalence: 5500 / 67_000_000,
  effectiveR: 1.1,
  whoTargetProgress: 0,
  lowIncidenceStatus: true, // UK is below 10/100,000
};

/**
 * Default simulation configuration
 */
const DEFAULT_CONFIG: SimulationConfig = {
  id: 'default',
  name: 'UK TB Simulation',
  description: 'Default UK tuberculosis simulation with current policies',

  // Time settings
  duration: 3650, // 10 years
  timeStep: 1, // 1 day integration step
  displayInterval: 50, // 50ms UI updates

  // Population
  totalPopulation: 67_000_000,
  populationGroups: [
    {
      id: 'uk-born',
      label: 'UK Born',
      proportion: 0.86,
      characteristics: {
        ukBorn: true,
      },
      vaccinationCoverage: 0.15,
      contactPattern: {
        dailyContacts: 10,
        withinGroupMixing: 0.7,
        settings: {
          household: 0.3,
          workplace: 0.3,
          school: 0.1,
          community: 0.25,
          healthcare: 0.05,
        },
      },
    },
    {
      id: 'non-uk-born',
      label: 'Non-UK Born',
      proportion: 0.14,
      characteristics: {
        ukBorn: false,
        tbIncidenceAtOrigin: 150,
        yearsInUK: 5,
      },
      vaccinationCoverage: 0.6,
      contactPattern: {
        dailyContacts: 12,
        withinGroupMixing: 0.5,
        settings: {
          household: 0.35,
          workplace: 0.25,
          school: 0.1,
          community: 0.25,
          healthcare: 0.05,
        },
      },
    },
  ],
  ageDistribution: {
    '0-4': 0.056,
    '5-14': 0.115,
    '15-24': 0.115,
    '25-44': 0.268,
    '45-64': 0.252,
    '65+': 0.194,
  },

  // Geographic
  regions: [
    {
      id: 'london',
      name: 'London',
      population: 9_000_000,
      area: 1572,
      density: 5727,
      urbanization: 1.0,
      deprivationIndex: 4,
      tbIncidenceRate: 20.6,
      vaccinationCoverage: 0.92,
      healthcareCapacity: 0.9,
    },
    {
      id: 'west-midlands',
      name: 'West Midlands',
      population: 5_950_000,
      area: 13004,
      density: 458,
      urbanization: 0.85,
      deprivationIndex: 5,
      tbIncidenceRate: 8.5,
      vaccinationCoverage: 0.88,
      healthcareCapacity: 0.85,
    },
    {
      id: 'rest-of-england',
      name: 'Rest of England',
      population: 52_050_000,
      area: 117000,
      density: 445,
      urbanization: 0.75,
      deprivationIndex: 5,
      tbIncidenceRate: 7.0,
      vaccinationCoverage: 0.85,
      healthcareCapacity: 0.8,
    },
  ],
  interRegionMixing: 0.1,

  // Disease parameters
  diseaseParams: DEFAULT_DISEASE_PARAMS,

  // Vaccination policy
  vaccinationPolicy: DEFAULT_VACCINATION_POLICY,

  // Interventions
  activeInterventions: [],

  // Initial conditions
  initialInfected: 5500,
  initialLatent: 100000,
  importedCasesPerDay: 10,

  // Visualization
  visualizationMode: 'aggregate',
  showTransmissionEvents: false,
};

/**
 * Default simulation state
 */
const DEFAULT_STATE: SimulationState = {
  currentDay: 0,
  currentTime: new Date(),
  compartments: DEFAULT_COMPARTMENTS,
  regionStates: new Map(),
  groupStates: new Map(),
  history: [],
  events: [],
  metrics: DEFAULT_METRICS,
  status: 'idle',
  speed: 1,
};

/**
 * Pre-built scenario presets for quick loading
 */
const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  'current-trajectory': {
    id: 'current-trajectory',
    name: 'Current Trajectory',
    description: 'Continue with unchanged policies and current vaccination rates',
    icon: 'trending-up',
    config: {
      name: 'Current Trajectory',
      description: 'Simulation with current UK TB policies unchanged',
    },
    expectedOutcome: 'Gradual increase in TB incidence over 10 years',
  },
  'universal-bcg': {
    id: 'universal-bcg',
    name: 'Universal BCG',
    description: 'Return to universal neonatal BCG vaccination for all newborns',
    icon: 'shield',
    config: {
      name: 'Universal BCG Vaccination',
      description: 'Universal neonatal BCG for all UK newborns',
      vaccinationPolicy: {
        ...DEFAULT_VACCINATION_POLICY,
        neonatalBCG: {
          enabled: true,
          coverageTarget: 0.95,
          eligibilityCriteria: 'universal',
          riskBasedThreshold: 0,
        },
      },
    },
    expectedOutcome: 'Reduction in childhood TB cases within 5-10 years',
  },
  'enhanced-screening': {
    id: 'enhanced-screening',
    name: 'Enhanced Screening',
    description: 'Mandatory TB screening for all visa applicants',
    icon: 'search',
    config: {
      name: 'Enhanced Screening',
      description: 'Comprehensive pre-entry and post-entry TB screening',
      vaccinationPolicy: {
        ...DEFAULT_VACCINATION_POLICY,
        immigrantScreening: {
          enabled: true,
          screeningCountryThreshold: 40,
          efficacy: 0.85,
        },
      },
      activeInterventions: [
        {
          id: 'pre-entry-screening',
          type: 'pre_entry_screening',
          name: 'Pre-Entry TB Screening',
          description: 'Mandatory screening for all visa applicants',
          startDay: 0,
          parameters: {
            coverage: 0.95,
            sensitivity: 0.85,
          },
          effectOnR0: 0.85,
        },
      ],
    },
    expectedOutcome: 'Reduced imported cases and faster case detection',
  },
  'who-elimination': {
    id: 'who-elimination',
    name: 'WHO Elimination Strategy',
    description: 'Full implementation of WHO End TB Strategy interventions',
    icon: 'target',
    config: {
      name: 'WHO Elimination Strategy',
      description: 'Comprehensive End TB Strategy implementation',
      vaccinationPolicy: {
        ...DEFAULT_VACCINATION_POLICY,
        neonatalBCG: {
          enabled: true,
          coverageTarget: 0.95,
          eligibilityCriteria: 'universal',
          riskBasedThreshold: 0,
        },
        catchUpVaccination: {
          enabled: true,
          targetAgeGroup: [0, 16],
          coverageTarget: 0.90,
        },
      },
      activeInterventions: [
        {
          id: 'active-case-finding',
          type: 'active_case_finding',
          name: 'Active Case Finding',
          description: 'Proactive TB screening in high-risk communities',
          startDay: 0,
          parameters: { coverage: 0.80 },
          effectOnR0: 0.85,
        },
        {
          id: 'contact-tracing',
          type: 'contact_tracing',
          name: 'Enhanced Contact Tracing',
          description: 'Comprehensive contact investigation',
          startDay: 0,
          parameters: { contactsPerCase: 10 },
          effectOnR0: 0.90,
        },
        {
          id: 'latent-treatment',
          type: 'latent_tb_treatment',
          name: 'Latent TB Treatment',
          description: 'Preventive treatment for latent TB',
          startDay: 0,
          parameters: { coverage: 0.70, efficacy: 0.90 },
          effectOnR0: 0.80,
        },
      ],
    },
    expectedOutcome: 'Achieve WHO low-incidence target (<10/100k) within 10 years',
  },
  'no-intervention': {
    id: 'no-intervention',
    name: 'No Intervention',
    description: 'Worst case: cessation of all TB control programs',
    icon: 'alert-triangle',
    config: {
      name: 'No Intervention (Worst Case)',
      description: 'Simulation without any TB control interventions',
      vaccinationPolicy: {
        neonatalBCG: {
          enabled: false,
          coverageTarget: 0,
          eligibilityCriteria: 'none',
          riskBasedThreshold: 0,
        },
        healthcareWorkerBCG: {
          enabled: false,
          coverageTarget: 0,
        },
        immigrantScreening: {
          enabled: false,
          screeningCountryThreshold: 0,
          efficacy: 0,
        },
        catchUpVaccination: {
          enabled: false,
          targetAgeGroup: [0, 0],
          coverageTarget: 0,
        },
      },
      activeInterventions: [],
    },
    expectedOutcome: 'Significant increase in TB incidence and mortality',
  },
};

/**
 * Create initial region states based on configuration
 */
function createInitialRegionStates(
  config: SimulationConfig
): Map<string, { regionId: string; compartments: CompartmentState; population: number; incidenceRate: number }> {
  const regionStates = new Map();

  for (const region of config.regions) {
    const populationFraction = region.population / config.totalPopulation;

    regionStates.set(region.id, {
      regionId: region.id,
      compartments: {
        S: Math.round(DEFAULT_COMPARTMENTS.S * populationFraction),
        V: Math.round(DEFAULT_COMPARTMENTS.V * populationFraction),
        E_H: Math.round(DEFAULT_COMPARTMENTS.E_H * populationFraction),
        E_L: Math.round(DEFAULT_COMPARTMENTS.E_L * populationFraction),
        I: Math.round(DEFAULT_COMPARTMENTS.I * populationFraction),
        R: Math.round(DEFAULT_COMPARTMENTS.R * populationFraction),
        D: 0,
      },
      population: region.population,
      incidenceRate: region.tbIncidenceRate,
    });
  }

  return regionStates;
}

/**
 * Create initial group states based on configuration
 */
function createInitialGroupStates(
  config: SimulationConfig
): Map<string, CompartmentState> {
  const groupStates = new Map();

  for (const group of config.populationGroups) {
    groupStates.set(group.id, {
      S: Math.round(DEFAULT_COMPARTMENTS.S * group.proportion),
      V: Math.round(DEFAULT_COMPARTMENTS.V * group.proportion),
      E_H: Math.round(DEFAULT_COMPARTMENTS.E_H * group.proportion),
      E_L: Math.round(DEFAULT_COMPARTMENTS.E_L * group.proportion),
      I: Math.round(DEFAULT_COMPARTMENTS.I * group.proportion),
      R: Math.round(DEFAULT_COMPARTMENTS.R * group.proportion),
      D: 0,
    });
  }

  return groupStates;
}

/**
 * Deep merge utility for simulation configuration objects
 * Recursively merges nested objects while replacing arrays and primitives
 */
function mergeConfig(
  target: SimulationConfig,
  source: Partial<SimulationConfig>
): SimulationConfig {
  const result: SimulationConfig = { ...target };

  // Handle each top-level property explicitly for type safety
  if (source.id !== undefined) result.id = source.id;
  if (source.name !== undefined) result.name = source.name;
  if (source.description !== undefined) result.description = source.description;
  if (source.duration !== undefined) result.duration = source.duration;
  if (source.timeStep !== undefined) result.timeStep = source.timeStep;
  if (source.displayInterval !== undefined) result.displayInterval = source.displayInterval;
  if (source.totalPopulation !== undefined) result.totalPopulation = source.totalPopulation;
  if (source.populationGroups !== undefined) result.populationGroups = source.populationGroups;
  if (source.ageDistribution !== undefined) result.ageDistribution = source.ageDistribution;
  if (source.regions !== undefined) result.regions = source.regions;
  if (source.interRegionMixing !== undefined) result.interRegionMixing = source.interRegionMixing;
  if (source.activeInterventions !== undefined) result.activeInterventions = source.activeInterventions;
  if (source.initialInfected !== undefined) result.initialInfected = source.initialInfected;
  if (source.initialLatent !== undefined) result.initialLatent = source.initialLatent;
  if (source.importedCasesPerDay !== undefined) result.importedCasesPerDay = source.importedCasesPerDay;
  if (source.visualizationMode !== undefined) result.visualizationMode = source.visualizationMode;
  if (source.showTransmissionEvents !== undefined) result.showTransmissionEvents = source.showTransmissionEvents;

  // Deep merge nested objects
  if (source.diseaseParams !== undefined) {
    result.diseaseParams = { ...target.diseaseParams, ...source.diseaseParams };
  }

  if (source.vaccinationPolicy !== undefined) {
    result.vaccinationPolicy = {
      neonatalBCG: {
        ...target.vaccinationPolicy.neonatalBCG,
        ...source.vaccinationPolicy.neonatalBCG,
      },
      healthcareWorkerBCG: {
        ...target.vaccinationPolicy.healthcareWorkerBCG,
        ...source.vaccinationPolicy.healthcareWorkerBCG,
      },
      immigrantScreening: {
        ...target.vaccinationPolicy.immigrantScreening,
        ...source.vaccinationPolicy.immigrantScreening,
      },
      catchUpVaccination: {
        ...target.vaccinationPolicy.catchUpVaccination,
        ...source.vaccinationPolicy.catchUpVaccination,
      },
    };
  }

  return result;
}

/**
 * Zustand store for simulation state management
 *
 * Uses devtools middleware for debugging and subscribeWithSelector
 * for optimized component subscriptions.
 *
 * @example
 * ```tsx
 * import { useSimulationStore } from '@/stores/simulation-store';
 *
 * function SimulationControls() {
 *   const { start, pause, reset, state } = useSimulationStore();
 *
 *   return (
 *     <div>
 *       <button onClick={start}>Start</button>
 *       <button onClick={pause}>Pause</button>
 *       <button onClick={reset}>Reset</button>
 *       <p>Day: {state.currentDay}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Subscribe to specific state slice for performance
 * const currentDay = useSimulationStore((state) => state.state.currentDay);
 * const compartments = useSimulationStore((state) => state.state.compartments);
 * ```
 */
export const useSimulationStore = create<SimulationStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ============ INITIAL STATE ============

      config: DEFAULT_CONFIG,
      state: DEFAULT_STATE,
      comparisonEnabled: false,
      baselineState: null,

      // ============ ACTIONS ============

      setConfig: (partialConfig) => {
        set(
          (store) => ({
            config: mergeConfig(store.config, partialConfig),
          }),
          false,
          'setConfig'
        );
      },

      initialize: () => {
        const { config } = get();

        const initialState: SimulationState = {
          currentDay: 0,
          currentTime: new Date(),
          compartments: { ...DEFAULT_COMPARTMENTS },
          regionStates: createInitialRegionStates(config),
          groupStates: createInitialGroupStates(config),
          history: [],
          events: [],
          metrics: {
            ...DEFAULT_METRICS,
            currentIncidenceRate:
              (config.initialInfected / config.totalPopulation) * 100_000,
          },
          status: 'idle',
          speed: 1,
        };

        set({ state: initialState }, false, 'initialize');
      },

      start: () => {
        const { state } = get();

        if (state.status === 'idle' || state.status === 'paused') {
          set(
            (store) => ({
              state: {
                ...store.state,
                status: 'running',
              },
            }),
            false,
            'start'
          );
        }
      },

      pause: () => {
        const { state } = get();

        if (state.status === 'running') {
          set(
            (store) => ({
              state: {
                ...store.state,
                status: 'paused',
              },
            }),
            false,
            'pause'
          );
        }
      },

      resume: () => {
        const { state } = get();

        if (state.status === 'paused') {
          set(
            (store) => ({
              state: {
                ...store.state,
                status: 'running',
              },
            }),
            false,
            'resume'
          );
        }
      },

      reset: () => {
        const { config } = get();

        const resetState: SimulationState = {
          currentDay: 0,
          currentTime: new Date(),
          compartments: { ...DEFAULT_COMPARTMENTS },
          regionStates: createInitialRegionStates(config),
          groupStates: createInitialGroupStates(config),
          history: [],
          events: [],
          metrics: { ...DEFAULT_METRICS },
          status: 'idle',
          speed: 1,
        };

        set({ state: resetState }, false, 'reset');
      },

      step: () => {
        const { state, config } = get();

        if (state.status !== 'completed' && state.currentDay < config.duration) {
          set(
            (store) => ({
              state: {
                ...store.state,
                currentDay: store.state.currentDay + 1,
                currentTime: new Date(
                  store.state.currentTime.getTime() + 24 * 60 * 60 * 1000
                ),
              },
            }),
            false,
            'step'
          );
        }
      },

      setSpeed: (speed) => {
        // Clamp speed between 0.1x and 10x
        const clampedSpeed = Math.max(0.1, Math.min(10, speed));

        set(
          (store) => ({
            state: {
              ...store.state,
              speed: clampedSpeed,
            },
          }),
          false,
          'setSpeed'
        );
      },

      loadScenario: (scenarioId) => {
        const scenario = SCENARIO_PRESETS[scenarioId];

        if (!scenario) {
          console.warn(`Scenario "${scenarioId}" not found`);
          return;
        }

        // Merge scenario config with defaults
        const newConfig = mergeConfig(DEFAULT_CONFIG, scenario.config);

        // Initialize with new config
        const initialState: SimulationState = {
          currentDay: 0,
          currentTime: new Date(),
          compartments: { ...DEFAULT_COMPARTMENTS },
          regionStates: createInitialRegionStates(newConfig),
          groupStates: createInitialGroupStates(newConfig),
          history: [],
          events: [],
          metrics: {
            ...DEFAULT_METRICS,
            currentIncidenceRate:
              (newConfig.initialInfected / newConfig.totalPopulation) * 100_000,
          },
          status: 'idle',
          speed: 1,
        };

        set(
          {
            config: newConfig,
            state: initialState,
          },
          false,
          `loadScenario/${scenarioId}`
        );
      },

      updateState: (newState) => {
        set(
          (store) => ({
            state: {
              ...store.state,
              ...newState,
            },
          }),
          false,
          'updateState'
        );
      },

      enableComparison: (enable) => {
        set({ comparisonEnabled: enable }, false, 'enableComparison');
      },

      setBaselineState: (baselineState) => {
        set({ baselineState }, false, 'setBaselineState');
      },
    })),
    {
      name: 'simulation-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============ SELECTORS ============

/**
 * Selector for current simulation status
 */
export const selectStatus = (store: SimulationStore) => store.state.status;

/**
 * Selector for current day
 */
export const selectCurrentDay = (store: SimulationStore) => store.state.currentDay;

/**
 * Selector for compartment state
 */
export const selectCompartments = (store: SimulationStore) =>
  store.state.compartments;

/**
 * Selector for simulation metrics
 */
export const selectMetrics = (store: SimulationStore) => store.state.metrics;

/**
 * Selector for playback speed
 */
export const selectSpeed = (store: SimulationStore) => store.state.speed;

/**
 * Selector for comparison data
 */
export const selectComparison = (store: SimulationStore) => ({
  enabled: store.comparisonEnabled,
  baseline: store.baselineState,
});

/**
 * Selector for vaccination policy
 */
export const selectVaccinationPolicy = (store: SimulationStore) =>
  store.config.vaccinationPolicy;

/**
 * Selector for active interventions
 */
export const selectActiveInterventions = (store: SimulationStore) =>
  store.config.activeInterventions;

// ============ EXPORTS ============

export { DEFAULT_CONFIG, DEFAULT_STATE, SCENARIO_PRESETS };
export type { ScenarioPreset };
