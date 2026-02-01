/**
 * useAnimationFrame Hook - RequestAnimationFrame Loop Manager
 *
 * Provides a smooth animation loop using requestAnimationFrame for
 * rendering simulation visualizations. Handles pause/resume, provides
 * delta time for frame-independent animations, and properly cleans up.
 *
 * @module hooks/useAnimationFrame
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Animation frame callback function signature
 * @param deltaTime - Time elapsed since last frame in milliseconds
 * @param totalTime - Total time elapsed since animation started in milliseconds
 * @param frameCount - Number of frames rendered since start
 */
export type AnimationFrameCallback = (
  deltaTime: number,
  totalTime: number,
  frameCount: number
) => void;

/**
 * Animation frame options
 */
export interface UseAnimationFrameOptions {
  /** Whether to start the animation automatically (default: false) */
  autoStart?: boolean;

  /** Target frames per second (default: 60) */
  targetFps?: number;

  /** Maximum delta time to prevent large jumps (default: 100ms) */
  maxDeltaTime?: number;

  /** Callback when animation is paused */
  onPause?: () => void;

  /** Callback when animation is resumed */
  onResume?: () => void;
}

/**
 * Animation frame state information
 */
export interface AnimationFrameState {
  /** Whether animation is currently running */
  isRunning: boolean;

  /** Whether animation is paused */
  isPaused: boolean;

  /** Current frames per second */
  fps: number;

  /** Total frames rendered */
  frameCount: number;

  /** Total elapsed time in milliseconds */
  elapsedTime: number;
}

/**
 * Hook return type
 */
export interface UseAnimationFrameReturn extends AnimationFrameState {
  /** Start the animation loop */
  start: () => void;

  /** Stop the animation loop completely */
  stop: () => void;

  /** Pause the animation (can be resumed) */
  pause: () => void;

  /** Resume a paused animation */
  resume: () => void;

  /** Toggle between pause and resume */
  toggle: () => void;

  /** Reset all counters and state */
  reset: () => void;
}

/**
 * Hook for managing a requestAnimationFrame animation loop.
 *
 * Provides smooth 60fps (or target fps) rendering with delta time
 * for frame-independent animations, pause/resume functionality,
 * and automatic cleanup on unmount.
 *
 * @param callback - Function called on each animation frame
 * @param options - Animation configuration options
 * @returns Animation control interface and state
 *
 * @example
 * ```tsx
 * function SimulationCanvas() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *
 *   const { start, stop, isRunning, fps } = useAnimationFrame(
 *     (deltaTime, totalTime) => {
 *       const ctx = canvasRef.current?.getContext('2d');
 *       if (!ctx) return;
 *
 *       // Clear canvas
 *       ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
 *
 *       // Animate based on deltaTime for smooth motion
 *       const speed = 0.1; // pixels per ms
 *       const x = (totalTime * speed) % ctx.canvas.width;
 *
 *       ctx.fillStyle = 'blue';
 *       ctx.beginPath();
 *       ctx.arc(x, 100, 20, 0, Math.PI * 2);
 *       ctx.fill();
 *     },
 *     { autoStart: true }
 *   );
 *
 *   return (
 *     <div>
 *       <canvas ref={canvasRef} width={800} height={600} />
 *       <p>FPS: {fps.toFixed(1)}</p>
 *       <button onClick={() => isRunning ? stop() : start()}>
 *         {isRunning ? 'Stop' : 'Start'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with simulation updates
 * function SimulationRenderer({ simulationStep }: { simulationStep: () => void }) {
 *   const { isRunning, toggle, fps, elapsedTime } = useAnimationFrame(
 *     (deltaTime) => {
 *       // Step simulation based on elapsed time
 *       // deltaTime ensures consistent speed regardless of frame rate
 *       simulationStep();
 *     },
 *     { targetFps: 30 } // Lower FPS for less frequent updates
 *   );
 *
 *   return (
 *     <div>
 *       <p>Running: {isRunning ? 'Yes' : 'No'}</p>
 *       <p>FPS: {fps.toFixed(0)}</p>
 *       <p>Time: {(elapsedTime / 1000).toFixed(1)}s</p>
 *       <button onClick={toggle}>
 *         {isRunning ? 'Pause' : 'Resume'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAnimationFrame(
  callback: AnimationFrameCallback,
  options: UseAnimationFrameOptions = {}
): UseAnimationFrameReturn {
  const {
    autoStart = false,
    targetFps = 60,
    maxDeltaTime = 100,
    onPause,
    onResume,
  } = options;

  // Refs for animation loop
  const requestIdRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsFramesRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Store callback in ref to avoid recreating animation loop
  const callbackRef = useRef<AnimationFrameCallback>(callback);

  // Update callback ref in an effect to avoid render-phase mutation
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Target frame duration
  const frameDuration = 1000 / targetFps;

  // Store animation loop in ref to allow self-reference
  const animateRef = useRef<((currentTime: number) => void) | undefined>(undefined);

  // Update the animation loop function when dependencies change
  useEffect(() => {
    animateRef.current = (currentTime: number) => {
      // Initialize on first frame
      if (previousTimeRef.current === 0) {
        previousTimeRef.current = currentTime;
        startTimeRef.current = currentTime;
        fpsLastTimeRef.current = currentTime;
      }

      // Calculate delta time
      let deltaTime = currentTime - previousTimeRef.current;

      // Frame rate limiting
      if (deltaTime < frameDuration) {
        requestIdRef.current = requestAnimationFrame((t) => animateRef.current?.(t));
        return;
      }

      // Cap delta time to prevent large jumps (e.g., after tab switch)
      if (deltaTime > maxDeltaTime) {
        deltaTime = maxDeltaTime;
      }

      previousTimeRef.current = currentTime;
      frameCountRef.current += 1;
      fpsFramesRef.current += 1;

      // Calculate total elapsed time (excluding paused time)
      const totalTime = currentTime - startTimeRef.current - pausedTimeRef.current;

      // Update FPS every second
      const fpsElapsed = currentTime - fpsLastTimeRef.current;
      if (fpsElapsed >= 1000) {
        const currentFps = (fpsFramesRef.current / fpsElapsed) * 1000;
        setFps(currentFps);
        fpsFramesRef.current = 0;
        fpsLastTimeRef.current = currentTime;
      }

      // Call the animation callback
      callbackRef.current(deltaTime, totalTime, frameCountRef.current);

      // Update state (throttled to reduce re-renders)
      if (frameCountRef.current % 10 === 0) {
        setFrameCount(frameCountRef.current);
        setElapsedTime(totalTime);
      }

      // Continue loop
      requestIdRef.current = requestAnimationFrame((t) => animateRef.current?.(t));
    };
  }, [frameDuration, maxDeltaTime]);

  /**
   * Start the animation loop
   */
  const start = useCallback(() => {
    if (requestIdRef.current !== null) {
      return; // Already running
    }

    // Reset timing if starting fresh
    if (!isPaused) {
      previousTimeRef.current = 0;
      startTimeRef.current = 0;
      frameCountRef.current = 0;
      fpsFramesRef.current = 0;
      fpsLastTimeRef.current = 0;
      pausedTimeRef.current = 0;
    }

    setIsRunning(true);
    setIsPaused(false);
    requestIdRef.current = requestAnimationFrame((t) => animateRef.current?.(t));
  }, [isPaused]);

  /**
   * Stop the animation loop completely
   */
  const stop = useCallback(() => {
    if (requestIdRef.current !== null) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }

    setIsRunning(false);
    setIsPaused(false);
  }, []);

  /**
   * Pause the animation (can be resumed)
   */
  const pause = useCallback(() => {
    if (requestIdRef.current !== null) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }

    setIsRunning(false);
    setIsPaused(true);

    // Track when pause started
    pausedTimeRef.current = performance.now();

    onPause?.();
  }, [onPause]);

  /**
   * Resume a paused animation
   */
  const resume = useCallback(() => {
    if (!isPaused) {
      return;
    }

    // Calculate time spent paused and add to total paused time
    const pausedDuration = performance.now() - pausedTimeRef.current;
    pausedTimeRef.current = pausedDuration;

    setIsRunning(true);
    setIsPaused(false);
    requestIdRef.current = requestAnimationFrame((t) => animateRef.current?.(t));

    onResume?.();
  }, [isPaused, onResume]);

  /**
   * Toggle between pause and resume
   */
  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      start();
    }
  }, [isRunning, isPaused, pause, resume, start]);

  /**
   * Reset all counters and state
   */
  const reset = useCallback(() => {
    stop();

    previousTimeRef.current = 0;
    startTimeRef.current = 0;
    frameCountRef.current = 0;
    fpsFramesRef.current = 0;
    fpsLastTimeRef.current = 0;
    pausedTimeRef.current = 0;

    setFps(0);
    setFrameCount(0);
    setElapsedTime(0);
  }, [stop]);

  // Auto-start if enabled (scheduled as microtask to avoid sync setState in effect)
  useEffect(() => {
    if (autoStart) {
      // Schedule start as microtask to avoid synchronous setState in effect body
      queueMicrotask(() => {
        start();
      });
    }

    // Cleanup on unmount
    return () => {
      if (requestIdRef.current !== null) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
  }, [autoStart, start]);

  return {
    isRunning,
    isPaused,
    fps,
    frameCount,
    elapsedTime,
    start,
    stop,
    pause,
    resume,
    toggle,
    reset,
  };
}

/**
 * Simplified hook for running a callback at a target frame rate.
 *
 * This is a simpler version of useAnimationFrame for cases where
 * you just need to run something at a specific interval.
 *
 * @param callback - Function to call on each frame
 * @param fps - Target frames per second (default: 60)
 * @param enabled - Whether the loop is enabled (default: true)
 *
 * @example
 * ```tsx
 * function Ticker({ onTick }: { onTick: () => void }) {
 *   const [enabled, setEnabled] = useState(true);
 *
 *   useFrameCallback(
 *     () => {
 *       onTick();
 *     },
 *     30, // 30 FPS
 *     enabled
 *   );
 *
 *   return (
 *     <button onClick={() => setEnabled(!enabled)}>
 *       {enabled ? 'Stop' : 'Start'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useFrameCallback(
  callback: () => void,
  fps = 60,
  enabled = true
): void {
  const callbackRef = useRef(callback);

  // Update callback ref in an effect to avoid render-phase mutation
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = 1000 / fps;
    let lastTime = 0;
    let rafId: number;

    const loop = (currentTime: number) => {
      rafId = requestAnimationFrame(loop);

      const delta = currentTime - lastTime;
      if (delta >= interval) {
        lastTime = currentTime - (delta % interval);
        callbackRef.current();
      }
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [fps, enabled]);
}

export default useAnimationFrame;
