/**
 * useSimulation Hook - Simulation Store Interface
 *
 * Provides a convenient interface for components to interact with the
 * TB simulation state and controls. Connects to the Zustand simulation
 * store with memoized selectors for optimal performance.
 *
 * @module hooks/useSimulation
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useSimulationStore,
  selectStatus,
  selectCurrentDay,
  selectCompartments,
  selectMetrics,
  selectSpeed,
  selectComparison,
  selectVaccinationPolicy,
  selectActiveInterventions,
} from '@/stores/simulation-store';
import type {
  SimulationConfig,
  SimulationState,
  CompartmentState,
  SimulationMetrics,
  VaccinationPolicy,
  PolicyIntervention,
  ScenarioPreset,
} from '@/types/simulation';

/**
 * Simulation hook return type
 */
export interface UseSimulationReturn {
  // ============ STATE ============

  /** Current simulation state */
  state: SimulationState;

  /** Current simulation configuration */
  config: SimulationConfig;

  /** Current simulation status */
  status: SimulationState['status'];

  /** Current simulation day */
  currentDay: number;

  /** Current compartment state */
  compartments: CompartmentState;

  /** Current simulation metrics */
  metrics: SimulationMetrics;

  /** Playback speed multiplier */
  speed: number;

  /** Vaccination policy configuration */
  vaccinationPolicy: VaccinationPolicy;

  /** Active policy interventions */
  activeInterventions: PolicyIntervention[];

  /** Whether simulation is running */
  isRunning: boolean;

  /** Whether simulation is paused */
  isPaused: boolean;

  /** Whether simulation is idle (not started) */
  isIdle: boolean;

  /** Whether simulation has completed */
  isCompleted: boolean;

  /** Progress percentage (0-100) */
  progress: number;

  // ============ COMPARISON ============

  /** Whether comparison mode is enabled */
  comparisonEnabled: boolean;

  /** Baseline state for comparison */
  baselineState: SimulationState | null;

  // ============ ACTIONS ============

  /** Initialize the simulation */
  initialize: () => void;

  /** Start the simulation */
  start: () => void;

  /** Pause the running simulation */
  pause: () => void;

  /** Resume a paused simulation */
  resume: () => void;

  /** Toggle between pause and resume */
  togglePause: () => void;

  /** Reset simulation to initial state */
  reset: () => void;

  /** Advance simulation by one time step */
  step: () => void;

  /** Update playback speed */
  setSpeed: (speed: number) => void;

  /** Update simulation configuration */
  setConfig: (config: Partial<SimulationConfig>) => void;

  /** Load a pre-built scenario */
  loadScenario: (scenarioId: string) => void;

  /** Update simulation state (typically from worker) */
  updateState: (newState: Partial<SimulationState>) => void;

  /** Enable or disable comparison mode */
  enableComparison: (enable: boolean) => void;

  /** Set baseline state for comparison */
  setBaselineState: (state: SimulationState | null) => void;
}

/**
 * Hook for interacting with the TB simulation.
 *
 * Provides access to simulation state, configuration, and control methods
 * with optimized selectors for performance.
 *
 * @param autoInitialize - Whether to automatically initialize the simulation on mount (default: true)
 * @returns Simulation state and control methods
 *
 * @example
 * ```tsx
 * function SimulationControls() {
 *   const {
 *     status,
 *     currentDay,
 *     metrics,
 *     start,
 *     pause,
 *     reset,
 *     isRunning,
 *   } = useSimulation();
 *
 *   return (
 *     <div>
 *       <p>Day: {currentDay}</p>
 *       <p>Status: {status}</p>
 *       <p>Infections: {metrics.totalInfections}</p>
 *       <button onClick={isRunning ? pause : start}>
 *         {isRunning ? 'Pause' : 'Start'}
 *       </button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using specific selectors for performance
 * function MetricsDisplay() {
 *   const { metrics, compartments } = useSimulation();
 *
 *   return (
 *     <div>
 *       <p>Effective R: {metrics.effectiveR.toFixed(2)}</p>
 *       <p>Active cases: {compartments.I.toLocaleString()}</p>
 *       <p>Vaccinated: {compartments.V.toLocaleString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSimulation(autoInitialize = true): UseSimulationReturn {
  // Use shallow comparison for object selections to prevent unnecessary rerenders
  const storeState = useSimulationStore(
    useShallow((store) => ({
      state: store.state,
      config: store.config,
      comparisonEnabled: store.comparisonEnabled,
      baselineState: store.baselineState,
    }))
  );

  const storeActions = useSimulationStore(
    useShallow((store) => ({
      initialize: store.initialize,
      start: store.start,
      pause: store.pause,
      resume: store.resume,
      reset: store.reset,
      step: store.step,
      setSpeed: store.setSpeed,
      setConfig: store.setConfig,
      loadScenario: store.loadScenario,
      updateState: store.updateState,
      enableComparison: store.enableComparison,
      setBaselineState: store.setBaselineState,
    }))
  );

  // Individual selectors for granular updates
  const status = useSimulationStore(selectStatus);
  const currentDay = useSimulationStore(selectCurrentDay);
  const compartments = useSimulationStore(selectCompartments);
  const metrics = useSimulationStore(selectMetrics);
  const speed = useSimulationStore(selectSpeed);
  const vaccinationPolicy = useSimulationStore(selectVaccinationPolicy);
  const activeInterventions = useSimulationStore(selectActiveInterventions);
  const comparison = useSimulationStore(selectComparison);

  // Derived state
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';

  // Calculate progress percentage
  const progress = useMemo(() => {
    const duration = storeState.config.duration;
    if (duration === 0) return 0;
    return Math.min(100, (currentDay / duration) * 100);
  }, [currentDay, storeState.config.duration]);

  // Toggle pause action
  const togglePause = useCallback(() => {
    if (isRunning) {
      storeActions.pause();
    } else if (isPaused) {
      storeActions.resume();
    } else if (isIdle) {
      storeActions.start();
    }
  }, [isRunning, isPaused, isIdle, storeActions]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize && isIdle && currentDay === 0) {
      storeActions.initialize();
    }
  }, [autoInitialize, isIdle, currentDay, storeActions]);

  return {
    // State
    state: storeState.state,
    config: storeState.config,
    status,
    currentDay,
    compartments,
    metrics,
    speed,
    vaccinationPolicy,
    activeInterventions,
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    progress,

    // Comparison
    comparisonEnabled: comparison.enabled,
    baselineState: comparison.baseline,

    // Actions
    initialize: storeActions.initialize,
    start: storeActions.start,
    pause: storeActions.pause,
    resume: storeActions.resume,
    togglePause,
    reset: storeActions.reset,
    step: storeActions.step,
    setSpeed: storeActions.setSpeed,
    setConfig: storeActions.setConfig,
    loadScenario: storeActions.loadScenario,
    updateState: storeActions.updateState,
    enableComparison: storeActions.enableComparison,
    setBaselineState: storeActions.setBaselineState,
  };
}

/**
 * Hook for subscribing to specific simulation state slices.
 *
 * Use this for performance-critical components that only need
 * to react to specific state changes.
 *
 * @param selector - Selector function to extract state slice
 * @returns Selected state slice
 *
 * @example
 * ```tsx
 * // Only re-render when currentDay changes
 * function DayDisplay() {
 *   const currentDay = useSimulationSelector(selectCurrentDay);
 *   return <span>Day {currentDay}</span>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Custom selector
 * function InfectiousCount() {
 *   const infectious = useSimulationSelector(
 *     (store) => store.state.compartments.I
 *   );
 *   return <span>{infectious.toLocaleString()} active cases</span>;
 * }
 * ```
 */
export function useSimulationSelector<T>(
  selector: (store: ReturnType<typeof useSimulationStore.getState>) => T
): T {
  return useSimulationStore(selector);
}

/**
 * Hook for accessing scenario presets.
 *
 * @returns Object containing available scenarios and loading function
 *
 * @example
 * ```tsx
 * function ScenarioSelector() {
 *   const { scenarios, loadScenario, currentScenarioId } = useScenarios();
 *
 *   return (
 *     <select
 *       value={currentScenarioId}
 *       onChange={(e) => loadScenario(e.target.value)}
 *     >
 *       {Object.values(scenarios).map((scenario) => (
 *         <option key={scenario.id} value={scenario.id}>
 *           {scenario.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useScenarios(): {
  scenarios: Record<string, ScenarioPreset>;
  loadScenario: (scenarioId: string) => void;
  currentScenarioId: string;
} {
  const loadScenario = useSimulationStore((store) => store.loadScenario);
  const currentScenarioId = useSimulationStore((store) => store.config.id);

  // Import scenario presets - these are re-exported from the store
  const scenarios = useMemo(() => {
    // Dynamically import to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SCENARIO_PRESETS } = require('@/stores/simulation-store');
    return SCENARIO_PRESETS as Record<string, ScenarioPreset>;
  }, []);

  return {
    scenarios,
    loadScenario,
    currentScenarioId,
  };
}

export default useSimulation;
