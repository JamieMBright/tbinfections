/**
 * TB Simulation Default Constants
 *
 * This module provides default values for the TB epidemiological simulation,
 * including disease parameters, vaccination policies, and visualization settings.
 * All values are based on published research and UK-specific TB data.
 *
 * @module simulation-constants
 */

import type {
  DiseaseParameters,
  VaccinationPolicy,
  SimulationConfig,
  PopulationGroupConfig,
  AgeDistribution,
  RegionConfig,
} from '@/types/simulation';

// =============================================================================
// TIME CONSTANTS
// =============================================================================

/**
 * Time-related constants for simulation calculations and display.
 *
 * These values standardize time calculations across the simulation engine
 * and provide consistent playback speed options.
 */
export const TIME_CONSTANTS = {
  /** Number of days in a year (non-leap year) */
  DAYS_PER_YEAR: 365,

  /** Number of months in a year */
  MONTHS_PER_YEAR: 12,

  /** Average days per month (365/12) */
  DAYS_PER_MONTH: 30.4167,

  /** Number of weeks in a year */
  WEEKS_PER_YEAR: 52,

  /** Default simulation time step in days */
  DEFAULT_TIME_STEP: 1,

  /** Minimum time step for numerical stability */
  MIN_TIME_STEP: 0.1,

  /** Maximum time step to prevent accuracy loss */
  MAX_TIME_STEP: 7,

  /**
   * Available simulation playback speed multipliers.
   * 1x = real-time (1 simulated day per second at 60fps)
   */
  PLAYBACK_SPEEDS: [1, 2, 5, 10] as const,

  /** Default playback speed multiplier */
  DEFAULT_SPEED: 1,

  /** UI update interval in milliseconds (targeting 60fps) */
  DEFAULT_DISPLAY_INTERVAL: 16,

  /** State update interval in milliseconds for worker communication */
  STATE_UPDATE_INTERVAL: 100,

  /** Default simulation duration in years */
  DEFAULT_DURATION_YEARS: 10,

  /** Default simulation duration in days (10 years) */
  DEFAULT_DURATION_DAYS: 3650,
} as const;

// =============================================================================
// DISEASE PARAMETERS
// =============================================================================

/**
 * Default disease parameters for TB SEIR model.
 *
 * These values are derived from epidemiological literature and calibrated
 * to match UK TB incidence patterns. Units are per-day rates unless otherwise noted.
 *
 * @remarks
 * Key parameter derivations:
 * - beta (0.0001): Calibrated to achieve R0 ~ 1.7 with UK contact patterns
 * - epsilon (0.0014): ~5% of high-risk latent progress to active in 2 years
 * - kappa (0.001): Stabilization from high-risk to low-risk latent state
 * - omega (0.0001): Lifetime reactivation risk of 5-10%
 * - gamma (1/180): 6-month standard TB treatment course
 * - mu (1/(80*365)): Based on UK life expectancy of ~80 years
 * - muTb (0.04/365): ~4% case fatality rate with treatment, annualized
 * - rho (0.001): Background vaccination rate (adjusted by policy)
 * - ve (0.7): BCG efficacy against pulmonary TB in childhood
 * - sigma (0.5): Partial susceptibility to reinfection after recovery
 *
 * @see https://www.who.int/teams/global-tuberculosis-programme
 */
export const DEFAULT_DISEASE_PARAMS: DiseaseParameters = {
  /** Transmission rate per contact per day */
  beta: 0.0001,

  /** Fast progression rate from E_H to I (per day) */
  epsilon: 0.0014,

  /** Stabilization rate from E_H to E_L (per day) */
  kappa: 0.001,

  /** Reactivation rate from E_L to I (per day) */
  omega: 0.0001,

  /** Recovery rate (1/180 = ~6 months treatment) */
  gamma: 1 / 180,

  /** Natural mortality rate (1/(80*365) = ~80 year life expectancy) */
  mu: 1 / (80 * 365),

  /** TB-specific mortality rate (4% case fatality, annualized) */
  muTb: 0.04 / 365,

  /** Background vaccination rate (per day) */
  rho: 0.001,

  /** Vaccine efficacy (70% protection) */
  ve: 0.7,

  /** Reinfection susceptibility (50% of naive susceptibility) */
  sigma: 0.5,
};

// =============================================================================
// VACCINATION POLICY
// =============================================================================

/**
 * Default vaccination policy reflecting current UK BCG guidelines.
 *
 * Since 2005, the UK has used a risk-based approach rather than universal BCG
 * vaccination. This policy targets:
 * - Neonates in high-risk areas or with family links to high-incidence countries
 * - Healthcare workers with potential TB exposure
 * - Immigrants from high-incidence countries (screening)
 *
 * @remarks
 * The risk-based threshold of 40/100,000 aligns with current UKHSA guidance
 * for determining high-incidence countries.
 *
 * @see UKHSA Tuberculosis in England 2025 Report
 */
export const DEFAULT_VACCINATION_POLICY: VaccinationPolicy = {
  neonatalBCG: {
    /** BCG vaccination at birth is enabled for eligible groups */
    enabled: true,
    /** Target 90% coverage among eligible neonates */
    coverageTarget: 0.9,
    /** Current UK policy: risk-based vaccination */
    eligibilityCriteria: 'risk-based',
    /** Vaccinate if parent from country with >40/100,000 incidence */
    riskBasedThreshold: 40,
  },
  healthcareWorkerBCG: {
    /** BCG offered to unvaccinated healthcare workers */
    enabled: true,
    /** Target 95% coverage among eligible HCWs */
    coverageTarget: 0.95,
  },
  immigrantScreening: {
    /** Pre-entry and port-of-arrival screening enabled */
    enabled: true,
    /** Screen arrivals from countries with >40/100,000 incidence */
    screeningCountryThreshold: 40,
    /** Screening program efficacy (detection rate) */
    efficacy: 0.7,
  },
  catchUpVaccination: {
    /** Catch-up vaccination currently not routine in UK */
    enabled: false,
    /** If enabled, target ages 5-16 */
    targetAgeGroup: [5, 16],
    /** Target coverage for catch-up program */
    coverageTarget: 0.8,
  },
};

// =============================================================================
// POPULATION CONFIGURATION
// =============================================================================

/**
 * UK age distribution based on ONS 2024 mid-year estimates.
 * Values represent proportions of total population.
 */
export const DEFAULT_AGE_DISTRIBUTION: AgeDistribution = {
  '0-4': 0.055,
  '5-14': 0.115,
  '15-24': 0.115,
  '25-44': 0.265,
  '45-64': 0.255,
  '65+': 0.195,
};

/**
 * Default population groups reflecting UK TB epidemiology.
 *
 * TB in the UK disproportionately affects non-UK-born individuals,
 * particularly those from high-incidence countries. These groups
 * have distinct risk profiles and contact patterns.
 */
export const DEFAULT_POPULATION_GROUPS: PopulationGroupConfig[] = [
  {
    id: 'uk-born',
    label: 'UK-Born',
    proportion: 0.85,
    characteristics: {
      ukBorn: true,
    },
    vaccinationCoverage: 0.3,
    contactPattern: {
      dailyContacts: 10,
      withinGroupMixing: 0.7,
      settings: {
        household: 0.25,
        workplace: 0.30,
        school: 0.15,
        community: 0.25,
        healthcare: 0.05,
      },
    },
  },
  {
    id: 'high-incidence-born',
    label: 'Born in High-Incidence Country',
    proportion: 0.10,
    characteristics: {
      ukBorn: false,
      tbIncidenceAtOrigin: 150,
      yearsInUK: 5,
    },
    vaccinationCoverage: 0.75,
    contactPattern: {
      dailyContacts: 12,
      withinGroupMixing: 0.5,
      settings: {
        household: 0.30,
        workplace: 0.25,
        school: 0.10,
        community: 0.30,
        healthcare: 0.05,
      },
    },
  },
  {
    id: 'low-incidence-born',
    label: 'Born in Low-Incidence Country',
    proportion: 0.05,
    characteristics: {
      ukBorn: false,
      tbIncidenceAtOrigin: 20,
      yearsInUK: 10,
    },
    vaccinationCoverage: 0.5,
    contactPattern: {
      dailyContacts: 10,
      withinGroupMixing: 0.4,
      settings: {
        household: 0.25,
        workplace: 0.30,
        school: 0.12,
        community: 0.28,
        healthcare: 0.05,
      },
    },
  },
];

/**
 * UK regions with TB-relevant statistics.
 *
 * Based on UKHSA 2024 TB notification data and ONS population estimates.
 * London has significantly higher incidence due to demographic factors.
 */
export const DEFAULT_REGIONS: RegionConfig[] = [
  {
    id: 'london',
    name: 'London',
    population: 9_000_000,
    area: 1572,
    density: 5727,
    urbanization: 1.0,
    deprivationIndex: 5,
    tbIncidenceRate: 20.6,
    vaccinationCoverage: 0.85,
    healthcareCapacity: 0.95,
  },
  {
    id: 'west-midlands',
    name: 'West Midlands',
    population: 5_950_000,
    area: 13000,
    density: 458,
    urbanization: 0.85,
    deprivationIndex: 6,
    tbIncidenceRate: 8.5,
    vaccinationCoverage: 0.82,
    healthcareCapacity: 0.88,
  },
  {
    id: 'north-west',
    name: 'North West',
    population: 7_400_000,
    area: 14165,
    density: 522,
    urbanization: 0.82,
    deprivationIndex: 6,
    tbIncidenceRate: 6.8,
    vaccinationCoverage: 0.80,
    healthcareCapacity: 0.85,
  },
  {
    id: 'yorkshire-humber',
    name: 'Yorkshire and the Humber',
    population: 5_500_000,
    area: 15411,
    density: 357,
    urbanization: 0.75,
    deprivationIndex: 5,
    tbIncidenceRate: 6.5,
    vaccinationCoverage: 0.78,
    healthcareCapacity: 0.82,
  },
  {
    id: 'east-midlands',
    name: 'East Midlands',
    population: 4_900_000,
    area: 15627,
    density: 314,
    urbanization: 0.68,
    deprivationIndex: 4,
    tbIncidenceRate: 5.8,
    vaccinationCoverage: 0.75,
    healthcareCapacity: 0.80,
  },
  {
    id: 'south-east',
    name: 'South East',
    population: 9_300_000,
    area: 19096,
    density: 487,
    urbanization: 0.72,
    deprivationIndex: 3,
    tbIncidenceRate: 5.5,
    vaccinationCoverage: 0.78,
    healthcareCapacity: 0.90,
  },
  {
    id: 'east',
    name: 'East of England',
    population: 6_300_000,
    area: 19120,
    density: 329,
    urbanization: 0.65,
    deprivationIndex: 3,
    tbIncidenceRate: 5.2,
    vaccinationCoverage: 0.76,
    healthcareCapacity: 0.85,
  },
  {
    id: 'south-west',
    name: 'South West',
    population: 5_700_000,
    area: 23837,
    density: 239,
    urbanization: 0.58,
    deprivationIndex: 3,
    tbIncidenceRate: 3.5,
    vaccinationCoverage: 0.72,
    healthcareCapacity: 0.82,
  },
  {
    id: 'north-east',
    name: 'North East',
    population: 2_650_000,
    area: 8592,
    density: 308,
    urbanization: 0.72,
    deprivationIndex: 7,
    tbIncidenceRate: 3.2,
    vaccinationCoverage: 0.70,
    healthcareCapacity: 0.78,
  },
];

// =============================================================================
// SIMULATION CONFIGURATION
// =============================================================================

/**
 * UK total population (2024 estimate).
 */
export const UK_POPULATION = 67_000_000;

/**
 * Complete default simulation configuration.
 *
 * This configuration represents the current UK TB situation with risk-based
 * BCG vaccination policy. It can be modified to explore counterfactual
 * scenarios and policy changes.
 *
 * @remarks
 * Initial conditions are calibrated to approximate current UK TB burden:
 * - ~4,500 active TB cases (infectious)
 * - ~600,000 latent TB infections
 * - ~1-2 imported cases per day
 */
export const DEFAULT_CONFIG: SimulationConfig = {
  /** Unique identifier for this configuration */
  id: 'default-uk-simulation',

  /** Human-readable name */
  name: 'UK TB Simulation (Default)',

  /** Configuration description */
  description:
    'Default UK TB simulation with current risk-based BCG policy, ' +
    'representing the baseline scenario for policy comparison.',

  // Time settings
  /** Simulation duration in days (10 years) */
  duration: TIME_CONSTANTS.DEFAULT_DURATION_DAYS,

  /** Integration time step in days */
  timeStep: TIME_CONSTANTS.DEFAULT_TIME_STEP,

  /** UI update interval in milliseconds */
  displayInterval: TIME_CONSTANTS.DEFAULT_DISPLAY_INTERVAL,

  // Population settings
  /** Total UK population */
  totalPopulation: UK_POPULATION,

  /** Population group configurations */
  populationGroups: DEFAULT_POPULATION_GROUPS,

  /** Age distribution */
  ageDistribution: DEFAULT_AGE_DISTRIBUTION,

  // Geographic settings
  /** UK region configurations */
  regions: DEFAULT_REGIONS,

  /** Inter-region mixing coefficient (moderate mixing) */
  interRegionMixing: 0.1,

  // Disease parameters
  /** SEIR model parameters */
  diseaseParams: DEFAULT_DISEASE_PARAMS,

  // Vaccination settings
  /** Current UK vaccination policy */
  vaccinationPolicy: DEFAULT_VACCINATION_POLICY,

  // Policy interventions
  /** No additional interventions by default */
  activeInterventions: [],

  // Initial conditions
  /** Initial active TB cases (~4,500 based on UK data) */
  initialInfected: 4500,

  /** Initial latent TB infections (~600,000 estimate) */
  initialLatent: 600000,

  /** Imported cases per day (~1.5 based on pre-entry screening data) */
  importedCasesPerDay: 1.5,

  // Visualization
  /** Default to aggregate view */
  visualizationMode: 'aggregate',

  /** Show transmission events for educational purposes */
  showTransmissionEvents: true,
};

// =============================================================================
// VISUALIZATION DEFAULTS
// =============================================================================

/**
 * Color palette for each disease compartment.
 *
 * Colors are chosen for accessibility (distinguishable by color-blind users)
 * and semantic meaning (red = danger/infectious, green = recovered, etc.).
 */
export const COMPARTMENT_COLORS = {
  /** Susceptible: Blue - neutral, at-risk population */
  S: '#3B82F6',

  /** Vaccinated: Cyan/Teal - protected status */
  V: '#06B6D4',

  /** Exposed High-risk: Orange - warning, elevated risk */
  E_H: '#F97316',

  /** Exposed Low-risk: Yellow - mild warning, latent state */
  E_L: '#EAB308',

  /** Infectious: Red - danger, active disease */
  I: '#EF4444',

  /** Recovered: Green - positive outcome */
  R: '#22C55E',

  /** Deceased: Gray - somber, neutral */
  D: '#6B7280',
} as const;

/**
 * Display labels for each compartment.
 */
export const COMPARTMENT_LABELS = {
  S: 'Susceptible',
  V: 'Vaccinated',
  E_H: 'Exposed (High-risk)',
  E_L: 'Exposed (Low-risk)',
  I: 'Infectious',
  R: 'Recovered',
  D: 'Deceased',
} as const;

/**
 * Short labels for compact displays.
 */
export const COMPARTMENT_SHORT_LABELS = {
  S: 'S',
  V: 'V',
  E_H: 'EH',
  E_L: 'EL',
  I: 'I',
  R: 'R',
  D: 'D',
} as const;

/**
 * Visualization default settings for the simulation display.
 *
 * These settings control the appearance and behavior of charts,
 * animations, and the agent-based visualization.
 */
export const VISUALIZATION_DEFAULTS = {
  /** Colors for each disease compartment */
  compartmentColors: COMPARTMENT_COLORS,

  /** Display labels for compartments */
  compartmentLabels: COMPARTMENT_LABELS,

  /** Short labels for compact displays */
  compartmentShortLabels: COMPARTMENT_SHORT_LABELS,

  /** Animation configuration */
  animation: {
    /** Enable animations by default */
    enabled: true,

    /** Transition duration for state changes (ms) */
    transitionDuration: 300,

    /** Easing function for transitions */
    easing: 'easeInOut' as const,

    /** Frame rate target for WebGL rendering */
    targetFps: 60,

    /** Particle trail length for transmission events */
    trailLength: 10,
  },

  /** Agent visualization settings (PixiJS) */
  agents: {
    /** Default agent radius in pixels */
    defaultRadius: 4,

    /** Highlighted agent radius */
    highlightedRadius: 8,

    /** Maximum number of agents to render */
    maxAgents: 5000,

    /** Agent movement speed multiplier */
    movementSpeed: 0.5,

    /** Border width for agent sprites */
    borderWidth: 1,

    /** Border color (darker shade of compartment color) */
    borderDarkening: 0.3,
  },

  /** Transmission event visualization */
  transmission: {
    /** Line width for transmission events */
    lineWidth: 2,

    /** Transmission line color */
    lineColor: '#EF4444',

    /** Duration to show transmission event (ms) */
    displayDuration: 1000,

    /** Fade out duration (ms) */
    fadeDuration: 500,

    /** Maximum simultaneous transmission events to show */
    maxVisibleEvents: 50,
  },

  /** Chart configuration (Nivo) */
  charts: {
    /** Time series line chart settings */
    timeSeries: {
      /** Curve interpolation type */
      curve: 'monotoneX' as const,

      /** Enable chart points */
      enablePoints: false,

      /** Enable area fill under lines */
      enableArea: true,

      /** Area opacity */
      areaOpacity: 0.15,

      /** Line width */
      lineWidth: 2,

      /** Animation duration (ms) */
      animateMotion: 300,
    },

    /** Bar chart settings */
    bar: {
      /** Padding between bars */
      padding: 0.3,

      /** Enable value labels */
      enableLabels: true,

      /** Label skip width threshold */
      labelSkipWidth: 12,

      /** Border radius */
      borderRadius: 4,
    },

    /** Pie/donut chart settings */
    pie: {
      /** Inner radius for donut chart (0 for pie) */
      innerRadius: 0.5,

      /** Padding between slices */
      padAngle: 0.7,

      /** Corner radius */
      cornerRadius: 3,

      /** Enable arc labels */
      arcLabelsSkipAngle: 10,
    },

    /** Common axis settings */
    axis: {
      /** Tick size */
      tickSize: 5,

      /** Tick padding */
      tickPadding: 5,

      /** Tick rotation */
      tickRotation: 0,

      /** Legend offset */
      legendOffset: 36,
    },

    /** Color scheme for multi-series charts */
    colorScheme: 'category10' as const,

    /** Margin configuration */
    margin: {
      top: 20,
      right: 20,
      bottom: 50,
      left: 60,
    },
  },

  /** Map visualization settings */
  map: {
    /** Default map center (UK centroid) */
    center: [-2.5, 54.5] as [number, number],

    /** Default zoom level */
    defaultZoom: 5.5,

    /** Minimum zoom */
    minZoom: 4,

    /** Maximum zoom */
    maxZoom: 10,

    /** Region border color */
    borderColor: '#374151',

    /** Region border width */
    borderWidth: 0.5,

    /** Hover highlight opacity */
    hoverOpacity: 0.8,

    /** Color scale for incidence rates (low to high) */
    incidenceColorScale: ['#DCFCE7', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D'],
  },

  /** Tooltip settings */
  tooltips: {
    /** Enable tooltips */
    enabled: true,

    /** Delay before showing (ms) */
    showDelay: 200,

    /** Duration to show (ms) */
    duration: 5000,

    /** Animation type */
    animation: 'fade' as const,
  },

  /** Legend configuration */
  legend: {
    /** Show legend by default */
    visible: true,

    /** Legend position */
    position: 'bottom-right' as const,

    /** Legend orientation */
    orientation: 'vertical' as const,

    /** Item spacing */
    itemSpacing: 8,
  },
} as const;

// =============================================================================
// EPIDEMIOLOGICAL REFERENCE VALUES
// =============================================================================

/**
 * Reference values for TB epidemiology and WHO targets.
 */
export const EPIDEMIOLOGICAL_REFERENCE = {
  /** WHO low-incidence threshold (per 100,000) */
  WHO_LOW_INCIDENCE_THRESHOLD: 10,

  /** WHO pre-elimination threshold (per 100,000) */
  WHO_PRE_ELIMINATION_THRESHOLD: 1,

  /** WHO elimination threshold (per 100,000) */
  WHO_ELIMINATION_THRESHOLD: 0.1,

  /** UK current incidence rate (2024, per 100,000) */
  UK_CURRENT_INCIDENCE: 9.5,

  /** Basic reproduction number range for TB */
  R0_RANGE: {
    min: 1.3,
    max: 2.2,
    default: 1.7,
  },

  /** Proportion of latent TB that reactivates (lifetime) */
  LIFETIME_REACTIVATION_RISK: 0.1,

  /** Proportion progressing rapidly (within 2 years) */
  RAPID_PROGRESSION_RISK: 0.05,

  /** BCG efficacy range */
  BCG_EFFICACY: {
    neonatal: 0.86,
    childhood: 0.70,
    adult: 0.50,
  },

  /** WHO End TB Strategy 2035 targets */
  WHO_2035_TARGETS: {
    /** 95% reduction in deaths from 2015 baseline */
    deathReduction: 0.95,
    /** 90% reduction in incidence from 2015 baseline */
    incidenceReduction: 0.90,
    /** Zero catastrophic costs for TB patients */
    zeroCatastrophicCosts: true,
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Type for playback speed options
 */
export type PlaybackSpeed = (typeof TIME_CONSTANTS.PLAYBACK_SPEEDS)[number];

/**
 * Type for compartment identifiers
 */
export type CompartmentKey = keyof typeof COMPARTMENT_COLORS;

/**
 * Type for visualization mode options
 */
export type VisualizationMode = SimulationConfig['visualizationMode'];
