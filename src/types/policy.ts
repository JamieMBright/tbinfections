/**
 * Policy Type Definitions
 * Types for intervention policies and their effects
 */

import type { PolicyType } from './simulation';

/**
 * Policy effect on simulation parameters
 */
export interface PolicyEffect {
  /** Target parameter to modify */
  parameter: string;
  /** Type of modification */
  effectType: 'multiply' | 'add' | 'set';
  /** Value for the effect */
  value: number;
  /** Delay in days before effect takes place */
  delayDays: number;
  /** Ramp-up period in days */
  rampUpDays: number;
}

/**
 * Detailed policy definition
 */
export interface PolicyDefinition {
  type: PolicyType;
  name: string;
  description: string;
  /** Implementation cost estimate (GBP per year) */
  annualCost: number;
  /** Effectiveness evidence level */
  evidenceLevel: 'high' | 'moderate' | 'low';
  /** Effects on simulation */
  effects: PolicyEffect[];
  /** Configurable parameters */
  configurableParams: PolicyParameter[];
}

/**
 * Configurable policy parameter
 */
export interface PolicyParameter {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select';
  defaultValue: number | boolean | string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  unit?: string;
}

/**
 * Pre-entry screening policy details
 */
export interface PreEntryScreeningPolicy {
  enabled: boolean;
  /** Countries targeted (by incidence threshold) */
  incidenceThreshold: number;
  /** Types of visas requiring screening */
  visaTypes: string[];
  /** Screening test sensitivity */
  testSensitivity: number;
  /** Screening test specificity */
  testSpecificity: number;
  /** Treatment completion rate for those identified */
  treatmentCompletionRate: number;
}

/**
 * Contact tracing policy details
 */
export interface ContactTracingPolicy {
  enabled: boolean;
  /** Proportion of contacts identified */
  contactIdentificationRate: number;
  /** Proportion of identified contacts tested */
  testingRate: number;
  /** Days delay in tracing initiation */
  tracingDelay: number;
  /** Maximum contacts traced per case */
  maxContactsPerCase: number;
}

/**
 * Active case finding policy details
 */
export interface ActiveCaseFindingPolicy {
  enabled: boolean;
  /** Target populations */
  targetPopulations: string[];
  /** Screening coverage in target populations */
  screeningCoverage: number;
  /** Frequency of screening (days) */
  screeningFrequency: number;
  /** Case detection sensitivity */
  detectionSensitivity: number;
}

/**
 * Directly observed therapy (DOT) policy
 */
export interface DOTPolicy {
  enabled: boolean;
  /** Proportion of cases receiving DOT */
  coverage: number;
  /** Improvement in treatment completion */
  completionRateImprovement: number;
  /** Reduction in treatment failure */
  failureRateReduction: number;
}

/**
 * Latent TB treatment policy
 */
export interface LatentTBPolicy {
  enabled: boolean;
  /** Target populations for screening */
  targetPopulations: string[];
  /** Treatment regimen duration (days) */
  treatmentDuration: number;
  /** Treatment uptake rate */
  uptakeRate: number;
  /** Treatment completion rate */
  completionRate: number;
  /** Treatment efficacy */
  efficacy: number;
}

/**
 * Policy scenario comparison
 */
export interface PolicyComparison {
  baselineScenarioId: string;
  comparisonScenarioId: string;
  metrics: {
    infectionsDifference: number;
    deathsDifference: number;
    costDifference: number;
    costPerDeathAverted: number;
    costPerInfectionAverted: number;
  };
}

/**
 * UK TB policy presets based on current guidelines
 */
export const UK_CURRENT_POLICIES = {
  neonatalBCG: {
    eligibility: 'risk-based',
    threshold: 40, // per 100,000 in parent's country
    coverage: 0.89,
  },
  preEntryScreening: {
    enabled: true,
    threshold: 40,
    visaTypes: ['settlement', 'student', 'work'],
  },
  contactTracing: {
    enabled: true,
    coverage: 0.65,
  },
  latentTBTreatment: {
    enabled: true,
    targetGroups: ['recent_immigrants', 'contacts', 'immunocompromised'],
  },
} as const;
