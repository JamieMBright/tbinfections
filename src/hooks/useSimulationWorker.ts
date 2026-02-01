/**
 * useSimulationWorker Hook - Web Worker Lifecycle Management
 *
 * Manages the creation, communication, and cleanup of a Web Worker
 * for running TB simulation calculations off the main thread.
 * This prevents UI blocking during intensive simulation steps.
 *
 * @module hooks/useSimulationWorker
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SimulationConfig,
  SimulationState,
  CompartmentState,
  SimulationMetrics,
} from '@/types/simulation';

/**
 * Message types sent to the worker
 */
export type WorkerCommandType =
  | 'initialize'
  | 'start'
  | 'pause'
  | 'resume'
  | 'step'
  | 'run'
  | 'reset'
  | 'updateConfig'
  | 'terminate';

/**
 * Message types received from the worker
 */
export type WorkerResponseType =
  | 'initialized'
  | 'stateUpdate'
  | 'stepComplete'
  | 'runComplete'
  | 'error'
  | 'progress';

/**
 * Command message sent to the worker
 */
export interface WorkerCommand {
  type: WorkerCommandType;
  payload?: {
    config?: SimulationConfig;
    steps?: number;
    partialConfig?: Partial<SimulationConfig>;
  };
  id: string;
}

/**
 * Response message received from the worker
 */
export interface WorkerResponse {
  type: WorkerResponseType;
  payload: {
    state?: SimulationState;
    compartments?: CompartmentState;
    metrics?: SimulationMetrics;
    day?: number;
    progress?: number;
    error?: string;
    errorCode?: string;
  };
  commandId?: string;
}

/**
 * Worker status states
 */
export type WorkerStatus = 'idle' | 'initializing' | 'ready' | 'running' | 'error' | 'terminated';

/**
 * Worker error information
 */
export interface WorkerError {
  message: string;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Hook return type
 */
export interface UseSimulationWorkerReturn {
  /** Current worker status */
  status: WorkerStatus;

  /** Whether worker is ready to accept commands */
  isReady: boolean;

  /** Whether worker is currently processing */
  isProcessing: boolean;

  /** Last error from the worker */
  error: WorkerError | null;

  /** Initialize the worker with config */
  initialize: (config: SimulationConfig) => Promise<void>;

  /** Start the simulation in the worker */
  start: () => void;

  /** Pause the simulation */
  pause: () => void;

  /** Resume the simulation */
  resume: () => void;

  /** Run a specific number of steps */
  run: (steps: number) => Promise<SimulationState | null>;

  /** Run a single step */
  step: () => Promise<SimulationState | null>;

  /** Reset the simulation */
  reset: () => void;

  /** Update simulation configuration */
  updateConfig: (config: Partial<SimulationConfig>) => void;

  /** Terminate the worker */
  terminate: () => void;

  /** Attempt to recover from an error */
  recover: () => Promise<boolean>;

  /** Subscribe to state updates */
  onStateUpdate: (callback: (state: SimulationState) => void) => () => void;

  /** Subscribe to progress updates */
  onProgress: (callback: (progress: number) => void) => () => void;
}

/**
 * Generate unique command ID
 */
function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook for managing the simulation Web Worker.
 *
 * Handles worker lifecycle, message passing, error recovery,
 * and cleanup on unmount.
 *
 * @param workerUrl - URL to the worker script (default: '/workers/simulation-worker.js')
 * @returns Worker control interface
 *
 * @example
 * ```tsx
 * function SimulationRunner() {
 *   const {
 *     status,
 *     isReady,
 *     initialize,
 *     run,
 *     onStateUpdate,
 *     error,
 *   } = useSimulationWorker();
 *
 *   const [results, setResults] = useState<SimulationState | null>(null);
 *
 *   useEffect(() => {
 *     const unsubscribe = onStateUpdate((state) => {
 *       setResults(state);
 *     });
 *     return unsubscribe;
 *   }, [onStateUpdate]);
 *
 *   const handleStart = async () => {
 *     await initialize(config);
 *     await run(365); // Run for one year
 *   };
 *
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       <button onClick={handleStart} disabled={!isReady}>
 *         Run Simulation
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSimulationWorker(
  workerUrl = '/workers/simulation-worker.js'
): UseSimulationWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<WorkerStatus>('idle');
  const [error, setError] = useState<WorkerError | null>(null);

  // Callbacks for state updates
  const stateUpdateCallbacksRef = useRef<Set<(state: SimulationState) => void>>(new Set());
  const progressCallbacksRef = useRef<Set<(progress: number) => void>>(new Set());

  // Pending promises for command responses
  const pendingCommandsRef = useRef<
    Map<string, { resolve: (value: SimulationState | null) => void; reject: (error: Error) => void }>
  >(new Map());

  // Store config for recovery
  const lastConfigRef = useRef<SimulationConfig | null>(null);

  /**
   * Create the worker instance
   */
  const createWorker = useCallback(() => {
    if (typeof window === 'undefined') {
      // SSR guard
      return null;
    }

    try {
      const worker = new Worker(workerUrl, { type: 'module' });

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload, commandId } = event.data;

        switch (type) {
          case 'initialized':
            setStatus('ready');
            if (commandId && pendingCommandsRef.current.has(commandId)) {
              pendingCommandsRef.current.get(commandId)?.resolve(null);
              pendingCommandsRef.current.delete(commandId);
            }
            break;

          case 'stateUpdate':
            if (payload.state) {
              stateUpdateCallbacksRef.current.forEach((cb) => cb(payload.state!));
            }
            break;

          case 'stepComplete':
          case 'runComplete':
            setStatus('ready');
            if (commandId && pendingCommandsRef.current.has(commandId)) {
              pendingCommandsRef.current.get(commandId)?.resolve(payload.state ?? null);
              pendingCommandsRef.current.delete(commandId);
            }
            if (payload.state) {
              stateUpdateCallbacksRef.current.forEach((cb) => cb(payload.state!));
            }
            break;

          case 'progress':
            if (payload.progress !== undefined) {
              progressCallbacksRef.current.forEach((cb) => cb(payload.progress!));
            }
            break;

          case 'error':
            const workerError: WorkerError = {
              message: payload.error ?? 'Unknown worker error',
              code: payload.errorCode,
              timestamp: new Date(),
              recoverable: payload.errorCode !== 'FATAL',
            };
            setError(workerError);
            setStatus('error');

            // Reject all pending commands
            pendingCommandsRef.current.forEach(({ reject }) => {
              reject(new Error(workerError.message));
            });
            pendingCommandsRef.current.clear();
            break;
        }
      };

      worker.onerror = (event) => {
        const workerError: WorkerError = {
          message: event.message || 'Worker error occurred',
          timestamp: new Date(),
          recoverable: true,
        };
        setError(workerError);
        setStatus('error');

        // Reject all pending commands
        pendingCommandsRef.current.forEach(({ reject }) => {
          reject(new Error(workerError.message));
        });
        pendingCommandsRef.current.clear();
      };

      return worker;
    } catch (err) {
      const workerError: WorkerError = {
        message: err instanceof Error ? err.message : 'Failed to create worker',
        timestamp: new Date(),
        recoverable: false,
      };
      setError(workerError);
      setStatus('error');
      return null;
    }
  }, [workerUrl]);

  /**
   * Send a command to the worker
   */
  const sendCommand = useCallback(
    (command: Omit<WorkerCommand, 'id'>): string => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const id = generateCommandId();
      const fullCommand: WorkerCommand = { ...command, id };
      workerRef.current.postMessage(fullCommand);
      return id;
    },
    []
  );

  /**
   * Initialize the worker with configuration
   */
  const initialize = useCallback(
    async (config: SimulationConfig): Promise<void> => {
      // Create worker if needed
      if (!workerRef.current) {
        workerRef.current = createWorker();
        if (!workerRef.current) {
          throw new Error('Failed to create worker');
        }
      }

      setStatus('initializing');
      setError(null);
      lastConfigRef.current = config;

      return new Promise((resolve, reject) => {
        const commandId = sendCommand({
          type: 'initialize',
          payload: { config },
        });

        pendingCommandsRef.current.set(commandId, {
          resolve: () => resolve(),
          reject,
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (pendingCommandsRef.current.has(commandId)) {
            pendingCommandsRef.current.delete(commandId);
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000);
      });
    },
    [createWorker, sendCommand]
  );

  /**
   * Start the simulation
   */
  const start = useCallback(() => {
    if (status !== 'ready') {
      console.warn('Worker not ready to start');
      return;
    }
    setStatus('running');
    sendCommand({ type: 'start' });
  }, [status, sendCommand]);

  /**
   * Pause the simulation
   */
  const pause = useCallback(() => {
    if (status !== 'running') {
      return;
    }
    sendCommand({ type: 'pause' });
    setStatus('ready');
  }, [status, sendCommand]);

  /**
   * Resume the simulation
   */
  const resume = useCallback(() => {
    if (status !== 'ready') {
      return;
    }
    setStatus('running');
    sendCommand({ type: 'resume' });
  }, [status, sendCommand]);

  /**
   * Run a specific number of steps
   */
  const run = useCallback(
    async (steps: number): Promise<SimulationState | null> => {
      if (status !== 'ready') {
        throw new Error('Worker not ready');
      }

      setStatus('running');

      return new Promise((resolve, reject) => {
        const commandId = sendCommand({
          type: 'run',
          payload: { steps },
        });

        pendingCommandsRef.current.set(commandId, { resolve, reject });

        // Timeout based on steps (1 second per 100 steps, minimum 30 seconds)
        const timeout = Math.max(30000, steps * 10);
        setTimeout(() => {
          if (pendingCommandsRef.current.has(commandId)) {
            pendingCommandsRef.current.delete(commandId);
            setStatus('ready');
            reject(new Error('Run command timeout'));
          }
        }, timeout);
      });
    },
    [status, sendCommand]
  );

  /**
   * Run a single step
   */
  const step = useCallback(async (): Promise<SimulationState | null> => {
    if (status !== 'ready') {
      throw new Error('Worker not ready');
    }

    return new Promise((resolve, reject) => {
      const commandId = sendCommand({ type: 'step' });

      pendingCommandsRef.current.set(commandId, { resolve, reject });

      setTimeout(() => {
        if (pendingCommandsRef.current.has(commandId)) {
          pendingCommandsRef.current.delete(commandId);
          reject(new Error('Step command timeout'));
        }
      }, 5000);
    });
  }, [status, sendCommand]);

  /**
   * Reset the simulation
   */
  const reset = useCallback(() => {
    if (!workerRef.current) {
      return;
    }
    sendCommand({ type: 'reset' });
    setStatus('ready');
  }, [sendCommand]);

  /**
   * Update simulation configuration
   */
  const updateConfig = useCallback(
    (config: Partial<SimulationConfig>) => {
      if (!workerRef.current) {
        return;
      }

      // Update stored config
      if (lastConfigRef.current) {
        lastConfigRef.current = { ...lastConfigRef.current, ...config };
      }

      sendCommand({
        type: 'updateConfig',
        payload: { partialConfig: config },
      });
    },
    [sendCommand]
  );

  /**
   * Terminate the worker
   */
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Clear all pending commands
    pendingCommandsRef.current.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    pendingCommandsRef.current.clear();

    setStatus('terminated');
  }, []);

  /**
   * Attempt to recover from an error
   */
  const recover = useCallback(async (): Promise<boolean> => {
    if (status !== 'error' || !error?.recoverable) {
      return false;
    }

    // Terminate existing worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Create new worker
    workerRef.current = createWorker();
    if (!workerRef.current) {
      return false;
    }

    setError(null);
    setStatus('idle');

    // Re-initialize with last config if available
    if (lastConfigRef.current) {
      try {
        await initialize(lastConfigRef.current);
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }, [status, error, createWorker, initialize]);

  /**
   * Subscribe to state updates
   */
  const onStateUpdate = useCallback(
    (callback: (state: SimulationState) => void): (() => void) => {
      stateUpdateCallbacksRef.current.add(callback);
      return () => {
        stateUpdateCallbacksRef.current.delete(callback);
      };
    },
    []
  );

  /**
   * Subscribe to progress updates
   */
  const onProgress = useCallback(
    (callback: (progress: number) => void): (() => void) => {
      progressCallbacksRef.current.add(callback);
      return () => {
        progressCallbacksRef.current.delete(callback);
      };
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    // Capture current ref values for cleanup
    const worker = workerRef.current;
    const pendingCommands = pendingCommandsRef.current;
    const stateCallbacks = stateUpdateCallbacksRef.current;
    const progressCbs = progressCallbacksRef.current;

    return () => {
      if (worker) {
        worker.terminate();
      }
      workerRef.current = null;
      pendingCommands.clear();
      stateCallbacks.clear();
      progressCbs.clear();
    };
  }, []);

  return {
    status,
    isReady: status === 'ready',
    isProcessing: status === 'running' || status === 'initializing',
    error,
    initialize,
    start,
    pause,
    resume,
    run,
    step,
    reset,
    updateConfig,
    terminate,
    recover,
    onStateUpdate,
    onProgress,
  };
}

export default useSimulationWorker;
