/**
 * TB Epidemiological Parameters
 *
 * Research-based parameters for the extended SEIR model specific to tuberculosis.
 * All values are derived from UKHSA TB Reports, WHO Global TB Report, and
 * peer-reviewed BCG efficacy studies.
 *
 * @module tb-parameters
 */

import { z } from 'zod';
import type { DiseaseParameters, PolicyIntervention, PolicyType } from '@/types/simulation';

/**
 * Basic reproduction number (R0) configuration for TB
 * R0 for TB typically ranges from 1.3-2.2 depending on setting and population
 */
export interface R0Config {
  /** Minimum R0 value (low transmission setting) */
  min: number;
  /** Maximum R0 value (high transmission setting) */
  max: number;
  /** Default R0 for typical UK conditions */
  default: number;
}

/**
 * Transmission rate configuration
 * Rates represent probability of transmission per contact per day
 */
export interface TransmissionRateConfig {
  /** Baseline transmission rate in general community */
  baseline: number;
  /** Transmission rate in household/close contact settings */
  household: number;
}

/**
 * Latency progression parameters
 * TB has unique latency characteristics with fast and slow progression paths
 */
export interface LatencyConfig {
  /** Rate of fast progression from high-risk latent to active (~5% in 2 years) */
  fastProgressionRate: number;
  /** Rate of moving from high-risk to low-risk latent state */
  stabilizationRate: number;
  /** Rate of reactivation from low-risk latent to active (lifetime ~5-10%) */
  reactivationRate: number;
}

/**
 * Duration of infectious period configuration
 */
export interface InfectiousPeriodConfig {
  /** Duration without treatment (days) */
  untreated: number;
  /** Duration with standard treatment (days) */
  treated: number;
}

/**
 * Case fatality rate configuration
 */
export interface CaseFatalityRateConfig {
  /** Fatality rate without treatment */
  untreated: number;
  /** Fatality rate with treatment */
  treated: number;
}

/**
 * BCG vaccine efficacy parameters
 * Efficacy varies by age at vaccination and wanes over time
 */
export interface BCGEfficacyConfig {
  /** Efficacy when given to neonates (against severe/miliary TB) */
  neonatal: number;
  /** Efficacy when given during childhood (against pulmonary TB) */
  childhood: number;
  /** Efficacy when given to adults (reduced efficacy) */
  adult: number;
  /** Annual rate of waning immunity */
  waning: number;
  /** Duration of protection in years */
  duration: number;
}

/**
 * Daily contact rates by setting
 */
export interface ContactRatesConfig {
  /** Average contacts per day in general community */
  general: number;
  /** Contacts per day within household */
  household: number;
  /** Contacts per day in workplace */
  workplace: number;
  /** Contacts per day in healthcare settings */
  healthcare: number;
}

/**
 * UK-specific TB control parameters
 */
export interface UKSpecificConfig {
  /** Efficacy of pre-entry TB screening for immigrants */
  preEntryScreeningEfficacy: number;
  /** Efficacy of active case finding programs */
  activeCaseFinding: number;
  /** Average delay from symptoms to treatment (days) */
  treatmentDelay: number;
}

/**
 * Complete TB parameters configuration
 * Contains all epidemiological parameters needed for simulation
 */
export interface TBParametersConfig {
  /** Basic reproduction number configuration */
  R0: R0Config;
  /** Transmission rate parameters */
  transmissionRate: TransmissionRateConfig;
  /** Latency progression parameters */
  latency: LatencyConfig;
  /** Infectious period durations */
  infectiousPeriod: InfectiousPeriodConfig;
  /** Treatment success rate (proportion completing treatment) */
  treatmentRate: number;
  /** Natural recovery rate (self-cure without treatment) */
  naturalRecoveryRate: number;
  /** Case fatality rates */
  caseFatalityRate: CaseFatalityRateConfig;
  /** BCG vaccine efficacy parameters */
  bcgEfficacy: BCGEfficacyConfig;
  /** Daily contact rates by setting */
  contactRates: ContactRatesConfig;
  /** UK-specific parameters */
  ukSpecific: UKSpecificConfig;
}

/**
 * Research-based TB epidemiological parameters
 *
 * Sources:
 * - UKHSA Tuberculosis in England 2025 Report
 * - WHO Global TB Report
 * - BCG vaccine efficacy meta-analyses
 * - ONS population statistics
 */
export const TB_PARAMETERS: TBParametersConfig = {
  /**
   * Basic reproduction number (R0)
   * TB has relatively low R0 compared to respiratory diseases like measles
   * Range reflects variability across settings (households vs community)
   */
  R0: {
    min: 1.3,
    max: 2.2,
    default: 1.7,
  },

  /**
   * Transmission rates per contact per day
   * Household transmission is ~10x higher due to prolonged close contact
   */
  transmissionRate: {
    baseline: 0.0001, // Per contact per day in community
    household: 0.001, // Per contact per day in household
  },

  /**
   * Latency progression parameters
   * TB has distinctive two-stage latency:
   * - High-risk (recent infection): ~5% progress to active in 2 years
   * - Low-risk (stable LTBI): ~5-10% lifetime risk of reactivation
   */
  latency: {
    fastProgressionRate: 0.0014, // ~5% progress in 2 years (0.05 / 730 days * 10 for early period)
    stabilizationRate: 0.001, // Daily rate of moving to stable LTBI
    reactivationRate: 0.0001, // Daily rate (~5-10% over decades)
  },

  /**
   * Infectious period duration
   * Untreated TB is infectious for extended periods
   * Standard 6-month treatment regimen significantly reduces duration
   */
  infectiousPeriod: {
    untreated: 730, // ~2 years average if untreated
    treated: 180, // ~6 months with standard treatment
  },

  /**
   * Treatment success rate
   * UK achieves high treatment completion rates
   */
  treatmentRate: 0.85, // 85% treatment success

  /**
   * Natural recovery rate
   * Some individuals self-cure without treatment
   */
  naturalRecoveryRate: 0.15, // 15% self-cure rate

  /**
   * Case fatality rates
   * Dramatic difference between treated and untreated outcomes
   */
  caseFatalityRate: {
    untreated: 0.45, // 45% fatality without treatment
    treated: 0.04, // 4% fatality with treatment
  },

  /**
   * BCG vaccine efficacy
   * Efficacy varies significantly by age at vaccination
   * Protection wanes over time
   */
  bcgEfficacy: {
    neonatal: 0.86, // 86% efficacy against severe forms (miliary, meningitis)
    childhood: 0.7, // 70% efficacy against pulmonary TB
    adult: 0.5, // 50% efficacy (reduced in adults)
    waning: 0.02, // 2% annual waning of immunity
    duration: 15, // Average 15 years of protection
  },

  /**
   * Daily contact rates by setting
   * Based on UK social mixing studies
   */
  contactRates: {
    general: 10, // Average daily contacts in community
    household: 4, // Daily household contacts
    workplace: 6, // Daily workplace contacts
    healthcare: 15, // Healthcare workers have higher contact rates
  },

  /**
   * UK-specific TB control parameters
   * Reflects current NHS and UKHSA TB programs
   */
  ukSpecific: {
    preEntryScreeningEfficacy: 0.7, // 70% effective at detecting active TB
    activeCaseFinding: 0.65, // 65% case detection through active programs
    treatmentDelay: 70, // Average 70 days from symptoms to treatment
  },
} as const;

/**
 * Zod schema for DiseaseParameters validation
 * Ensures all parameters are within valid ranges
 */
export const diseaseParametersSchema = z.object({
  /** Transmission rate per contact (beta) - must be positive */
  beta: z
    .number()
    .positive('Transmission rate must be positive')
    .max(1, 'Transmission rate cannot exceed 1'),

  /** Fast progression rate (E_H -> I) */
  epsilon: z
    .number()
    .nonnegative('Fast progression rate must be non-negative')
    .max(1, 'Fast progression rate cannot exceed 1'),

  /** Stabilization rate (E_H -> E_L) */
  kappa: z
    .number()
    .nonnegative('Stabilization rate must be non-negative')
    .max(1, 'Stabilization rate cannot exceed 1'),

  /** Reactivation rate (E_L -> I) */
  omega: z
    .number()
    .nonnegative('Reactivation rate must be non-negative')
    .max(1, 'Reactivation rate cannot exceed 1'),

  /** Recovery rate */
  gamma: z
    .number()
    .nonnegative('Recovery rate must be non-negative')
    .max(1, 'Recovery rate cannot exceed 1'),

  /** Natural mortality rate */
  mu: z
    .number()
    .nonnegative('Natural mortality rate must be non-negative')
    .max(1, 'Natural mortality rate cannot exceed 1'),

  /** TB mortality rate */
  muTb: z
    .number()
    .nonnegative('TB mortality rate must be non-negative')
    .max(1, 'TB mortality rate cannot exceed 1'),

  /** Vaccination rate */
  rho: z
    .number()
    .nonnegative('Vaccination rate must be non-negative')
    .max(1, 'Vaccination rate cannot exceed 1'),

  /** Vaccine efficacy */
  ve: z
    .number()
    .nonnegative('Vaccine efficacy must be non-negative')
    .max(1, 'Vaccine efficacy cannot exceed 1'),

  /** Reinfection susceptibility */
  sigma: z
    .number()
    .nonnegative('Reinfection susceptibility must be non-negative')
    .max(1, 'Reinfection susceptibility cannot exceed 1'),
});

/**
 * Type inferred from Zod schema (should match DiseaseParameters)
 */
export type ValidatedDiseaseParameters = z.infer<typeof diseaseParametersSchema>;

/**
 * Default UK natural mortality rate
 * Based on ONS life expectancy data (~80 years average)
 */
const UK_NATURAL_MORTALITY_RATE = 1 / (80 * 365); // Daily mortality rate

/**
 * Default vaccination rate for current UK policy
 * Risk-based neonatal BCG coverage
 */
const DEFAULT_VACCINATION_RATE = 0.001; // Low baseline, increases with policy

/**
 * Default reinfection susceptibility
 * Previously infected individuals have ~50% reduced susceptibility
 */
const DEFAULT_REINFECTION_SUSCEPTIBILITY = 0.5;

/**
 * Creates DiseaseParameters with research-based defaults
 *
 * Converts the detailed TB_PARAMETERS into the simplified DiseaseParameters
 * interface used by the SEIR model differential equations.
 *
 * @param overrides - Optional partial overrides for default values
 * @returns Complete DiseaseParameters object
 *
 * @example
 * ```typescript
 * // Use defaults
 * const params = createDiseaseParameters();
 *
 * // Override specific values
 * const customParams = createDiseaseParameters({
 *   beta: 0.0002,
 *   ve: 0.9
 * });
 * ```
 */
export function createDiseaseParameters(
  overrides?: Partial<DiseaseParameters>
): DiseaseParameters {
  // Calculate beta from R0, recovery rate, and contact rate
  // R0 = beta * contactRate * infectiousDuration
  // beta = R0 / (contactRate * infectiousDuration)
  const avgInfectiousPeriod =
    TB_PARAMETERS.treatmentRate * TB_PARAMETERS.infectiousPeriod.treated +
    (1 - TB_PARAMETERS.treatmentRate) * TB_PARAMETERS.infectiousPeriod.untreated;

  const gamma = 1 / avgInfectiousPeriod;

  // Calculate transmission rate (beta) from R0
  // Using: R0 = beta * N * D where D is infectious duration
  const beta =
    TB_PARAMETERS.R0.default / (TB_PARAMETERS.contactRates.general * avgInfectiousPeriod);

  // Calculate TB mortality rate
  // Weighted average based on treatment rate
  const caseFatality =
    TB_PARAMETERS.treatmentRate * TB_PARAMETERS.caseFatalityRate.treated +
    (1 - TB_PARAMETERS.treatmentRate) * TB_PARAMETERS.caseFatalityRate.untreated;
  const muTb = caseFatality / avgInfectiousPeriod;

  const defaults: DiseaseParameters = {
    beta,
    epsilon: TB_PARAMETERS.latency.fastProgressionRate,
    kappa: TB_PARAMETERS.latency.stabilizationRate,
    omega: TB_PARAMETERS.latency.reactivationRate,
    gamma,
    mu: UK_NATURAL_MORTALITY_RATE,
    muTb,
    rho: DEFAULT_VACCINATION_RATE,
    ve: TB_PARAMETERS.bcgEfficacy.neonatal,
    sigma: DEFAULT_REINFECTION_SUSCEPTIBILITY,
  };

  return { ...defaults, ...overrides };
}

/**
 * Policy effect multipliers on transmission and other parameters
 * Maps policy types to their effects on disease parameters
 */
const POLICY_EFFECTS: Record<
  PolicyType,
  {
    /** Effect on transmission rate (beta) as a multiplier */
    betaMultiplier?: number;
    /** Effect on recovery rate (gamma) as a multiplier */
    gammaMultiplier?: number;
    /** Effect on vaccination rate (rho) as a multiplier */
    rhoMultiplier?: number;
    /** Effect on vaccine efficacy (ve) adjustment */
    veAdjustment?: number;
    /** Effect on TB mortality (muTb) as a multiplier */
    muTbMultiplier?: number;
  }
> = {
  pre_entry_screening: {
    // Reduces imported cases, effectively lowering transmission
    betaMultiplier: 1 - TB_PARAMETERS.ukSpecific.preEntryScreeningEfficacy * 0.3,
  },
  active_case_finding: {
    // Earlier detection and treatment increases recovery rate
    gammaMultiplier: 1.5,
    // Reduces transmission by identifying cases sooner
    betaMultiplier: 1 - TB_PARAMETERS.ukSpecific.activeCaseFinding * 0.2,
  },
  contact_tracing: {
    // Reduces transmission through identifying and treating contacts
    betaMultiplier: 0.85,
    // Slight increase in recovery rate through early treatment
    gammaMultiplier: 1.1,
  },
  directly_observed_therapy: {
    // Improves treatment outcomes
    gammaMultiplier: 1.2,
    // Reduces mortality through better adherence
    muTbMultiplier: 0.7,
  },
  latent_tb_treatment: {
    // Reduces progression from latent to active (effectively lower transmission)
    betaMultiplier: 0.8,
  },
  universal_bcg: {
    // Significant increase in vaccination rate
    rhoMultiplier: 10,
    // Use neonatal efficacy as baseline
    veAdjustment: TB_PARAMETERS.bcgEfficacy.neonatal,
  },
  healthcare_worker_bcg: {
    // Moderate increase in vaccination (targeted population)
    rhoMultiplier: 2,
    // Adult efficacy for healthcare workers
    veAdjustment: TB_PARAMETERS.bcgEfficacy.adult,
  },
  border_health_checks: {
    // Reduces imported cases
    betaMultiplier: 0.9,
  },
  public_awareness_campaign: {
    // Modest reduction in transmission through behavior change
    betaMultiplier: 0.95,
    // Earlier presentation for testing
    gammaMultiplier: 1.05,
  },
};

/**
 * Adjusts disease parameters based on active policy interventions
 *
 * Applies cumulative effects from all active policies at the current
 * simulation day. Effects are multiplicative for rates.
 *
 * @param params - Base disease parameters
 * @param policies - Array of active policy interventions
 * @param currentDay - Current simulation day (for checking active periods)
 * @returns Adjusted DiseaseParameters
 *
 * @example
 * ```typescript
 * const baseParams = createDiseaseParameters();
 * const policies: PolicyIntervention[] = [
 *   {
 *     id: '1',
 *     type: 'universal_bcg',
 *     name: 'Universal BCG',
 *     description: 'BCG for all newborns',
 *     startDay: 0,
 *     parameters: {},
 *     effectOnR0: 0.85
 *   }
 * ];
 * const adjustedParams = adjustParametersForPolicy(baseParams, policies, 100);
 * ```
 */
export function adjustParametersForPolicy(
  params: DiseaseParameters,
  policies: PolicyIntervention[],
  currentDay: number = 0
): DiseaseParameters {
  // Start with a copy of the base parameters
  const adjusted: DiseaseParameters = { ...params };

  // Track cumulative multipliers
  let betaMultiplier = 1;
  let gammaMultiplier = 1;
  let rhoMultiplier = 1;
  let muTbMultiplier = 1;
  let veOverride: number | undefined;

  // Apply effects from each active policy
  for (const policy of policies) {
    // Check if policy is active at current day
    if (currentDay < policy.startDay) {
      continue;
    }
    if (policy.endDay !== undefined && currentDay > policy.endDay) {
      continue;
    }

    const effects = POLICY_EFFECTS[policy.type];
    if (!effects) {
      continue;
    }

    // Apply multiplicative effects
    if (effects.betaMultiplier !== undefined) {
      betaMultiplier *= effects.betaMultiplier;
    }
    if (effects.gammaMultiplier !== undefined) {
      gammaMultiplier *= effects.gammaMultiplier;
    }
    if (effects.rhoMultiplier !== undefined) {
      rhoMultiplier *= effects.rhoMultiplier;
    }
    if (effects.muTbMultiplier !== undefined) {
      muTbMultiplier *= effects.muTbMultiplier;
    }
    if (effects.veAdjustment !== undefined) {
      // Use the highest vaccine efficacy if multiple policies specify it
      veOverride =
        veOverride !== undefined ? Math.max(veOverride, effects.veAdjustment) : effects.veAdjustment;
    }

    // Apply the policy's direct R0 effect as additional beta reduction
    if (policy.effectOnR0 !== 1) {
      betaMultiplier *= policy.effectOnR0;
    }
  }

  // Apply all multipliers to parameters
  adjusted.beta = params.beta * betaMultiplier;
  adjusted.gamma = params.gamma * gammaMultiplier;
  adjusted.rho = Math.min(params.rho * rhoMultiplier, 1); // Cap at 100%
  adjusted.muTb = params.muTb * muTbMultiplier;

  // Override vaccine efficacy if specified
  if (veOverride !== undefined) {
    adjusted.ve = veOverride;
  }

  return adjusted;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  /** Whether validation passed */
  success: boolean;
  /** Validated parameters (if success) */
  data?: DiseaseParameters;
  /** Validation errors (if failure) */
  errors?: z.ZodError<DiseaseParameters>;
}

/**
 * Validates disease parameters using Zod schema
 *
 * Performs runtime validation to ensure all parameters are within
 * valid epidemiological ranges. Use this when accepting user input
 * or loading parameters from external sources.
 *
 * @param params - Parameters to validate
 * @returns Validation result with success status and data/errors
 *
 * @example
 * ```typescript
 * const userParams = getUserInput();
 * const result = validateParameters(userParams);
 *
 * if (result.success) {
 *   runSimulation(result.data);
 * } else {
 *   console.error('Invalid parameters:', result.errors);
 * }
 * ```
 */
export function validateParameters(params: unknown): ValidationResult {
  const result = diseaseParametersSchema.safeParse(params);

  if (result.success) {
    return {
      success: true,
      data: result.data as DiseaseParameters,
    };
  }

  return {
    success: false,
    errors: result.error as z.ZodError<DiseaseParameters>,
  };
}

/**
 * Validates and throws on invalid parameters
 *
 * Use this when you want to ensure parameters are valid and
 * throw an error if they're not (e.g., during initialization).
 *
 * @param params - Parameters to validate
 * @returns Validated DiseaseParameters
 * @throws {z.ZodError} If validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const validParams = validateParametersOrThrow(userInput);
 *   // Use validParams safely
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     handleValidationError(error);
 *   }
 * }
 * ```
 */
export function validateParametersOrThrow(params: unknown): DiseaseParameters {
  return diseaseParametersSchema.parse(params) as DiseaseParameters;
}

/**
 * Calculates effective R0 based on current parameters
 *
 * R0_effective = beta * contactRate * infectiousDuration * (1 - ve * vaccineCoverage)
 *
 * @param params - Disease parameters
 * @param vaccineCoverage - Proportion of population vaccinated (0-1)
 * @returns Effective reproduction number
 */
export function calculateEffectiveR0(
  params: DiseaseParameters,
  vaccineCoverage: number = 0
): number {
  const infectiousDuration = 1 / params.gamma;
  const contactRate = TB_PARAMETERS.contactRates.general;

  // Base R0
  const R0 = params.beta * contactRate * infectiousDuration;

  // Adjust for vaccination
  const effectiveR0 = R0 * (1 - params.ve * vaccineCoverage);

  return effectiveR0;
}

/**
 * Gets BCG efficacy adjusted for age and time since vaccination
 *
 * @param ageAtVaccination - Age when vaccinated (years)
 * @param yearsSinceVaccination - Years since vaccination
 * @returns Current vaccine efficacy (0-1)
 */
export function getAdjustedBCGEfficacy(
  ageAtVaccination: number,
  yearsSinceVaccination: number
): number {
  // Determine base efficacy by age at vaccination
  let baseEfficacy: number;
  if (ageAtVaccination < 1) {
    baseEfficacy = TB_PARAMETERS.bcgEfficacy.neonatal;
  } else if (ageAtVaccination < 16) {
    baseEfficacy = TB_PARAMETERS.bcgEfficacy.childhood;
  } else {
    baseEfficacy = TB_PARAMETERS.bcgEfficacy.adult;
  }

  // Apply waning based on time since vaccination
  const yearsProtected = Math.min(yearsSinceVaccination, TB_PARAMETERS.bcgEfficacy.duration);
  const wanedEfficacy = baseEfficacy * Math.pow(1 - TB_PARAMETERS.bcgEfficacy.waning, yearsProtected);

  // Efficacy drops to 0 after protection duration
  if (yearsSinceVaccination > TB_PARAMETERS.bcgEfficacy.duration) {
    return 0;
  }

  return Math.max(0, wanedEfficacy);
}
