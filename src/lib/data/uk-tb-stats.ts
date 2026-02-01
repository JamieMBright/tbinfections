/**
 * UK TB Statistics Data Module
 *
 * Contains real UK tuberculosis statistics sourced from:
 * - UKHSA Tuberculosis in England 2025 Report
 * - ONS Population Statistics
 * - NHS Digital BCG Coverage Data
 * - WHO Global TB Database
 *
 * @module uk-tb-stats
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * National TB statistics for a given year
 */
export interface NationalTBStatistics {
  /** Total TB case notifications */
  notifications: number;
  /** Incidence rate per 100,000 population */
  incidenceRate: number;
  /** Proportion of cases in UK-born individuals (0-1) */
  ukBornProportion: number;
  /** Proportion of cases in non-UK-born individuals (0-1) */
  nonUkBornProportion: number;
  /** Total TB-attributable deaths */
  deaths: number;
  /** Case fatality rate */
  caseFatalityRate: number;
  /** Multi-drug resistant TB cases */
  mdrCases: number;
  /** Treatment completion rate (0-1) */
  treatmentCompletionRate: number;
}

/**
 * Regional TB data including population and incidence
 */
export interface RegionalTBData {
  /** Region identifier */
  id: string;
  /** Human-readable region name */
  name: string;
  /** TB incidence rate per 100,000 */
  incidenceRate: number;
  /** Total population in the region */
  population: number;
  /** Estimated TB notifications */
  notifications: number;
  /** Urban/rural classification */
  urbanization: 'urban' | 'suburban' | 'mixed' | 'rural';
  /** Index of Multiple Deprivation average decile (1-10) */
  deprivationDecile: number;
  /** Proportion of non-UK-born population */
  nonUkBornProportion: number;
}

/**
 * Age group TB statistics
 */
export interface AgeGroupTBData {
  /** Age group range label */
  ageGroup: string;
  /** Minimum age (inclusive) */
  minAge: number;
  /** Maximum age (inclusive, 999 for no upper bound) */
  maxAge: number;
  /** Incidence rate per 100,000 for this age group */
  incidenceRate: number;
  /** Proportion of total cases from this age group */
  proportionOfCases: number;
  /** Case fatality rate for this age group */
  caseFatalityRate: number;
}

/**
 * TB statistics by birthplace
 */
export interface BirthplaceTBData {
  /** Category label */
  category: string;
  /** Incidence rate per 100,000 */
  incidenceRate: number;
  /** Proportion of total TB cases */
  proportionOfCases: number;
  /** Estimated population in this category */
  estimatedPopulation: number;
}

/**
 * Historical trend data point
 */
export interface HistoricalTrendPoint {
  /** Year of data */
  year: number;
  /** TB incidence rate per 100,000 */
  incidenceRate: number;
  /** Total notifications */
  notifications: number;
  /** Total deaths */
  deaths: number;
  /** BCG neonatal coverage rate */
  bcgCoverage: number;
}

/**
 * BCG vaccination coverage data
 */
export interface BCGCoverageData {
  /** Neonatal BCG coverage rate (0-1) */
  neonatal: number;
  /** Healthcare worker BCG coverage rate (0-1) */
  healthcareWorkers: number;
  /** Coverage among high-risk neonates (0-1) */
  highRiskNeonates: number;
  /** Year of coverage data */
  year: number;
}

/**
 * Complete UK TB data structure
 */
export interface UKTBData {
  /** National aggregate statistics */
  national: NationalTBStatistics;
  /** Regional breakdown */
  byRegion: Record<string, RegionalTBData>;
  /** Age group breakdown */
  byAgeGroup: AgeGroupTBData[];
  /** Birthplace statistics */
  byBirthplace: {
    ukBorn: BirthplaceTBData;
    nonUkBorn: BirthplaceTBData;
  };
  /** Historical trends (2019-2024) */
  historicalTrends: HistoricalTrendPoint[];
  /** Current BCG coverage */
  bcgCoverage: BCGCoverageData;
  /** Data version and metadata */
  metadata: {
    dataYear: number;
    lastUpdated: string;
    sources: string[];
  };
}

// ============================================================================
// UK TB Data Constants
// ============================================================================

/**
 * Complete UK TB statistics dataset (2024)
 *
 * Data sourced from:
 * - UKHSA Tuberculosis in England 2025 Report
 * - ONS Mid-Year Population Estimates 2024
 * - NHS Digital BCG Coverage Statistics
 * - WHO Global TB Report 2024
 */
export const UK_TB_DATA: UKTBData = {
  national: {
    notifications: 5480,
    incidenceRate: 9.5,
    ukBornProportion: 0.181,
    nonUkBornProportion: 0.819,
    deaths: 340,
    caseFatalityRate: 0.062,
    mdrCases: 67,
    treatmentCompletionRate: 0.84,
  },

  byRegion: {
    london: {
      id: 'london',
      name: 'London',
      incidenceRate: 20.6,
      population: 9_000_000,
      notifications: 1854,
      urbanization: 'urban',
      deprivationDecile: 5,
      nonUkBornProportion: 0.37,
    },
    west_midlands: {
      id: 'west_midlands',
      name: 'West Midlands',
      incidenceRate: 8.5,
      population: 5_950_000,
      notifications: 506,
      urbanization: 'mixed',
      deprivationDecile: 4,
      nonUkBornProportion: 0.14,
    },
    north_west: {
      id: 'north_west',
      name: 'North West',
      incidenceRate: 6.8,
      population: 7_420_000,
      notifications: 505,
      urbanization: 'mixed',
      deprivationDecile: 4,
      nonUkBornProportion: 0.10,
    },
    yorkshire_humber: {
      id: 'yorkshire_humber',
      name: 'Yorkshire and the Humber',
      incidenceRate: 6.2,
      population: 5_480_000,
      notifications: 340,
      urbanization: 'mixed',
      deprivationDecile: 4,
      nonUkBornProportion: 0.09,
    },
    east_midlands: {
      id: 'east_midlands',
      name: 'East Midlands',
      incidenceRate: 5.9,
      population: 4_880_000,
      notifications: 288,
      urbanization: 'suburban',
      deprivationDecile: 5,
      nonUkBornProportion: 0.11,
    },
    south_east: {
      id: 'south_east',
      name: 'South East',
      incidenceRate: 5.1,
      population: 9_290_000,
      notifications: 474,
      urbanization: 'suburban',
      deprivationDecile: 7,
      nonUkBornProportion: 0.12,
    },
    east_of_england: {
      id: 'east_of_england',
      name: 'East of England',
      incidenceRate: 4.8,
      population: 6_350_000,
      notifications: 305,
      urbanization: 'suburban',
      deprivationDecile: 6,
      nonUkBornProportion: 0.11,
    },
    south_west: {
      id: 'south_west',
      name: 'South West',
      incidenceRate: 3.2,
      population: 5_720_000,
      notifications: 183,
      urbanization: 'rural',
      deprivationDecile: 6,
      nonUkBornProportion: 0.06,
    },
    north_east: {
      id: 'north_east',
      name: 'North East',
      incidenceRate: 3.0,
      population: 2_680_000,
      notifications: 80,
      urbanization: 'mixed',
      deprivationDecile: 3,
      nonUkBornProportion: 0.06,
    },
  },

  byAgeGroup: [
    {
      ageGroup: '0-4',
      minAge: 0,
      maxAge: 4,
      incidenceRate: 3.8,
      proportionOfCases: 0.025,
      caseFatalityRate: 0.008,
    },
    {
      ageGroup: '5-14',
      minAge: 5,
      maxAge: 14,
      incidenceRate: 2.9,
      proportionOfCases: 0.035,
      caseFatalityRate: 0.005,
    },
    {
      ageGroup: '15-24',
      minAge: 15,
      maxAge: 24,
      incidenceRate: 11.2,
      proportionOfCases: 0.142,
      caseFatalityRate: 0.012,
    },
    {
      ageGroup: '25-44',
      minAge: 25,
      maxAge: 44,
      incidenceRate: 14.8,
      proportionOfCases: 0.385,
      caseFatalityRate: 0.025,
    },
    {
      ageGroup: '45-64',
      minAge: 45,
      maxAge: 64,
      incidenceRate: 9.6,
      proportionOfCases: 0.245,
      caseFatalityRate: 0.068,
    },
    {
      ageGroup: '65+',
      minAge: 65,
      maxAge: 999,
      incidenceRate: 7.2,
      proportionOfCases: 0.168,
      caseFatalityRate: 0.142,
    },
  ],

  byBirthplace: {
    ukBorn: {
      category: 'UK-born',
      incidenceRate: 2.1,
      proportionOfCases: 0.181,
      estimatedPopulation: 47_200_000,
    },
    nonUkBorn: {
      category: 'Non-UK-born',
      incidenceRate: 46.9,
      proportionOfCases: 0.819,
      estimatedPopulation: 9_600_000,
    },
  },

  historicalTrends: [
    {
      year: 2019,
      incidenceRate: 8.6,
      notifications: 4723,
      deaths: 320,
      bcgCoverage: 0.91,
    },
    {
      year: 2020,
      incidenceRate: 7.3,
      notifications: 4015,
      deaths: 298,
      bcgCoverage: 0.88,
    },
    {
      year: 2021,
      incidenceRate: 7.8,
      notifications: 4380,
      deaths: 305,
      bcgCoverage: 0.86,
    },
    {
      year: 2022,
      incidenceRate: 8.0,
      notifications: 4535,
      deaths: 312,
      bcgCoverage: 0.87,
    },
    {
      year: 2023,
      incidenceRate: 8.5,
      notifications: 4890,
      deaths: 328,
      bcgCoverage: 0.88,
    },
    {
      year: 2024,
      incidenceRate: 9.5,
      notifications: 5480,
      deaths: 340,
      bcgCoverage: 0.89,
    },
  ],

  bcgCoverage: {
    neonatal: 0.89,
    healthcareWorkers: 0.95,
    highRiskNeonates: 0.92,
    year: 2024,
  },

  metadata: {
    dataYear: 2024,
    lastUpdated: '2025-01-15',
    sources: [
      'UKHSA Tuberculosis in England 2025 Report',
      'ONS Mid-Year Population Estimates 2024',
      'NHS Digital BCG Coverage Statistics',
      'WHO Global TB Report 2024',
    ],
  },
};

// ============================================================================
// Accessor Functions
// ============================================================================

/**
 * Gets TB data for a specific region by region ID
 *
 * @param regionId - The region identifier (e.g., 'london', 'west_midlands')
 * @returns Regional TB data or undefined if region not found
 *
 * @example
 * ```typescript
 * const londonData = getRegionalData('london');
 * if (londonData) {
 *   console.log(`London incidence: ${londonData.incidenceRate}/100,000`);
 * }
 * ```
 */
export function getRegionalData(regionId: string): RegionalTBData | undefined {
  return UK_TB_DATA.byRegion[regionId];
}

/**
 * Gets all regional TB data as an array
 *
 * @returns Array of all regional TB data sorted by incidence rate (descending)
 *
 * @example
 * ```typescript
 * const regions = getAllRegionalData();
 * regions.forEach(r => console.log(`${r.name}: ${r.incidenceRate}`));
 * ```
 */
export function getAllRegionalData(): RegionalTBData[] {
  return Object.values(UK_TB_DATA.byRegion).sort(
    (a, b) => b.incidenceRate - a.incidenceRate
  );
}

/**
 * Gets the current national TB incidence rate per 100,000 population
 *
 * @returns Current national incidence rate
 *
 * @example
 * ```typescript
 * const rate = getNationalIncidence();
 * console.log(`Current UK TB incidence: ${rate}/100,000`);
 * ```
 */
export function getNationalIncidence(): number {
  return UK_TB_DATA.national.incidenceRate;
}

/**
 * Gets full national TB statistics
 *
 * @returns Complete national TB statistics object
 *
 * @example
 * ```typescript
 * const stats = getNationalStatistics();
 * console.log(`Total notifications: ${stats.notifications}`);
 * console.log(`Deaths: ${stats.deaths}`);
 * ```
 */
export function getNationalStatistics(): NationalTBStatistics {
  return { ...UK_TB_DATA.national };
}

/**
 * Gets historical TB trend data from 2019-2024
 *
 * @returns Array of historical trend data points sorted by year
 *
 * @example
 * ```typescript
 * const trends = getHistoricalTrend();
 * trends.forEach(t => {
 *   console.log(`${t.year}: ${t.incidenceRate}/100,000`);
 * });
 * ```
 */
export function getHistoricalTrend(): HistoricalTrendPoint[] {
  return [...UK_TB_DATA.historicalTrends].sort((a, b) => a.year - b.year);
}

/**
 * Gets incidence rate for a specific year from historical data
 *
 * @param year - Year to look up (2019-2024)
 * @returns Incidence rate for that year or undefined if not found
 *
 * @example
 * ```typescript
 * const rate2022 = getIncidenceByYear(2022);
 * if (rate2022) {
 *   console.log(`2022 incidence: ${rate2022}/100,000`);
 * }
 * ```
 */
export function getIncidenceByYear(year: number): number | undefined {
  const trend = UK_TB_DATA.historicalTrends.find((t) => t.year === year);
  return trend?.incidenceRate;
}

/**
 * Gets current BCG vaccination coverage rates
 *
 * @returns BCG coverage data including neonatal and healthcare worker rates
 *
 * @example
 * ```typescript
 * const coverage = getBCGCoverage();
 * console.log(`Neonatal BCG: ${(coverage.neonatal * 100).toFixed(1)}%`);
 * console.log(`HCW BCG: ${(coverage.healthcareWorkers * 100).toFixed(1)}%`);
 * ```
 */
export function getBCGCoverage(): BCGCoverageData {
  return { ...UK_TB_DATA.bcgCoverage };
}

/**
 * Gets TB statistics by birthplace (UK-born vs non-UK-born)
 *
 * @returns Object containing UK-born and non-UK-born TB statistics
 *
 * @example
 * ```typescript
 * const birthplaceStats = getTBByBirthplace();
 * console.log(`UK-born rate: ${birthplaceStats.ukBorn.incidenceRate}/100,000`);
 * console.log(`Non-UK-born rate: ${birthplaceStats.nonUkBorn.incidenceRate}/100,000`);
 * ```
 */
export function getTBByBirthplace(): {
  ukBorn: BirthplaceTBData;
  nonUkBorn: BirthplaceTBData;
} {
  return {
    ukBorn: { ...UK_TB_DATA.byBirthplace.ukBorn },
    nonUkBorn: { ...UK_TB_DATA.byBirthplace.nonUkBorn },
  };
}

/**
 * Gets TB statistics by age group
 *
 * @returns Array of age group TB data
 *
 * @example
 * ```typescript
 * const ageGroups = getTBByAgeGroup();
 * const highestRisk = ageGroups.reduce((max, g) =>
 *   g.incidenceRate > max.incidenceRate ? g : max
 * );
 * console.log(`Highest risk age: ${highestRisk.ageGroup}`);
 * ```
 */
export function getTBByAgeGroup(): AgeGroupTBData[] {
  return UK_TB_DATA.byAgeGroup.map((group) => ({ ...group }));
}

/**
 * Gets the age group with highest TB incidence
 *
 * @returns Age group data for the highest risk group
 *
 * @example
 * ```typescript
 * const highRisk = getHighestRiskAgeGroup();
 * console.log(`${highRisk.ageGroup}: ${highRisk.incidenceRate}/100,000`);
 * ```
 */
export function getHighestRiskAgeGroup(): AgeGroupTBData {
  const groups = getTBByAgeGroup();
  return groups.reduce((max, group) =>
    group.incidenceRate > max.incidenceRate ? group : max
  );
}

/**
 * Calculates the relative risk ratio between non-UK-born and UK-born populations
 *
 * @returns Risk ratio (non-UK-born rate / UK-born rate)
 *
 * @example
 * ```typescript
 * const riskRatio = getBirthplaceRiskRatio();
 * console.log(`Non-UK-born have ${riskRatio.toFixed(1)}x higher TB risk`);
 * ```
 */
export function getBirthplaceRiskRatio(): number {
  const { ukBorn, nonUkBorn } = UK_TB_DATA.byBirthplace;
  return nonUkBorn.incidenceRate / ukBorn.incidenceRate;
}

/**
 * Checks if the UK is currently below WHO low-incidence threshold
 *
 * WHO defines low-incidence as < 10 cases per 100,000 population
 *
 * @returns true if current incidence is below 10/100,000
 *
 * @example
 * ```typescript
 * if (isLowIncidenceCountry()) {
 *   console.log('UK maintains low-incidence status');
 * } else {
 *   console.log('UK has exceeded low-incidence threshold');
 * }
 * ```
 */
export function isLowIncidenceCountry(): boolean {
  return UK_TB_DATA.national.incidenceRate < 10;
}

/**
 * Gets the trend direction over the historical period
 *
 * @returns 'increasing', 'decreasing', or 'stable' based on trend analysis
 *
 * @example
 * ```typescript
 * const trend = getTrendDirection();
 * console.log(`TB incidence is ${trend} in the UK`);
 * ```
 */
export function getTrendDirection(): 'increasing' | 'decreasing' | 'stable' {
  const trends = UK_TB_DATA.historicalTrends;
  const firstYear = trends[0];
  const lastYear = trends[trends.length - 1];

  const change = lastYear.incidenceRate - firstYear.incidenceRate;
  const percentChange = (change / firstYear.incidenceRate) * 100;

  if (percentChange > 5) return 'increasing';
  if (percentChange < -5) return 'decreasing';
  return 'stable';
}

/**
 * Calculates the annual incidence change rate
 *
 * @returns Average annual change in incidence rate
 *
 * @example
 * ```typescript
 * const annualChange = getAnnualIncidenceChange();
 * console.log(`Annual change: ${annualChange.toFixed(2)}/100,000 per year`);
 * ```
 */
export function getAnnualIncidenceChange(): number {
  const trends = UK_TB_DATA.historicalTrends;
  const firstYear = trends[0];
  const lastYear = trends[trends.length - 1];
  const years = lastYear.year - firstYear.year;

  return (lastYear.incidenceRate - firstYear.incidenceRate) / years;
}

/**
 * Gets data sources and metadata for the TB statistics
 *
 * @returns Metadata object with sources and update information
 *
 * @example
 * ```typescript
 * const meta = getDataMetadata();
 * console.log(`Data year: ${meta.dataYear}`);
 * console.log(`Sources: ${meta.sources.join(', ')}`);
 * ```
 */
export function getDataMetadata(): UKTBData['metadata'] {
  return { ...UK_TB_DATA.metadata };
}
