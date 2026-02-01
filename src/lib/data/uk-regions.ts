/**
 * UK Regions Data Module
 *
 * Provides accessor functions for UK regional data including
 * population, TB incidence rates, and geographic information.
 *
 * @module lib/data/uk-regions
 */

import { UK_REGIONS, UKRegion, UKRegionId } from '@/types/geography';

/**
 * Retrieves a specific UK region by its identifier.
 *
 * @param id - The unique identifier of the region
 * @returns The UKRegion object if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const london = getRegionById('london');
 * console.log(london?.population); // 9000000
 * ```
 */
export function getRegionById(id: UKRegionId): UKRegion | undefined {
  return UK_REGIONS.find((region) => region.id === id);
}

/**
 * Returns all UK regions.
 *
 * @returns Array of all UKRegion objects
 *
 * @example
 * ```typescript
 * const regions = getAllRegions();
 * console.log(regions.length); // 12
 * ```
 */
export function getAllRegions(): UKRegion[] {
  return [...UK_REGIONS];
}

/**
 * Returns UK regions sorted by TB incidence rate (highest first).
 *
 * @returns Array of UKRegion objects sorted by tbIncidenceRate in descending order
 *
 * @example
 * ```typescript
 * const sortedRegions = getRegionsByIncidence();
 * console.log(sortedRegions[0].id); // 'london' (highest incidence)
 * ```
 */
export function getRegionsByIncidence(): UKRegion[] {
  return [...UK_REGIONS].sort((a, b) => b.tbIncidenceRate - a.tbIncidenceRate);
}

/**
 * Returns UK regions with TB incidence rate above a specified threshold.
 *
 * @param threshold - The minimum TB incidence rate per 100,000 population
 * @returns Array of UKRegion objects with incidence rate above threshold
 *
 * @example
 * ```typescript
 * // Get regions with incidence rate above 10 per 100,000
 * const highIncidence = getHighIncidenceRegions(10);
 * console.log(highIncidence.map(r => r.name)); // ['London']
 * ```
 */
export function getHighIncidenceRegions(threshold: number): UKRegion[] {
  return UK_REGIONS.filter((region) => region.tbIncidenceRate > threshold);
}

/**
 * Calculates the total UK population across all regions.
 *
 * @returns The sum of all region populations
 *
 * @example
 * ```typescript
 * const totalPop = getTotalUKPopulation();
 * console.log(totalPop); // ~67350000
 * ```
 */
export function getTotalUKPopulation(): number {
  return UK_REGIONS.reduce((total, region) => total + region.population, 0);
}

/**
 * Calculates the population-weighted average TB incidence rate for the UK.
 *
 * The weighted average accounts for different regional populations,
 * providing a more accurate national incidence rate than a simple average.
 *
 * @returns The weighted average TB incidence rate per 100,000 population
 *
 * @example
 * ```typescript
 * const avgRate = getAverageIncidenceRate();
 * console.log(avgRate.toFixed(1)); // ~8.0-9.0 per 100,000
 * ```
 */
export function getAverageIncidenceRate(): number {
  const totalPopulation = getTotalUKPopulation();

  if (totalPopulation === 0) {
    return 0;
  }

  const weightedSum = UK_REGIONS.reduce(
    (sum, region) => sum + region.tbIncidenceRate * region.population,
    0
  );

  return weightedSum / totalPopulation;
}

/**
 * Returns regions sorted by population (highest first).
 *
 * @returns Array of UKRegion objects sorted by population in descending order
 *
 * @example
 * ```typescript
 * const byPop = getRegionsByPopulation();
 * console.log(byPop[0].id); // 'south_east' (most populous)
 * ```
 */
export function getRegionsByPopulation(): UKRegion[] {
  return [...UK_REGIONS].sort((a, b) => b.population - a.population);
}

/**
 * Returns regions with BCG coverage below a specified threshold.
 *
 * Useful for identifying regions that may benefit from
 * increased vaccination efforts.
 *
 * @param threshold - The maximum BCG coverage ratio (0-1)
 * @returns Array of UKRegion objects with BCG coverage below threshold
 *
 * @example
 * ```typescript
 * // Get regions with BCG coverage below 87%
 * const lowCoverage = getLowBCGCoverageRegions(0.87);
 * ```
 */
export function getLowBCGCoverageRegions(threshold: number): UKRegion[] {
  return UK_REGIONS.filter((region) => region.bcgCoverage < threshold);
}

/**
 * Calculates total estimated TB cases across all regions.
 *
 * Based on incidence rate and population for each region.
 *
 * @returns Estimated total annual TB cases
 *
 * @example
 * ```typescript
 * const totalCases = getEstimatedTotalCases();
 * console.log(totalCases); // ~5000-6000
 * ```
 */
export function getEstimatedTotalCases(): number {
  return UK_REGIONS.reduce((total, region) => {
    const cases = (region.tbIncidenceRate / 100_000) * region.population;
    return total + cases;
  }, 0);
}

// Re-export types and constants for convenience
export { UK_REGIONS } from '@/types/geography';
export type { UKRegion, UKRegionId } from '@/types/geography';
