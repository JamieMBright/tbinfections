/**
 * Pre-built Scenario Constants for TB Simulation
 *
 * This module defines the five core scenarios for the UK TB vaccination simulator.
 * Each scenario represents a different policy approach with epidemiologically
 * accurate parameters based on UKHSA TB Reports and WHO guidelines.
 */

import type {
  ScenarioPreset,
  SimulationConfig,
  VaccinationPolicy,
  PolicyIntervention,
} from '@/types/simulation';

/**
 * Default vaccination policy representing current UK risk-based approach
 */
const DEFAULT_VACCINATION_POLICY: VaccinationPolicy = {
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
    screeningCountryThreshold: 40,
    efficacy: 0.7,
  },
  catchUpVaccination: {
    enabled: false,
    targetAgeGroup: [6, 16] as [number, number],
    coverageTarget: 0,
  },
};

/**
 * Universal BCG vaccination policy - all newborns vaccinated
 */
const UNIVERSAL_BCG_POLICY: VaccinationPolicy = {
  neonatalBCG: {
    enabled: true,
    coverageTarget: 0.95,
    eligibilityCriteria: 'universal',
    riskBasedThreshold: 0,
  },
  healthcareWorkerBCG: {
    enabled: true,
    coverageTarget: 0.98,
  },
  immigrantScreening: {
    enabled: true,
    screeningCountryThreshold: 40,
    efficacy: 0.7,
  },
  catchUpVaccination: {
    enabled: true,
    targetAgeGroup: [6, 16] as [number, number],
    coverageTarget: 0.8,
  },
};

/**
 * Enhanced screening policy - lower thresholds and higher efficacy
 */
const ENHANCED_SCREENING_POLICY: VaccinationPolicy = {
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
    screeningCountryThreshold: 20,
    efficacy: 0.9,
  },
  catchUpVaccination: {
    enabled: false,
    targetAgeGroup: [6, 16] as [number, number],
    coverageTarget: 0,
  },
};

/**
 * WHO elimination policy - all interventions at maximum effectiveness
 */
const WHO_ELIMINATION_POLICY: VaccinationPolicy = {
  neonatalBCG: {
    enabled: true,
    coverageTarget: 0.98,
    eligibilityCriteria: 'universal',
    riskBasedThreshold: 0,
  },
  healthcareWorkerBCG: {
    enabled: true,
    coverageTarget: 0.99,
  },
  immigrantScreening: {
    enabled: true,
    screeningCountryThreshold: 10,
    efficacy: 0.95,
  },
  catchUpVaccination: {
    enabled: true,
    targetAgeGroup: [0, 35] as [number, number],
    coverageTarget: 0.9,
  },
};

/**
 * No intervention policy - all TB control measures removed
 */
const NO_INTERVENTION_POLICY: VaccinationPolicy = {
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
    targetAgeGroup: [0, 0] as [number, number],
    coverageTarget: 0,
  },
};

/**
 * Standard policy interventions for current UK approach
 */
const CURRENT_INTERVENTIONS: PolicyIntervention[] = [
  {
    id: 'pre-entry-screening-current',
    type: 'pre_entry_screening',
    name: 'Pre-entry TB Screening',
    description: 'Screening for visa applicants from high-incidence countries',
    startDay: 0,
    parameters: {
      countryThreshold: 40,
      complianceRate: 0.85,
    },
    effectOnR0: 0.95,
  },
  {
    id: 'contact-tracing-current',
    type: 'contact_tracing',
    name: 'Contact Tracing',
    description: 'Standard contact investigation for active TB cases',
    startDay: 0,
    parameters: {
      tracingEfficiency: 0.65,
      averageContactsTraced: 8,
    },
    effectOnR0: 0.92,
  },
  {
    id: 'dot-current',
    type: 'directly_observed_therapy',
    name: 'Directly Observed Therapy',
    description: 'Standard DOTS program for TB treatment',
    startDay: 0,
    parameters: {
      coverageRate: 0.75,
      completionRate: 0.85,
    },
    effectOnR0: 0.88,
  },
];

/**
 * Enhanced policy interventions for screening-focused scenario
 */
const ENHANCED_SCREENING_INTERVENTIONS: PolicyIntervention[] = [
  {
    id: 'pre-entry-screening-enhanced',
    type: 'pre_entry_screening',
    name: 'Enhanced Pre-entry Screening',
    description: 'Mandatory screening with lower threshold and chest X-ray',
    startDay: 0,
    parameters: {
      countryThreshold: 20,
      complianceRate: 0.98,
      xrayRequired: true,
    },
    effectOnR0: 0.85,
  },
  {
    id: 'post-entry-screening',
    type: 'border_health_checks',
    name: 'Post-entry TB Screening',
    description: 'Follow-up screening for new migrants within 3 months',
    startDay: 0,
    parameters: {
      followUpRate: 0.9,
      screeningInterval: 90,
    },
    effectOnR0: 0.9,
  },
  {
    id: 'active-case-finding-enhanced',
    type: 'active_case_finding',
    name: 'Enhanced Active Case Finding',
    description: 'Targeted screening in high-risk communities',
    startDay: 0,
    parameters: {
      targetPopulations: 'homeless,prisoners,recent-migrants',
      screeningFrequency: 180,
    },
    effectOnR0: 0.88,
  },
  {
    id: 'contact-tracing-enhanced',
    type: 'contact_tracing',
    name: 'Enhanced Contact Tracing',
    description: 'Expanded contact investigation with genomic sequencing',
    startDay: 0,
    parameters: {
      tracingEfficiency: 0.85,
      averageContactsTraced: 15,
      genomicSequencing: true,
    },
    effectOnR0: 0.85,
  },
  {
    id: 'dot-enhanced',
    type: 'directly_observed_therapy',
    name: 'Enhanced DOTS Program',
    description: 'Video-observed therapy with digital adherence tools',
    startDay: 0,
    parameters: {
      coverageRate: 0.9,
      completionRate: 0.92,
      digitalTools: true,
    },
    effectOnR0: 0.82,
  },
];

/**
 * WHO elimination interventions - all measures at maximum
 */
const WHO_ELIMINATION_INTERVENTIONS: PolicyIntervention[] = [
  {
    id: 'universal-bcg-program',
    type: 'universal_bcg',
    name: 'Universal BCG Program',
    description: 'BCG vaccination for all newborns regardless of risk',
    startDay: 0,
    parameters: {
      coverageTarget: 0.98,
      catchUpToAge: 5,
    },
    effectOnR0: 0.75,
  },
  {
    id: 'pre-entry-screening-who',
    type: 'pre_entry_screening',
    name: 'Comprehensive Pre-entry Screening',
    description: 'Universal screening for all visa categories',
    startDay: 0,
    parameters: {
      countryThreshold: 10,
      complianceRate: 0.99,
      xrayRequired: true,
      latentTbTesting: true,
    },
    effectOnR0: 0.8,
  },
  {
    id: 'post-entry-screening-who',
    type: 'border_health_checks',
    name: 'Comprehensive Post-entry Screening',
    description: 'Mandatory follow-up for all new entrants',
    startDay: 0,
    parameters: {
      followUpRate: 0.98,
      screeningInterval: 60,
      latentTbTesting: true,
    },
    effectOnR0: 0.85,
  },
  {
    id: 'active-case-finding-who',
    type: 'active_case_finding',
    name: 'Comprehensive Active Case Finding',
    description: 'Community-wide screening with mobile units',
    startDay: 0,
    parameters: {
      targetPopulations: 'all-high-risk',
      screeningFrequency: 90,
      mobileUnits: true,
    },
    effectOnR0: 0.82,
  },
  {
    id: 'latent-tb-treatment',
    type: 'latent_tb_treatment',
    name: 'Latent TB Treatment Program',
    description: 'Systematic treatment of latent TB infection',
    startDay: 0,
    parameters: {
      eligibilityThreshold: 'all-contacts',
      treatmentRegimen: '3HP',
      completionTarget: 0.85,
    },
    effectOnR0: 0.75,
  },
  {
    id: 'contact-tracing-who',
    type: 'contact_tracing',
    name: 'Comprehensive Contact Tracing',
    description: 'Full genomic epidemiology with digital tools',
    startDay: 0,
    parameters: {
      tracingEfficiency: 0.95,
      averageContactsTraced: 20,
      genomicSequencing: true,
      digitalNotification: true,
    },
    effectOnR0: 0.78,
  },
  {
    id: 'dot-who',
    type: 'directly_observed_therapy',
    name: 'Universal DOTS Plus',
    description: 'Enhanced treatment with MDR-TB capacity',
    startDay: 0,
    parameters: {
      coverageRate: 0.98,
      completionRate: 0.95,
      mdrCapacity: true,
      digitalTools: true,
    },
    effectOnR0: 0.75,
  },
  {
    id: 'public-awareness',
    type: 'public_awareness_campaign',
    name: 'National TB Awareness Campaign',
    description: 'Public education and stigma reduction',
    startDay: 0,
    parameters: {
      reach: 0.8,
      frequencyPerYear: 4,
    },
    effectOnR0: 0.95,
  },
  {
    id: 'healthcare-worker-bcg',
    type: 'healthcare_worker_bcg',
    name: 'Healthcare Worker BCG Program',
    description: 'Universal BCG for all healthcare workers',
    startDay: 0,
    parameters: {
      coverageTarget: 0.99,
      boosterPolicy: true,
    },
    effectOnR0: 0.92,
  },
];

/**
 * Pre-built scenario presets for the UK TB vaccination simulator.
 *
 * Each scenario represents a different policy approach with epidemiologically
 * accurate parameters derived from UKHSA TB Reports and WHO guidelines.
 *
 * @remarks
 * - `current-trajectory`: Baseline continuation of existing UK policies
 * - `universal-bcg`: Universal neonatal BCG vaccination program
 * - `enhanced-screening`: Focus on improved screening and case finding
 * - `who-elimination`: All interventions to achieve WHO 2035 target
 * - `no-intervention`: Removal of all TB control measures (worst case)
 */
export const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'current-trajectory',
    name: 'Current Trajectory',
    description: 'Continuation of current UK TB policies and vaccination rates',
    icon: 'trending-up',
    expectedOutcome:
      'Rising incidence, risk of losing low-incidence status by 2030',
    config: {
      id: 'current-trajectory',
      name: 'Current Trajectory',
      description: 'Continuation of current UK TB policies and vaccination rates',
      duration: 3650, // 10 years
      timeStep: 1,
      displayInterval: 100,
      vaccinationPolicy: DEFAULT_VACCINATION_POLICY,
      activeInterventions: CURRENT_INTERVENTIONS,
      importedCasesPerDay: 4.5, // Based on ~1,650 annual imported cases
    },
  },
  {
    id: 'universal-bcg',
    name: 'Universal BCG',
    description: 'Universal neonatal BCG vaccination for all UK births',
    icon: 'shield-check',
    expectedOutcome:
      'Significant reduction in childhood TB cases, 30-40% decrease in overall incidence over 15 years',
    config: {
      id: 'universal-bcg',
      name: 'Universal BCG',
      description: 'Universal neonatal BCG vaccination for all UK births',
      duration: 5475, // 15 years to see vaccination effects
      timeStep: 1,
      displayInterval: 100,
      vaccinationPolicy: UNIVERSAL_BCG_POLICY,
      activeInterventions: [
        ...CURRENT_INTERVENTIONS,
        {
          id: 'universal-bcg-program',
          type: 'universal_bcg',
          name: 'Universal BCG Program',
          description: 'BCG vaccination for all newborns regardless of risk',
          startDay: 0,
          parameters: {
            coverageTarget: 0.95,
            catchUpToAge: 16,
          },
          effectOnR0: 0.8,
        },
      ],
      importedCasesPerDay: 4.5,
    },
  },
  {
    id: 'enhanced-screening',
    name: 'Enhanced Screening',
    description: 'Mandatory pre-entry and post-entry TB screening',
    icon: 'search',
    expectedOutcome:
      'Reduced imported cases by 40-50%, stabilization of incidence rate',
    config: {
      id: 'enhanced-screening',
      name: 'Enhanced Screening',
      description: 'Mandatory pre-entry and post-entry TB screening',
      duration: 3650, // 10 years
      timeStep: 1,
      displayInterval: 100,
      vaccinationPolicy: ENHANCED_SCREENING_POLICY,
      activeInterventions: ENHANCED_SCREENING_INTERVENTIONS,
      importedCasesPerDay: 2.5, // Reduced due to enhanced screening
    },
  },
  {
    id: 'who-elimination',
    name: 'WHO Elimination Target',
    description: 'All interventions to achieve WHO 2035 elimination target',
    icon: 'target',
    expectedOutcome:
      'Path to <1/100,000 incidence by 2035, achieving WHO elimination target',
    config: {
      id: 'who-elimination',
      name: 'WHO Elimination Target',
      description: 'All interventions to achieve WHO 2035 elimination target',
      duration: 4015, // Until 2035 (~11 years from 2024)
      timeStep: 1,
      displayInterval: 100,
      vaccinationPolicy: WHO_ELIMINATION_POLICY,
      activeInterventions: WHO_ELIMINATION_INTERVENTIONS,
      importedCasesPerDay: 1.5, // Significantly reduced
    },
  },
  {
    id: 'no-intervention',
    name: 'No Intervention',
    description: 'Removal of all TB control measures',
    icon: 'alert-triangle',
    expectedOutcome:
      'Exponential increase in TB cases, potential return to pre-BCG era incidence levels',
    config: {
      id: 'no-intervention',
      name: 'No Intervention',
      description: 'Removal of all TB control measures',
      duration: 3650, // 10 years
      timeStep: 1,
      displayInterval: 100,
      vaccinationPolicy: NO_INTERVENTION_POLICY,
      activeInterventions: [], // No active interventions
      importedCasesPerDay: 6.0, // Increased due to no screening
    },
  },
];

/**
 * Retrieves a scenario preset by its unique identifier.
 *
 * @param id - The unique identifier of the scenario (e.g., 'current-trajectory')
 * @returns The matching ScenarioPreset if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const scenario = getScenarioById('universal-bcg');
 * if (scenario) {
 *   console.log(scenario.name); // "Universal BCG"
 * }
 * ```
 */
export function getScenarioById(id: string): ScenarioPreset | undefined {
  return PRESET_SCENARIOS.find((scenario) => scenario.id === id);
}

/**
 * Retrieves the simulation configuration for a specific scenario.
 *
 * This function returns only the config portion of a scenario preset,
 * which can be merged with other configuration settings to create
 * a complete SimulationConfig.
 *
 * @param id - The unique identifier of the scenario
 * @returns Partial SimulationConfig if scenario found, undefined otherwise
 *
 * @example
 * ```typescript
 * const config = getScenarioConfig('who-elimination');
 * if (config) {
 *   // Merge with base configuration
 *   const fullConfig = { ...baseConfig, ...config };
 * }
 * ```
 */
export function getScenarioConfig(
  id: string
): Partial<SimulationConfig> | undefined {
  const scenario = getScenarioById(id);
  return scenario?.config;
}

/**
 * List of all available scenario IDs for validation purposes.
 */
export const SCENARIO_IDS = [
  'current-trajectory',
  'universal-bcg',
  'enhanced-screening',
  'who-elimination',
  'no-intervention',
] as const;

/**
 * Type representing valid scenario identifiers.
 */
export type ScenarioId = (typeof SCENARIO_IDS)[number];

/**
 * Validates whether a given string is a valid scenario ID.
 *
 * @param id - The string to validate
 * @returns True if the id is a valid scenario identifier
 *
 * @example
 * ```typescript
 * if (isValidScenarioId(userInput)) {
 *   const scenario = getScenarioById(userInput);
 * }
 * ```
 */
export function isValidScenarioId(id: string): id is ScenarioId {
  return SCENARIO_IDS.includes(id as ScenarioId);
}
