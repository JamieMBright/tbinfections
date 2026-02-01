/**
 * Simulation Web Worker
 *
 * This module provides the Web Worker entry point for running the TB
 * epidemiological simulation off the main thread. It handles message-based
 * communication with the main thread, manages the simulation lifecycle,
 * and batches state updates for optimal UI performance.
 *
 * The worker runs at 60fps update intervals (16ms) to ensure smooth
 * visualization while keeping the main thread responsive.
 *
 * @module simulation/worker
 */

import type {
  SimulationConfig,
  SimulationState,
  SimulationEvent,
  CompartmentState,
  SimulationMetrics,
  TimeSeriesPoint,
  RegionState,
} from '@/types/simulation';

import { SimulationEngine } from './engine';

/**
 * Web Worker global scope type declarations
 * These are needed because the worker runs in a separate context from the DOM
 */
interface DedicatedWorkerGlobalScope {
  onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent) => void) | null;
  onerror: ((this: DedicatedWorkerGlobalScope, ev: ErrorEvent) => void) | null;
  onunhandledrejection: ((this: DedicatedWorkerGlobalScope, ev: PromiseRejectionEvent) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  close(): void;
}

/**
 * Message types sent from the main thread to the worker
 */
export interface WorkerInput {
  /** Command type to execute */
  type: 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'SET_SPEED' | 'UPDATE_CONFIG';
  /** Simulation configuration (required for START) */
  config?: SimulationConfig;
  /** Initial or restored simulation state */
  state?: SerializableSimulationState;
  /** Speed multiplier for SET_SPEED command */
  speed?: number;
}

/**
 * Message types sent from the worker to the main thread
 */
export interface WorkerOutput {
  /** Message type */
  type: 'STATE_UPDATE' | 'EVENT' | 'COMPLETE' | 'ERROR';
  /** Partial or complete simulation state */
  state?: SerializableSimulationState;
  /** Simulation event that occurred */
  event?: SimulationEvent;
  /** Error message if type is ERROR */
  error?: string;
}

/**
 * Serializable version of SimulationState
 *
 * Web Workers require data to be transferable via structured clone.
 * Map objects are converted to record types for serialization.
 */
export interface SerializableSimulationState {
  /** Current day in simulation */
  currentDay: number;
  /** Current simulated date as ISO string */
  currentTime: string;
  /** Total compartment counts */
  compartments: CompartmentState;
  /** State by region (serialized from Map) */
  regionStates: Record<string, RegionState>;
  /** State by population group (serialized from Map) */
  groupStates: Record<string, CompartmentState>;
  /** Historical time series */
  history: TimeSeriesPoint[];
  /** Event log */
  events: SimulationEvent[];
  /** Derived metrics */
  metrics: SimulationMetrics;
  /** Simulation status */
  status: 'idle' | 'running' | 'paused' | 'completed';
  /** Playback speed multiplier */
  speed: number;
}

/**
 * Converts a SimulationState with Map objects to a serializable format
 *
 * @param state - The simulation state to serialize
 * @returns Serializable state object
 */
function serializeState(state: SimulationState): SerializableSimulationState {
  const regionStates: Record<string, RegionState> = {};
  state.regionStates.forEach((value, key) => {
    regionStates[key] = value;
  });

  const groupStates: Record<string, CompartmentState> = {};
  state.groupStates.forEach((value, key) => {
    groupStates[key] = value;
  });

  return {
    currentDay: state.currentDay,
    currentTime: state.currentTime.toISOString(),
    compartments: state.compartments,
    regionStates,
    groupStates,
    history: state.history,
    events: state.events,
    metrics: state.metrics,
    status: state.status,
    speed: state.speed,
  };
}

/**
 * Target frame rate for UI updates (60fps)
 */
const TARGET_FPS = 60;

/**
 * Update interval in milliseconds (~16ms for 60fps)
 */
const UPDATE_INTERVAL_MS = Math.floor(1000 / TARGET_FPS);

/**
 * Maximum steps per frame to prevent runaway execution
 */
const MAX_STEPS_PER_FRAME = 100;

/**
 * Worker context type for TypeScript
 */
declare const self: DedicatedWorkerGlobalScope;

/**
 * SimulationWorker manages the simulation lifecycle within the Web Worker.
 *
 * Responsibilities:
 * - Initialize and manage SimulationEngine instance
 * - Handle start/pause/resume/stop commands
 * - Run simulation loop at appropriate speed
 * - Batch and send state updates to main thread
 * - Handle configuration updates during runtime
 *
 * @example
 * ```typescript
 * // In worker context
 * const worker = new SimulationWorker();
 * self.onmessage = (e) => worker.handleMessage(e.data);
 * ```
 */
class SimulationWorker {
  /** The simulation engine instance */
  private engine: SimulationEngine | null = null;

  /** Interval ID for the simulation loop */
  private loopIntervalId: ReturnType<typeof setInterval> | null = null;

  /** Current simulation speed multiplier */
  private speed: number = 1;

  /** Whether the simulation is currently running */
  private isRunning: boolean = false;

  /** Whether the simulation is paused */
  private isPaused: boolean = false;

  /** Last event count for incremental event sending */
  private lastEventCount: number = 0;

  /** Timestamp of last update sent to main thread */
  private lastUpdateTime: number = 0;

  /**
   * Creates a new SimulationWorker instance
   */
  constructor() {
    this.engine = null;
    this.loopIntervalId = null;
    this.speed = 1;
    this.isRunning = false;
    this.isPaused = false;
    this.lastEventCount = 0;
    this.lastUpdateTime = 0;
  }

  /**
   * Handles incoming messages from the main thread
   *
   * @param message - The worker input message
   */
  public handleMessage(message: WorkerInput): void {
    try {
      switch (message.type) {
        case 'START':
          this.handleStart(message);
          break;
        case 'PAUSE':
          this.handlePause();
          break;
        case 'RESUME':
          this.handleResume();
          break;
        case 'STOP':
          this.handleStop();
          break;
        case 'SET_SPEED':
          this.handleSetSpeed(message);
          break;
        case 'UPDATE_CONFIG':
          this.handleUpdateConfig(message);
          break;
        default:
          this.sendError(`Unknown message type: ${(message as WorkerInput).type}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handles the START command to initialize and begin simulation
   *
   * @param message - The start message containing configuration
   */
  private handleStart(message: WorkerInput): void {
    if (!message.config) {
      this.sendError('START command requires a config object');
      return;
    }

    // Stop any existing simulation
    this.handleStop();

    // Create and initialize the engine
    this.engine = new SimulationEngine(message.config);
    this.engine.initialize();

    // Set speed if provided
    if (typeof message.speed === 'number') {
      this.speed = this.clampSpeed(message.speed);
      this.engine.setSpeed(this.speed);
    }

    // Reset tracking variables
    this.lastEventCount = 0;
    this.lastUpdateTime = performance.now();
    this.isPaused = false;
    this.isRunning = true;

    // Send initial state
    this.sendStateUpdate();

    // Start the simulation loop
    this.startLoop();
  }

  /**
   * Handles the PAUSE command to pause the simulation
   */
  private handlePause(): void {
    if (!this.engine || !this.isRunning) {
      return;
    }

    this.isPaused = true;
    this.engine.pause();

    // Stop the loop but keep engine state
    this.stopLoop();

    // Send updated state with paused status
    this.sendStateUpdate();
  }

  /**
   * Handles the RESUME command to resume a paused simulation
   */
  private handleResume(): void {
    if (!this.engine || !this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.engine.resume();
    this.lastUpdateTime = performance.now();

    // Restart the simulation loop
    this.startLoop();

    // Send updated state
    this.sendStateUpdate();
  }

  /**
   * Handles the STOP command to completely stop and clean up
   */
  private handleStop(): void {
    this.stopLoop();

    this.isRunning = false;
    this.isPaused = false;
    this.engine = null;
    this.lastEventCount = 0;
  }

  /**
   * Handles the SET_SPEED command to change simulation speed
   *
   * @param message - The message containing the new speed
   */
  private handleSetSpeed(message: WorkerInput): void {
    if (typeof message.speed !== 'number') {
      this.sendError('SET_SPEED command requires a speed number');
      return;
    }

    this.speed = this.clampSpeed(message.speed);

    if (this.engine) {
      this.engine.setSpeed(this.speed);
    }
  }

  /**
   * Handles the UPDATE_CONFIG command to modify simulation configuration
   *
   * @param message - The message containing configuration updates
   */
  private handleUpdateConfig(message: WorkerInput): void {
    if (!this.engine) {
      this.sendError('Cannot update config: no simulation running');
      return;
    }

    if (!message.config) {
      this.sendError('UPDATE_CONFIG command requires a config object');
      return;
    }

    // Update the engine configuration
    this.engine.updateConfig(message.config);

    // Send updated state
    this.sendStateUpdate();
  }

  /**
   * Starts the simulation loop using setInterval
   *
   * The loop runs at the target frame rate and executes simulation
   * steps based on the speed multiplier.
   */
  private startLoop(): void {
    if (this.loopIntervalId !== null) {
      return;
    }

    this.loopIntervalId = setInterval(() => {
      this.runLoopIteration();
    }, UPDATE_INTERVAL_MS);
  }

  /**
   * Stops the simulation loop
   */
  private stopLoop(): void {
    if (this.loopIntervalId !== null) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
  }

  /**
   * Runs a single iteration of the simulation loop
   *
   * This method:
   * 1. Calculates how many steps to run based on speed and elapsed time
   * 2. Runs the simulation steps
   * 3. Sends state updates and events to main thread
   * 4. Checks for simulation completion
   */
  private runLoopIteration(): void {
    if (!this.engine || !this.isRunning || this.isPaused) {
      return;
    }

    try {
      const now = performance.now();
      const elapsed = now - this.lastUpdateTime;
      this.lastUpdateTime = now;

      // Calculate steps to run based on speed and elapsed time
      // At speed 1, run 1 day per second (1000ms)
      // This gives a good visual pace for understanding the simulation
      const stepsPerSecond = this.speed;
      const stepsToRun = Math.max(1, Math.min(
        MAX_STEPS_PER_FRAME,
        Math.floor((elapsed / 1000) * stepsPerSecond)
      ));

      // Run simulation steps
      for (let i = 0; i < stepsToRun; i++) {
        const state = this.engine.step();

        // Check for new events and send them
        this.checkAndSendEvents();

        // Check if simulation is complete
        if (state.status === 'completed') {
          this.handleSimulationComplete();
          return;
        }
      }

      // Send state update
      this.sendStateUpdate();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Checks for new events and sends them to the main thread
   */
  private checkAndSendEvents(): void {
    if (!this.engine) {
      return;
    }

    const state = this.engine.getState();
    const newEventCount = state.events.length;

    // Send any new events since last check
    if (newEventCount > this.lastEventCount) {
      const newEvents = state.events.slice(this.lastEventCount);
      for (const event of newEvents) {
        this.sendEvent(event);
      }
      this.lastEventCount = newEventCount;
    }
  }

  /**
   * Handles simulation completion
   */
  private handleSimulationComplete(): void {
    this.stopLoop();
    this.isRunning = false;

    // Send final state
    this.sendStateUpdate();

    // Send completion message
    const output: WorkerOutput = {
      type: 'COMPLETE',
      state: this.engine ? serializeState(this.engine.getState()) : undefined,
    };

    self.postMessage(output);
  }

  /**
   * Sends a state update to the main thread
   */
  private sendStateUpdate(): void {
    if (!this.engine) {
      return;
    }

    const output: WorkerOutput = {
      type: 'STATE_UPDATE',
      state: serializeState(this.engine.getState()),
    };

    self.postMessage(output);
  }

  /**
   * Sends an event to the main thread
   *
   * @param event - The simulation event to send
   */
  private sendEvent(event: SimulationEvent): void {
    const output: WorkerOutput = {
      type: 'EVENT',
      event,
    };

    self.postMessage(output);
  }

  /**
   * Sends an error message to the main thread
   *
   * @param message - The error message
   */
  private sendError(message: string): void {
    const output: WorkerOutput = {
      type: 'ERROR',
      error: message,
    };

    self.postMessage(output);
  }

  /**
   * Handles errors that occur during simulation
   *
   * @param error - The error that occurred
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error
      ? error.message
      : 'An unknown error occurred';

    // Log error for debugging
    console.error('[SimulationWorker] Error:', error);

    // Stop the simulation to prevent cascading errors
    this.handleStop();

    // Send error to main thread
    this.sendError(errorMessage);
  }

  /**
   * Clamps speed value to valid range (0.1 to 100)
   *
   * @param speed - The speed value to clamp
   * @returns Clamped speed value
   */
  private clampSpeed(speed: number): number {
    return Math.max(0.1, Math.min(100, speed));
  }
}

/**
 * Worker instance
 */
const simulationWorker = new SimulationWorker();

/**
 * Message handler for the Web Worker
 *
 * Receives messages from the main thread and delegates to the
 * SimulationWorker instance for processing.
 *
 * @param event - The message event from the main thread
 */
self.onmessage = (event: MessageEvent<WorkerInput>): void => {
  simulationWorker.handleMessage(event.data);
};

/**
 * Error handler for uncaught exceptions in the worker
 */
self.onerror = (event: ErrorEvent): void => {
  console.error('[SimulationWorker] Uncaught error:', event.message);

  const output: WorkerOutput = {
    type: 'ERROR',
    error: `Uncaught worker error: ${event.message}`,
  };

  self.postMessage(output);
};

/**
 * Handler for unhandled promise rejections
 */
self.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  console.error('[SimulationWorker] Unhandled rejection:', event.reason);

  const output: WorkerOutput = {
    type: 'ERROR',
    error: `Unhandled promise rejection: ${String(event.reason)}`,
  };

  self.postMessage(output);
};

// Export types for use in main thread
export type { SimulationConfig, SimulationState, SimulationEvent };
