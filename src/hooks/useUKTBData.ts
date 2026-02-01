/**
 * useUKTBData Hook - UK TB Statistics Access
 *
 * Provides React components with access to UK tuberculosis statistics,
 * regional data, and BCG coverage information. Includes caching and
 * computed data transformations.
 *
 * @module hooks/useUKTBData
 */

import { useMemo, useCallback } from 'react';
import {
  UK_TB_DATA,
  getRegionalData,
  getAllRegionalData,
  getNationalIncidence,
  getNationalStatistics,
  getHistoricalTrend,
  getIncidenceByYear,
  getBCGCoverage,
  getTBByBirthplace,
  getTBByAgeGroup,
  getHighestRiskAgeGroup,
  getBirthplaceRiskRatio,
  isLowIncidenceCountry,
  getTrendDirection,
  getAnnualIncidenceChange,
  getDataMetadata,
  type NationalTBStatistics,
  type RegionalTBData,
  type AgeGroupTBData,
  type BirthplaceTBData,
  type HistoricalTrendPoint,
  type BCGCoverageData,
  type UKTBData,
} from '@/lib/data/uk-tb-stats';

import {
  getAllRegions,
  getRegionById,
  getRegionsByIncidence,
  getTotalUKPopulation,
  getLowBCGCoverageRegions,
  getEstimatedTotalCases,
  type UKRegion,
  type UKRegionId,
} from '@/lib/data/uk-regions';

/**
 * Regional data with computed values
 */
export interface EnrichedRegionalData extends RegionalTBData {
  /** Proportion of national cases */
  proportionOfNationalCases: number;
  /** Risk level classification */
  riskLevel: 'high' | 'medium' | 'low';
  /** Population-adjusted rank (1 = highest incidence) */
  incidenceRank: number;
}

/**
 * Trend analysis results
 */
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  annualChange: number;
  percentChange: number;
  projectedRate2030: number;
  yearsToTarget: number | null;
}

/**
 * Hook return type
 */
export interface UseUKTBDataReturn {
  // ============ RAW DATA ============

  /** Complete UK TB data object */
  data: UKTBData;

  /** National TB statistics */
  national: NationalTBStatistics;

  /** All regional TB data */
  regions: RegionalTBData[];

  /** All UK regions with geographic data */
  ukRegions: UKRegion[];

  /** Age group breakdown */
  ageGroups: AgeGroupTBData[];

  /** Birthplace statistics */
  birthplaceStats: {
    ukBorn: BirthplaceTBData;
    nonUkBorn: BirthplaceTBData;
  };

  /** Historical trends */
  historicalTrends: HistoricalTrendPoint[];

  /** BCG coverage data */
  bcgCoverage: BCGCoverageData;

  /** Data metadata */
  metadata: UKTBData['metadata'];

  // ============ COMPUTED VALUES ============

  /** Current national incidence rate */
  incidenceRate: number;

  /** Total UK population */
  totalPopulation: number;

  /** Whether UK is low-incidence country */
  isLowIncidence: boolean;

  /** Highest risk age group */
  highestRiskAgeGroup: AgeGroupTBData;

  /** Risk ratio between non-UK-born and UK-born */
  birthplaceRiskRatio: number;

  /** Estimated total annual cases */
  estimatedAnnualCases: number;

  /** Trend analysis */
  trendAnalysis: TrendAnalysis;

  /** Regions sorted by incidence (highest first) */
  regionsByIncidence: EnrichedRegionalData[];

  /** High incidence regions (>10/100,000) */
  highIncidenceRegions: RegionalTBData[];

  /** Regions with low BCG coverage (<85%) */
  lowBCGCoverageRegions: UKRegion[];

  // ============ ACCESSOR FUNCTIONS ============

  /** Get regional data by ID */
  getRegion: (regionId: string) => RegionalTBData | undefined;

  /** Get UK region by ID */
  getUKRegion: (regionId: UKRegionId) => UKRegion | undefined;

  /** Get incidence rate for a specific year */
  getIncidenceByYear: (year: number) => number | undefined;

  /** Get regions above a threshold incidence rate */
  getRegionsAboveThreshold: (threshold: number) => RegionalTBData[];

  /** Calculate projected incidence for a future year */
  getProjectedIncidence: (year: number) => number;

  /** Calculate WHO target progress */
  getWHOProgress: () => {
    current: number;
    target: number;
    progress: number;
    yearsRemaining: number;
  };
}

/**
 * WHO End TB Strategy target rate (per 100,000)
 */
const WHO_2035_TARGET = 10;

/**
 * UK baseline rate for WHO target calculation (2015)
 */
const UK_2015_BASELINE = 12.2;

/**
 * Risk level thresholds (per 100,000)
 */
const RISK_THRESHOLDS = {
  high: 10,
  medium: 5,
} as const;

/**
 * Hook for accessing UK TB statistics and regional data.
 *
 * Provides cached access to TB data with computed values,
 * trend analysis, and convenient accessor functions.
 *
 * @returns UK TB data and accessor functions
 *
 * @example
 * ```tsx
 * function NationalStats() {
 *   const {
 *     national,
 *     incidenceRate,
 *     isLowIncidence,
 *     trendAnalysis,
 *   } = useUKTBData();
 *
 *   return (
 *     <div>
 *       <h2>UK TB Statistics</h2>
 *       <p>Notifications: {national.notifications.toLocaleString()}</p>
 *       <p>Incidence: {incidenceRate.toFixed(1)}/100,000</p>
 *       <p>Status: {isLowIncidence ? 'Low incidence' : 'Above WHO threshold'}</p>
 *       <p>Trend: {trendAnalysis.direction}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function RegionalMap() {
 *   const { regionsByIncidence, getRegion } = useUKTBData();
 *
 *   return (
 *     <ul>
 *       {regionsByIncidence.map((region) => (
 *         <li key={region.id}>
 *           {region.name}: {region.incidenceRate}/100,000
 *           ({region.riskLevel} risk)
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function WHOProgress() {
 *   const { getWHOProgress } = useUKTBData();
 *   const progress = getWHOProgress();
 *
 *   return (
 *     <div>
 *       <h3>WHO End TB Strategy Progress</h3>
 *       <p>Current rate: {progress.current.toFixed(1)}/100,000</p>
 *       <p>Target: {progress.target}/100,000</p>
 *       <p>Progress: {progress.progress.toFixed(1)}%</p>
 *       <p>Years to 2035: {progress.yearsRemaining}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUKTBData(): UseUKTBDataReturn {
  // ============ RAW DATA (memoized) ============

  const data = useMemo(() => UK_TB_DATA, []);
  const national = useMemo(() => getNationalStatistics(), []);
  const regions = useMemo(() => getAllRegionalData(), []);
  const ukRegions = useMemo(() => getAllRegions(), []);
  const ageGroups = useMemo(() => getTBByAgeGroup(), []);
  const birthplaceStats = useMemo(() => getTBByBirthplace(), []);
  const historicalTrends = useMemo(() => getHistoricalTrend(), []);
  const bcgCoverage = useMemo(() => getBCGCoverage(), []);
  const metadata = useMemo(() => getDataMetadata(), []);

  // ============ COMPUTED VALUES ============

  const incidenceRate = useMemo(() => getNationalIncidence(), []);
  const totalPopulation = useMemo(() => getTotalUKPopulation(), []);
  const isLowIncidence = useMemo(() => isLowIncidenceCountry(), []);
  const highestRiskAgeGroup = useMemo(() => getHighestRiskAgeGroup(), []);
  const birthplaceRiskRatio = useMemo(() => getBirthplaceRiskRatio(), []);
  const estimatedAnnualCases = useMemo(() => getEstimatedTotalCases(), []);

  // Trend analysis
  const trendAnalysis = useMemo((): TrendAnalysis => {
    const direction = getTrendDirection();
    const annualChange = getAnnualIncidenceChange();
    const trends = historicalTrends;

    const firstRate = trends[0]?.incidenceRate ?? 0;
    const lastRate = trends[trends.length - 1]?.incidenceRate ?? 0;
    const percentChange = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;

    // Project forward to 2030 (assuming linear trend)
    const yearsTo2030 = 2030 - (trends[trends.length - 1]?.year ?? 2024);
    const projectedRate2030 = lastRate + annualChange * yearsTo2030;

    // Calculate years to reach WHO target (if decreasing)
    let yearsToTarget: number | null = null;
    if (annualChange < 0 && lastRate > WHO_2035_TARGET) {
      yearsToTarget = Math.ceil((lastRate - WHO_2035_TARGET) / Math.abs(annualChange));
    }

    return {
      direction,
      annualChange,
      percentChange,
      projectedRate2030: Math.max(0, projectedRate2030),
      yearsToTarget,
    };
  }, [historicalTrends]);

  // Enriched regional data with computed values
  const regionsByIncidence = useMemo((): EnrichedRegionalData[] => {
    const sortedRegions = getRegionsByIncidence();
    const totalNationalCases = national.notifications;

    return sortedRegions.map((region, index) => {
      const tbData = regions.find((r) => r.id === region.id);
      const cases = tbData?.notifications ?? 0;

      let riskLevel: 'high' | 'medium' | 'low';
      if (region.tbIncidenceRate >= RISK_THRESHOLDS.high) {
        riskLevel = 'high';
      } else if (region.tbIncidenceRate >= RISK_THRESHOLDS.medium) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      return {
        id: region.id,
        name: region.name,
        incidenceRate: region.tbIncidenceRate,
        population: region.population,
        notifications: cases,
        urbanization: tbData?.urbanization ?? 'mixed',
        deprivationDecile: tbData?.deprivationDecile ?? 5,
        nonUkBornProportion: tbData?.nonUkBornProportion ?? 0.1,
        proportionOfNationalCases: totalNationalCases > 0 ? cases / totalNationalCases : 0,
        riskLevel,
        incidenceRank: index + 1,
      };
    });
  }, [regions, national.notifications]);

  // High incidence regions
  const highIncidenceRegions = useMemo(
    () => regions.filter((r) => r.incidenceRate > RISK_THRESHOLDS.high),
    [regions]
  );

  // Low BCG coverage regions
  const lowBCGCoverageRegions = useMemo(() => getLowBCGCoverageRegions(0.85), []);

  // ============ ACCESSOR FUNCTIONS ============

  const getRegion = useCallback(
    (regionId: string): RegionalTBData | undefined => {
      return getRegionalData(regionId);
    },
    []
  );

  const getUKRegion = useCallback(
    (regionId: UKRegionId): UKRegion | undefined => {
      return getRegionById(regionId);
    },
    []
  );

  const getIncidenceForYear = useCallback(
    (year: number): number | undefined => {
      return getIncidenceByYear(year);
    },
    []
  );

  const getRegionsAboveThreshold = useCallback(
    (threshold: number): RegionalTBData[] => {
      return regions.filter((r) => r.incidenceRate > threshold);
    },
    [regions]
  );

  const getProjectedIncidence = useCallback(
    (year: number): number => {
      const latestYear = historicalTrends[historicalTrends.length - 1]?.year ?? 2024;
      const latestRate = historicalTrends[historicalTrends.length - 1]?.incidenceRate ?? incidenceRate;
      const yearsForward = year - latestYear;
      const projected = latestRate + trendAnalysis.annualChange * yearsForward;
      return Math.max(0, projected);
    },
    [historicalTrends, incidenceRate, trendAnalysis.annualChange]
  );

  const getWHOProgress = useCallback(
    () => {
      const current = incidenceRate;
      const target = WHO_2035_TARGET;
      const baseline = UK_2015_BASELINE;

      // Progress is reduction achieved as percentage of required reduction
      const requiredReduction = baseline - target;
      const achievedReduction = baseline - current;
      const progress = requiredReduction > 0 ? (achievedReduction / requiredReduction) * 100 : 0;

      // Years remaining to 2035
      const currentYear = new Date().getFullYear();
      const yearsRemaining = 2035 - currentYear;

      return {
        current,
        target,
        progress: Math.max(0, Math.min(100, progress)),
        yearsRemaining: Math.max(0, yearsRemaining),
      };
    },
    [incidenceRate]
  );

  return {
    // Raw data
    data,
    national,
    regions,
    ukRegions,
    ageGroups,
    birthplaceStats,
    historicalTrends,
    bcgCoverage,
    metadata,

    // Computed values
    incidenceRate,
    totalPopulation,
    isLowIncidence,
    highestRiskAgeGroup,
    birthplaceRiskRatio,
    estimatedAnnualCases,
    trendAnalysis,
    regionsByIncidence,
    highIncidenceRegions,
    lowBCGCoverageRegions,

    // Accessor functions
    getRegion,
    getUKRegion,
    getIncidenceByYear: getIncidenceForYear,
    getRegionsAboveThreshold,
    getProjectedIncidence,
    getWHOProgress,
  };
}

/**
 * Hook for accessing data for a specific region.
 *
 * @param regionId - The region identifier
 * @returns Region-specific data or undefined if not found
 *
 * @example
 * ```tsx
 * function LondonStats() {
 *   const london = useRegionData('london');
 *
 *   if (!london) {
 *     return <p>Region not found</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <h2>{london.tbData?.name ?? london.region?.name}</h2>
 *       <p>Population: {london.region?.population.toLocaleString()}</p>
 *       <p>Incidence: {london.tbData?.incidenceRate}/100,000</p>
 *       <p>BCG Coverage: {((london.region?.bcgCoverage ?? 0) * 100).toFixed(0)}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegionData(regionId: string): {
  tbData: RegionalTBData | undefined;
  region: UKRegion | undefined;
  enrichedData: EnrichedRegionalData | undefined;
} | null {
  const { regions, regionsByIncidence } = useUKTBData();

  return useMemo(() => {
    const tbData = regions.find((r) => r.id === regionId);
    const region = getRegionById(regionId as UKRegionId);
    const enrichedData = regionsByIncidence.find((r) => r.id === regionId);

    if (!tbData && !region) {
      return null;
    }

    return {
      tbData,
      region,
      enrichedData,
    };
  }, [regionId, regions, regionsByIncidence]);
}

/**
 * Hook for comparing TB data between two regions.
 *
 * @param regionId1 - First region identifier
 * @param regionId2 - Second region identifier
 * @returns Comparison data between the two regions
 *
 * @example
 * ```tsx
 * function RegionComparison() {
 *   const comparison = useRegionComparison('london', 'south_west');
 *
 *   if (!comparison) {
 *     return <p>Regions not found</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>
 *         {comparison.region1.name} has{' '}
 *         {comparison.incidenceRatio.toFixed(1)}x higher incidence than{' '}
 *         {comparison.region2.name}
 *       </p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegionComparison(
  regionId1: string,
  regionId2: string
): {
  region1: RegionalTBData;
  region2: RegionalTBData;
  incidenceRatio: number;
  populationRatio: number;
  casesDifference: number;
} | null {
  const { regions } = useUKTBData();

  return useMemo(() => {
    const region1 = regions.find((r) => r.id === regionId1);
    const region2 = regions.find((r) => r.id === regionId2);

    if (!region1 || !region2) {
      return null;
    }

    return {
      region1,
      region2,
      incidenceRatio: region2.incidenceRate > 0 ? region1.incidenceRate / region2.incidenceRate : 0,
      populationRatio: region2.population > 0 ? region1.population / region2.population : 0,
      casesDifference: region1.notifications - region2.notifications,
    };
  }, [regions, regionId1, regionId2]);
}

export default useUKTBData;

// Re-export types for convenience
export type {
  NationalTBStatistics,
  RegionalTBData,
  AgeGroupTBData,
  BirthplaceTBData,
  HistoricalTrendPoint,
  BCGCoverageData,
  UKTBData,
  UKRegion,
  UKRegionId,
};
