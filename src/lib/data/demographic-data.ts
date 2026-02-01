/**
 * UK Demographic Data for TB Simulation
 *
 * Data sources:
 * - ONS (Office for National Statistics) Population Estimates 2024
 * - UKHSA Tuberculosis in England 2025 Report
 * - NHS Digital BCG Vaccination Coverage Statistics
 * - WHO Global TB Report 2024
 * - POLYMOD Contact Survey (Mossong et al.)
 *
 * @module demographic-data
 */

import type {
  AgeGroupData,
  ContactMatrix,
  HighRiskPopulation,
  ImmigrationCohort,
  PopulationGroup,
} from '@/types/population';

// ============================================================================
// UK Age Distribution Data
// ============================================================================

/**
 * Age distribution entry with TB epidemiological data
 */
export interface AgeDistributionEntry {
  /** Age group identifier */
  ageGroup: string;
  /** Minimum age in group */
  minAge: number;
  /** Maximum age in group */
  maxAge: number;
  /** Population count (UK 2024 mid-year estimate) */
  population: number;
  /** Proportion of total population */
  proportion: number;
  /** TB incidence rate per 100,000 */
  tbIncidenceRate: number;
  /** Case fatality rate (proportion) */
  caseFatalityRate: number;
  /** BCG vaccination coverage (proportion) */
  vaccinationCoverage: number;
  /** Relative susceptibility to TB infection */
  susceptibility: number;
  /** Rate of progression from latent to active TB */
  progressionRate: number;
}

/**
 * UK age distribution with TB-specific epidemiological parameters
 *
 * Population figures from ONS mid-2024 estimates
 * TB incidence rates from UKHSA TB in England 2025 Report
 * BCG coverage from NHS Digital
 */
export const UK_AGE_DISTRIBUTION: readonly AgeDistributionEntry[] = [
  {
    ageGroup: '0-4',
    minAge: 0,
    maxAge: 4,
    population: 3_200_000,
    proportion: 0.048,
    tbIncidenceRate: 3.2,
    caseFatalityRate: 0.01,
    vaccinationCoverage: 0.89, // High due to neonatal BCG program in high-risk areas
    susceptibility: 1.2,
    progressionRate: 0.05, // Higher progression in young children
  },
  {
    ageGroup: '5-14',
    minAge: 5,
    maxAge: 14,
    population: 7_600_000,
    proportion: 0.113,
    tbIncidenceRate: 2.8,
    caseFatalityRate: 0.005,
    vaccinationCoverage: 0.72, // Historical BCG school program coverage
    susceptibility: 0.8,
    progressionRate: 0.02,
  },
  {
    ageGroup: '15-24',
    minAge: 15,
    maxAge: 24,
    population: 7_900_000,
    proportion: 0.118,
    tbIncidenceRate: 8.5,
    caseFatalityRate: 0.02,
    vaccinationCoverage: 0.45, // Lower due to gap after school program ended
    susceptibility: 1.0,
    progressionRate: 0.015,
  },
  {
    ageGroup: '25-44',
    minAge: 25,
    maxAge: 44,
    population: 17_800_000,
    proportion: 0.266,
    tbIncidenceRate: 14.2,
    caseFatalityRate: 0.03,
    vaccinationCoverage: 0.35, // Many missed BCG era
    susceptibility: 1.0,
    progressionRate: 0.01,
  },
  {
    ageGroup: '45-64',
    minAge: 45,
    maxAge: 64,
    population: 17_200_000,
    proportion: 0.257,
    tbIncidenceRate: 9.8,
    caseFatalityRate: 0.05,
    vaccinationCoverage: 0.55, // Historical school BCG program
    susceptibility: 1.1,
    progressionRate: 0.008,
  },
  {
    ageGroup: '65+',
    minAge: 65,
    maxAge: 100,
    population: 13_300_000,
    proportion: 0.198,
    tbIncidenceRate: 6.5,
    caseFatalityRate: 0.15, // Higher mortality in elderly
    vaccinationCoverage: 0.60, // Historical BCG coverage
    susceptibility: 1.3, // Increased due to immunosenescence
    progressionRate: 0.012, // Higher reactivation risk
  },
] as const;

/**
 * Get age distribution as a map keyed by age group
 */
export function getAgeDistributionMap(): Map<string, AgeDistributionEntry> {
  return new Map(UK_AGE_DISTRIBUTION.map((entry) => [entry.ageGroup, entry]));
}

/**
 * Get age group data in format compatible with simulation
 */
export function getAgeGroupData(): Record<string, AgeGroupData> {
  const result: Record<string, AgeGroupData> = {};
  for (const entry of UK_AGE_DISTRIBUTION) {
    result[entry.ageGroup] = {
      population: entry.population,
      proportion: entry.proportion,
      tbIncidenceRate: entry.tbIncidenceRate,
      caseFatalityRate: entry.caseFatalityRate,
      vaccinationCoverage: entry.vaccinationCoverage,
    };
  }
  return result;
}

/**
 * Get total UK population from age distribution
 */
export function getTotalPopulation(): number {
  return UK_AGE_DISTRIBUTION.reduce((sum, entry) => sum + entry.population, 0);
}

/**
 * Find age group for a given age
 */
export function getAgeGroupForAge(age: number): AgeDistributionEntry | undefined {
  return UK_AGE_DISTRIBUTION.find(
    (entry) => age >= entry.minAge && age <= entry.maxAge
  );
}

// ============================================================================
// Immigration Statistics
// ============================================================================

/**
 * TB incidence category for countries of origin
 */
export type TBIncidenceCategory = 'high' | 'medium' | 'low';

/**
 * Immigration data by TB incidence category of origin country
 */
export interface ImmigrationCategory {
  /** TB incidence category */
  category: TBIncidenceCategory;
  /** TB incidence threshold per 100,000 */
  incidenceThreshold: { min: number; max: number };
  /** Annual arrivals to UK */
  annualArrivals: number;
  /** Proportion of total immigration */
  proportion: number;
  /** Estimated proportion with latent TB */
  latentTBProportion: number;
  /** Average TB incidence rate in origin countries */
  averageOriginIncidence: number;
  /** Example countries */
  exampleCountries: string[];
}

/**
 * UK immigration data categorized by TB incidence in origin countries
 *
 * Data from ONS Long-term International Migration estimates
 * TB incidence categories based on WHO thresholds
 */
export const UK_IMMIGRATION_DATA: readonly ImmigrationCategory[] = [
  {
    category: 'high',
    incidenceThreshold: { min: 150, max: Infinity },
    annualArrivals: 180_000,
    proportion: 0.257,
    latentTBProportion: 0.40, // High prevalence in high-incidence countries
    averageOriginIncidence: 250,
    exampleCountries: [
      'India',
      'Pakistan',
      'Bangladesh',
      'Philippines',
      'Nigeria',
      'Somalia',
    ],
  },
  {
    category: 'medium',
    incidenceThreshold: { min: 40, max: 150 },
    annualArrivals: 220_000,
    proportion: 0.314,
    latentTBProportion: 0.20,
    averageOriginIncidence: 80,
    exampleCountries: [
      'China',
      'Romania',
      'Poland',
      'Portugal',
      'Brazil',
      'Thailand',
    ],
  },
  {
    category: 'low',
    incidenceThreshold: { min: 0, max: 40 },
    annualArrivals: 300_000,
    proportion: 0.429,
    latentTBProportion: 0.05,
    averageOriginIncidence: 15,
    exampleCountries: [
      'EU/EEA countries',
      'USA',
      'Canada',
      'Australia',
      'New Zealand',
      'Japan',
    ],
  },
] as const;

/**
 * Detailed immigration cohorts by specific country/region
 */
export const UK_IMMIGRATION_COHORTS: readonly ImmigrationCohort[] = [
  {
    countryOfOrigin: 'India',
    annualArrivals: 120_000,
    tbIncidenceInOrigin: 199,
    proportionScreened: 0.85,
    proportionWithLatentTB: 0.40,
  },
  {
    countryOfOrigin: 'Pakistan',
    annualArrivals: 35_000,
    tbIncidenceInOrigin: 259,
    proportionScreened: 0.85,
    proportionWithLatentTB: 0.45,
  },
  {
    countryOfOrigin: 'Bangladesh',
    annualArrivals: 18_000,
    tbIncidenceInOrigin: 221,
    proportionScreened: 0.80,
    proportionWithLatentTB: 0.42,
  },
  {
    countryOfOrigin: 'Nigeria',
    annualArrivals: 65_000,
    tbIncidenceInOrigin: 219,
    proportionScreened: 0.75,
    proportionWithLatentTB: 0.38,
  },
  {
    countryOfOrigin: 'Philippines',
    annualArrivals: 25_000,
    tbIncidenceInOrigin: 638,
    proportionScreened: 0.90,
    proportionWithLatentTB: 0.50,
  },
  {
    countryOfOrigin: 'Somalia',
    annualArrivals: 8_000,
    tbIncidenceInOrigin: 270,
    proportionScreened: 0.60,
    proportionWithLatentTB: 0.45,
  },
  {
    countryOfOrigin: 'China',
    annualArrivals: 90_000,
    tbIncidenceInOrigin: 52,
    proportionScreened: 0.70,
    proportionWithLatentTB: 0.15,
  },
  {
    countryOfOrigin: 'EU/EEA',
    annualArrivals: 150_000,
    tbIncidenceInOrigin: 10,
    proportionScreened: 0.10, // Lower screening for EU arrivals
    proportionWithLatentTB: 0.03,
  },
  {
    countryOfOrigin: 'Other',
    annualArrivals: 189_000,
    tbIncidenceInOrigin: 50,
    proportionScreened: 0.50,
    proportionWithLatentTB: 0.15,
  },
] as const;

/**
 * Get immigration data by TB incidence category
 */
export function getImmigrationByCategory(
  category: TBIncidenceCategory
): ImmigrationCategory | undefined {
  return UK_IMMIGRATION_DATA.find((data) => data.category === category);
}

/**
 * Get total annual immigration to UK
 */
export function getTotalAnnualImmigration(): number {
  return UK_IMMIGRATION_DATA.reduce((sum, cat) => sum + cat.annualArrivals, 0);
}

/**
 * Calculate expected latent TB cases from immigration per year
 */
export function getExpectedLatentTBFromImmigration(): number {
  return UK_IMMIGRATION_DATA.reduce(
    (sum, cat) => sum + cat.annualArrivals * cat.latentTBProportion,
    0
  );
}

/**
 * Get immigration cohort by country of origin
 */
export function getImmigrationCohort(
  countryOfOrigin: string
): ImmigrationCohort | undefined {
  return UK_IMMIGRATION_COHORTS.find(
    (cohort) => cohort.countryOfOrigin === countryOfOrigin
  );
}

// ============================================================================
// High-Risk Population Groups
// ============================================================================

/**
 * High-risk population groups for TB in the UK
 *
 * Data from UKHSA TB reports and Public Health England studies
 * Relative risk compared to general UK-born population
 */
export const HIGH_RISK_POPULATIONS: readonly HighRiskPopulation[] = [
  {
    id: 'homeless',
    name: 'Homeless/Rough Sleepers',
    population: 300_000, // Including hidden homeless
    relativeRisk: 50, // 50x higher risk than general population
    interventionEligible: true,
    description:
      'People experiencing homelessness, including rough sleepers and those in temporary accommodation',
  },
  {
    id: 'prisoners',
    name: 'Prison Population',
    population: 85_000,
    relativeRisk: 26, // High due to overcrowding and close contact
    interventionEligible: true,
    description:
      'Current prisoners and those recently released from custody',
  },
  {
    id: 'drug_users',
    name: 'People Who Use Drugs',
    population: 320_000,
    relativeRisk: 10, // Elevated risk due to lifestyle factors
    interventionEligible: true,
    description:
      'People who inject drugs or have problematic drug use, often overlapping with homeless population',
  },
  {
    id: 'hiv_positive',
    name: 'People Living with HIV',
    population: 106_000,
    relativeRisk: 20, // Significantly elevated due to immunocompromise
    interventionEligible: true,
    description:
      'HIV-positive individuals, particularly those not on effective antiretroviral therapy',
  },
  {
    id: 'immunocompromised',
    name: 'Immunocompromised (non-HIV)',
    population: 500_000,
    relativeRisk: 8,
    interventionEligible: true,
    description:
      'People on immunosuppressive therapy, organ transplant recipients, and those with immunocompromising conditions',
  },
  {
    id: 'alcohol_dependent',
    name: 'Alcohol Dependence',
    population: 600_000,
    relativeRisk: 3,
    interventionEligible: true,
    description:
      'People with alcohol use disorder, associated with increased susceptibility and poorer treatment outcomes',
  },
  {
    id: 'close_contacts',
    name: 'Close TB Contacts',
    population: 50_000, // Annual new close contacts identified
    relativeRisk: 15,
    interventionEligible: true,
    description:
      'Household and other close contacts of active TB cases',
  },
] as const;

/**
 * Get high-risk population by identifier
 */
export function getHighRiskPopulation(id: string): HighRiskPopulation | undefined {
  return HIGH_RISK_POPULATIONS.find((pop) => pop.id === id);
}

/**
 * Get all intervention-eligible high-risk populations
 */
export function getInterventionEligiblePopulations(): HighRiskPopulation[] {
  return HIGH_RISK_POPULATIONS.filter((pop) => pop.interventionEligible);
}

/**
 * Calculate total high-risk population (with overlap adjustment)
 * Note: Actual populations overlap significantly
 */
export function getTotalHighRiskPopulation(): number {
  // Sum with 30% overlap reduction to account for people in multiple categories
  const rawTotal = HIGH_RISK_POPULATIONS.reduce(
    (sum, pop) => sum + pop.population,
    0
  );
  return Math.round(rawTotal * 0.7);
}

// ============================================================================
// Healthcare Worker Data
// ============================================================================

/**
 * Healthcare worker population data
 */
export interface HealthcareWorkerData {
  /** Total NHS and care sector workers */
  totalCount: number;
  /** Clinical staff with patient contact */
  clinicalStaff: number;
  /** BCG vaccination coverage (proportion) */
  vaccinationRate: number;
  /** Annual occupational exposure rate */
  exposureRiskPerYear: number;
  /** Proportion in high-risk settings */
  highRiskSettingsProportion: number;
  /** Annual TB screening coverage */
  screeningCoverage: number;
}

/**
 * UK healthcare worker population and TB risk data
 *
 * Data from NHS Digital Workforce Statistics and UKHSA
 */
export const HEALTHCARE_WORKERS: HealthcareWorkerData = {
  totalCount: 1_400_000,
  clinicalStaff: 900_000,
  vaccinationRate: 0.88, // 88% coverage among eligible HCWs
  exposureRiskPerYear: 0.015, // 1.5% annual exposure to TB patients
  highRiskSettingsProportion: 0.15, // Respiratory/infectious disease wards
  screeningCoverage: 0.92, // New starter and periodic screening
} as const;

/**
 * Healthcare worker categories with specific risk profiles
 */
export interface HealthcareWorkerCategory {
  category: string;
  count: number;
  exposureRisk: number;
  bcgRequirement: 'mandatory' | 'recommended' | 'optional';
}

export const HEALTHCARE_WORKER_CATEGORIES: readonly HealthcareWorkerCategory[] = [
  {
    category: 'Doctors',
    count: 160_000,
    exposureRisk: 0.02,
    bcgRequirement: 'mandatory',
  },
  {
    category: 'Nurses',
    count: 350_000,
    exposureRisk: 0.025,
    bcgRequirement: 'mandatory',
  },
  {
    category: 'Allied Health Professionals',
    count: 180_000,
    exposureRisk: 0.015,
    bcgRequirement: 'recommended',
  },
  {
    category: 'Healthcare Assistants',
    count: 300_000,
    exposureRisk: 0.02,
    bcgRequirement: 'recommended',
  },
  {
    category: 'Laboratory Staff',
    count: 50_000,
    exposureRisk: 0.03,
    bcgRequirement: 'mandatory',
  },
  {
    category: 'Care Home Workers',
    count: 360_000,
    exposureRisk: 0.01,
    bcgRequirement: 'optional',
  },
] as const;

/**
 * Get healthcare worker data
 */
export function getHealthcareWorkerData(): HealthcareWorkerData {
  return { ...HEALTHCARE_WORKERS };
}

/**
 * Get healthcare workers by category
 */
export function getHealthcareWorkerCategories(): readonly HealthcareWorkerCategory[] {
  return HEALTHCARE_WORKER_CATEGORIES;
}

/**
 * Calculate total unvaccinated healthcare workers
 */
export function getUnvaccinatedHealthcareWorkers(): number {
  return Math.round(
    HEALTHCARE_WORKERS.clinicalStaff * (1 - HEALTHCARE_WORKERS.vaccinationRate)
  );
}

// ============================================================================
// Contact Matrices
// ============================================================================

/**
 * Age groups used in contact matrices
 * Aligned with POLYMOD study categories
 */
export const CONTACT_MATRIX_AGE_GROUPS = [
  '0-4',
  '5-14',
  '15-24',
  '25-44',
  '45-64',
  '65+',
] as const;

/**
 * UK contact matrix for age-structured mixing
 *
 * Based on POLYMOD study (Mossong et al., 2008) adapted for UK
 * Values represent average daily contacts between age groups
 * Matrices are symmetric: contact[i][j] * pop[i] = contact[j][i] * pop[j]
 */
export const CONTACT_MATRIX: ContactMatrix = {
  ageGroups: [...CONTACT_MATRIX_AGE_GROUPS],

  /**
   * Overall contact matrix (all settings combined)
   * Row = age group of individual, Column = age group of contact
   */
  matrix: [
    // 0-4    5-14   15-24  25-44  45-64  65+
    [3.2, 1.0, 0.4, 2.8, 0.8, 0.3], // 0-4
    [1.0, 8.5, 2.1, 1.5, 1.2, 0.4], // 5-14
    [0.4, 2.1, 7.8, 3.2, 1.1, 0.3], // 15-24
    [2.8, 1.5, 3.2, 5.5, 2.4, 0.6], // 25-44
    [0.8, 1.2, 1.1, 2.4, 3.8, 1.2], // 45-64
    [0.3, 0.4, 0.3, 0.6, 1.2, 2.1], // 65+
  ],

  bySettings: {
    /**
     * Household contacts - highest transmission risk
     */
    household: [
      [1.8, 0.4, 0.2, 1.6, 0.3, 0.2],
      [0.4, 1.2, 0.6, 0.8, 0.5, 0.2],
      [0.2, 0.6, 0.8, 0.9, 0.4, 0.1],
      [1.6, 0.8, 0.9, 1.2, 0.6, 0.3],
      [0.3, 0.5, 0.4, 0.6, 1.0, 0.5],
      [0.2, 0.2, 0.1, 0.3, 0.5, 0.8],
    ],

    /**
     * School contacts - children and young adults
     */
    school: [
      [1.0, 0.3, 0.0, 0.2, 0.1, 0.0],
      [0.3, 6.5, 0.8, 0.2, 0.1, 0.0],
      [0.0, 0.8, 4.0, 0.4, 0.1, 0.0],
      [0.2, 0.2, 0.4, 0.2, 0.1, 0.0],
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.0],
      [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    ],

    /**
     * Workplace contacts - working age adults
     */
    workplace: [
      [0.0, 0.0, 0.0, 0.2, 0.0, 0.0],
      [0.0, 0.0, 0.2, 0.1, 0.1, 0.0],
      [0.0, 0.2, 2.0, 1.2, 0.3, 0.0],
      [0.2, 0.1, 1.2, 3.2, 1.4, 0.1],
      [0.0, 0.1, 0.3, 1.4, 2.2, 0.2],
      [0.0, 0.0, 0.0, 0.1, 0.2, 0.1],
    ],

    /**
     * Community contacts - general mixing
     */
    community: [
      [0.4, 0.3, 0.2, 0.8, 0.4, 0.1],
      [0.3, 0.8, 0.5, 0.4, 0.5, 0.2],
      [0.2, 0.5, 1.0, 0.7, 0.3, 0.2],
      [0.8, 0.4, 0.7, 0.9, 0.3, 0.2],
      [0.4, 0.5, 0.3, 0.3, 0.5, 0.5],
      [0.1, 0.2, 0.2, 0.2, 0.5, 1.2],
    ],
  },
};

/**
 * Get the full contact matrix
 */
export function getContactMatrix(): ContactMatrix {
  return CONTACT_MATRIX;
}

/**
 * Get contact rate between two age groups
 */
export function getContactRate(
  fromAgeGroup: string,
  toAgeGroup: string
): number {
  const fromIndex = CONTACT_MATRIX.ageGroups.indexOf(fromAgeGroup);
  const toIndex = CONTACT_MATRIX.ageGroups.indexOf(toAgeGroup);

  if (fromIndex === -1 || toIndex === -1) {
    return 0;
  }

  return CONTACT_MATRIX.matrix[fromIndex][toIndex];
}

/**
 * Get setting-specific contact matrix
 */
export function getContactMatrixBySetting(
  setting: keyof ContactMatrix['bySettings']
): number[][] {
  return CONTACT_MATRIX.bySettings[setting];
}

/**
 * Calculate total daily contacts for an age group
 */
export function getTotalContactsForAgeGroup(ageGroup: string): number {
  const index = CONTACT_MATRIX.ageGroups.indexOf(ageGroup);
  if (index === -1) return 0;

  return CONTACT_MATRIX.matrix[index].reduce((sum, rate) => sum + rate, 0);
}

/**
 * Get weighted average contact rate across all age groups
 */
export function getWeightedAverageContactRate(): number {
  let totalContacts = 0;
  let totalPopulation = 0;

  for (const entry of UK_AGE_DISTRIBUTION) {
    const contacts = getTotalContactsForAgeGroup(entry.ageGroup);
    totalContacts += contacts * entry.population;
    totalPopulation += entry.population;
  }

  return totalPopulation > 0 ? totalContacts / totalPopulation : 0;
}

// ============================================================================
// Population Group Data (Combined)
// ============================================================================

/**
 * Get all population groups for simulation
 */
export function getPopulationGroups(): PopulationGroup[] {
  const groups: PopulationGroup[] = [];

  // Add age-based groups
  for (const age of UK_AGE_DISTRIBUTION) {
    groups.push({
      id: `age_${age.ageGroup}`,
      label: `Age ${age.ageGroup}`,
      population: age.population,
      tbIncidenceRate: age.tbIncidenceRate,
      vaccinationCoverage: age.vaccinationCoverage,
      contactRate: getTotalContactsForAgeGroup(age.ageGroup),
    });
  }

  // Add high-risk groups
  for (const hrp of HIGH_RISK_POPULATIONS) {
    groups.push({
      id: `risk_${hrp.id}`,
      label: hrp.name,
      population: hrp.population,
      // Calculate incidence from relative risk (base UK rate ~9.5 per 100k)
      tbIncidenceRate: 9.5 * hrp.relativeRisk,
      vaccinationCoverage: 0.3, // Generally lower in vulnerable groups
      contactRate: 12, // Higher contact rates in congregate settings
    });
  }

  return groups;
}

/**
 * Summary statistics for demographic data
 */
export interface DemographicSummary {
  totalPopulation: number;
  averageTBIncidence: number;
  averageVaccinationCoverage: number;
  totalHighRiskPopulation: number;
  annualImmigration: number;
  expectedImportedLatentTB: number;
  healthcareWorkersAtRisk: number;
}

/**
 * Get summary statistics of demographic data
 */
export function getDemographicSummary(): DemographicSummary {
  const totalPop = getTotalPopulation();

  // Calculate weighted average TB incidence
  const weightedIncidence = UK_AGE_DISTRIBUTION.reduce(
    (sum, entry) => sum + entry.tbIncidenceRate * entry.proportion,
    0
  );

  // Calculate weighted average vaccination coverage
  const weightedCoverage = UK_AGE_DISTRIBUTION.reduce(
    (sum, entry) => sum + entry.vaccinationCoverage * entry.proportion,
    0
  );

  return {
    totalPopulation: totalPop,
    averageTBIncidence: weightedIncidence,
    averageVaccinationCoverage: weightedCoverage,
    totalHighRiskPopulation: getTotalHighRiskPopulation(),
    annualImmigration: getTotalAnnualImmigration(),
    expectedImportedLatentTB: getExpectedLatentTBFromImmigration(),
    healthcareWorkersAtRisk: getUnvaccinatedHealthcareWorkers(),
  };
}
