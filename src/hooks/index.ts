/**
 * Custom React Hooks for TB Infections Simulator
 *
 * This module exports all custom hooks used throughout the application
 * for simulation control, data access, and animation management.
 *
 * @module hooks
 */

// Simulation state and control
export {
  useSimulation,
  useSimulationSelector,
  useScenarios,
  type UseSimulationReturn,
} from './useSimulation';

// Web Worker management
export {
  useSimulationWorker,
  type UseSimulationWorkerReturn,
  type WorkerCommand,
  type WorkerResponse,
  type WorkerCommandType,
  type WorkerResponseType,
  type WorkerStatus,
  type WorkerError,
} from './useSimulationWorker';

// Animation frame loop
export {
  useAnimationFrame,
  useFrameCallback,
  type AnimationFrameCallback,
  type AnimationFrameState,
  type UseAnimationFrameOptions,
  type UseAnimationFrameReturn,
} from './useAnimationFrame';

// UK TB data access
export {
  useUKTBData,
  useRegionData,
  useRegionComparison,
  type UseUKTBDataReturn,
  type EnrichedRegionalData,
  type TrendAnalysis,
  // Re-exported data types
  type NationalTBStatistics,
  type RegionalTBData,
  type AgeGroupTBData,
  type BirthplaceTBData,
  type HistoricalTrendPoint,
  type BCGCoverageData,
  type UKTBData,
  type UKRegion,
  type UKRegionId,
} from './useUKTBData';
