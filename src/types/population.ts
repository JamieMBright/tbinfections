/**
 * Population Type Definitions
 * Types for demographic and population modeling
 */

/**
 * Age group definition with epidemiological characteristics
 */
export interface AgeGroup {
  id: 'neonates' | 'children' | 'adolescents' | 'adults' | 'elderly';
  label: string;
  ageRange: [number, number];
  population: number;
  /** Vaccination coverage rate (0-1) */
  vaccinationRate: number;
  /** Relative susceptibility to infection */
  susceptibility: number;
  /** Rate of progression from latent to active */
  progressionRate: number;
  /** Case fatality rate */
  caseFatalityRate: number;
}

/**
 * Population group for demographic modeling
 */
export interface PopulationGroup {
  id: string;
  label: string;
  population: number;
  /** TB incidence rate per 100,000 */
  tbIncidenceRate: number;
  /** Vaccination coverage (0-1) */
  vaccinationCoverage: number;
  /** Average daily contacts */
  contactRate: number;
}

/**
 * Demographic breakdown of UK population
 */
export interface DemographicData {
  totalPopulation: number;
  ukBorn: PopulationSegment;
  nonUkBorn: PopulationSegment;
  byAgeGroup: Record<string, AgeGroupData>;
  byRegion: Record<string, RegionalPopulation>;
}

/**
 * Population segment with TB-specific data
 */
export interface PopulationSegment {
  population: number;
  proportion: number;
  tbIncidenceRate: number;
  vaccinationCoverage: number;
}

/**
 * Age group specific population data
 */
export interface AgeGroupData {
  population: number;
  proportion: number;
  tbIncidenceRate: number;
  caseFatalityRate: number;
  vaccinationCoverage: number;
}

/**
 * Regional population data
 */
export interface RegionalPopulation {
  population: number;
  density: number;
  urbanProportion: number;
  deprivationScore: number;
  tbIncidenceRate: number;
}

/**
 * Immigration cohort for TB modeling
 */
export interface ImmigrationCohort {
  countryOfOrigin: string;
  annualArrivals: number;
  tbIncidenceInOrigin: number;
  proportionScreened: number;
  proportionWithLatentTB: number;
}

/**
 * High-risk population definition
 */
export interface HighRiskPopulation {
  id: string;
  name: string;
  population: number;
  relativeRisk: number;
  interventionEligible: boolean;
  description: string;
}

/**
 * Contact matrix for age-structured mixing
 */
export interface ContactMatrix {
  ageGroups: string[];
  /** Matrix of contact rates between age groups */
  matrix: number[][];
  /** Setting-specific matrices */
  bySettings: {
    household: number[][];
    school: number[][];
    workplace: number[][];
    community: number[][];
  };
}

/**
 * UK population constants
 */
export const UK_POPULATION = {
  total: 67_000_000,
  ukBorn: 57_000_000,
  nonUkBorn: 10_000_000,
  healthcareWorkers: 1_400_000,
  annualBirths: 640_000,
  annualImmigration: 700_000,
} as const;
