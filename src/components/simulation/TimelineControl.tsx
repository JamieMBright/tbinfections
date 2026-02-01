'use client';

/**
 * TimelineControl Component
 *
 * Playback controls for the simulation including:
 * - Play/Pause button
 * - Reset button
 * - Speed selector (1x, 2x, 5x, 10x)
 * - Timeline slider showing current day
 * - Day/date display
 * - Total duration indicator
 *
 * @module components/simulation/TimelineControl
 */

import React, { memo, useCallback, useMemo } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatDate, formatNumber } from '@/lib/utils';

/**
 * Available playback speeds
 */
const SPEED_OPTIONS = [
  { value: '0.5', label: '0.5x' },
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '5', label: '5x' },
  { value: '10', label: '10x' },
] as const;

/**
 * Props for TimelineControl component
 */
interface TimelineControlProps {
  /** CSS class name for the container */
  className?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Play icon component
 */
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-5 h-5', className)}
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Pause icon component
 */
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-5 h-5', className)}
    >
      <path
        fillRule="evenodd"
        d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Reset icon component
 */
function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-5 h-5', className)}
    >
      <path
        fillRule="evenodd"
        d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Step forward icon component
 */
function StepForwardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-5 h-5', className)}
    >
      <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
    </svg>
  );
}

/**
 * TimelineControl Component
 *
 * Provides playback controls for the simulation with a timeline slider,
 * play/pause button, speed selector, and reset functionality.
 *
 * @example
 * ```tsx
 * <TimelineControl className="mt-4" />
 * ```
 *
 * @example
 * ```tsx
 * // Compact mode for smaller displays
 * <TimelineControl compact />
 * ```
 */
export const TimelineControl = memo(function TimelineControl({
  className,
  compact = false,
}: TimelineControlProps) {
  // Store subscriptions
  const currentDay = useSimulationStore((state) => state.state.currentDay);
  const currentTime = useSimulationStore((state) => state.state.currentTime);
  const status = useSimulationStore((state) => state.state.status);
  const speed = useSimulationStore((state) => state.state.speed);
  const duration = useSimulationStore((state) => state.config.duration);

  // Store actions
  const start = useSimulationStore((state) => state.start);
  const pause = useSimulationStore((state) => state.pause);
  const resume = useSimulationStore((state) => state.resume);
  const reset = useSimulationStore((state) => state.reset);
  const step = useSimulationStore((state) => state.step);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const updateState = useSimulationStore((state) => state.updateState);

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isIdle = status === 'idle';

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    return duration > 0 ? (currentDay / duration) * 100 : 0;
  }, [currentDay, duration]);

  // Format duration in years and days
  const durationFormatted = useMemo(() => {
    const years = Math.floor(duration / 365);
    const days = duration % 365;
    if (years === 0) return `${days} days`;
    if (days === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${days}d`;
  }, [duration]);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    } else if (isIdle || isCompleted) {
      start();
    }
  }, [isRunning, isPaused, isIdle, isCompleted, pause, resume, start]);

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Handle step forward
  const handleStep = useCallback(() => {
    if (!isRunning) {
      step();
    }
  }, [isRunning, step]);

  // Handle speed change
  const handleSpeedChange = useCallback(
    (value: string) => {
      setSpeed(parseFloat(value));
    },
    [setSpeed]
  );

  // Handle timeline slider change
  const handleSliderChange = useCallback(
    (values: number[]) => {
      const newDay = values[0];
      if (newDay !== undefined) {
        // Calculate new date based on day change
        const startDate = new Date();
        const newDate = new Date(
          startDate.getTime() + newDay * 24 * 60 * 60 * 1000
        );

        updateState({
          currentDay: newDay,
          currentTime: newDate,
        });
      }
    },
    [updateState]
  );

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-2',
          className
        )}
      >
        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
          aria-label={isRunning ? 'Pause' : 'Play'}
        >
          {isRunning ? <PauseIcon /> : <PlayIcon />}
        </Button>

        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          aria-label="Reset"
        >
          <ResetIcon />
        </Button>

        {/* Day display */}
        <span className="text-sm font-medium min-w-[60px] text-center">
          Day {currentDay}
        </span>

        {/* Timeline slider */}
        <Slider
          value={[currentDay]}
          min={0}
          max={duration}
          step={1}
          onValueChange={handleSliderChange}
          className="flex-1 min-w-[100px]"
          disabled={isRunning}
        />

        {/* Speed selector */}
        <Select value={speed.toString()} onValueChange={handleSpeedChange}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEED_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-4 space-y-4',
        className
      )}
    >
      {/* Progress bar */}
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Timeline slider */}
      <div className="space-y-2">
        <Slider
          value={[currentDay]}
          min={0}
          max={duration}
          step={1}
          onValueChange={handleSliderChange}
          disabled={isRunning}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Day 0</span>
          <span>{durationFormatted}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <Button
            variant={isRunning ? 'secondary' : 'default'}
            size="sm"
            onClick={handlePlayPause}
            className="min-w-[100px]"
          >
            {isRunning ? (
              <>
                <PauseIcon className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-1" />
                {isPaused ? 'Resume' : 'Play'}
              </>
            )}
          </Button>

          {/* Step forward button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleStep}
            disabled={isRunning}
            aria-label="Step forward one day"
          >
            <StepForwardIcon className="w-4 h-4" />
          </Button>

          {/* Reset button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            aria-label="Reset simulation"
          >
            <ResetIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Center: Day/Date display */}
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">
            Day {formatNumber(currentDay)}
          </div>
          <div className="text-sm text-slate-500">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Right: Speed selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Speed:</span>
          <Select value={speed.toString()} onValueChange={handleSpeedChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
            {
              'bg-slate-100 text-slate-600': isIdle,
              'bg-green-100 text-green-700': isRunning,
              'bg-yellow-100 text-yellow-700': isPaused,
              'bg-blue-100 text-blue-700': isCompleted,
            }
          )}
        >
          <span
            className={cn('w-2 h-2 rounded-full', {
              'bg-slate-400': isIdle,
              'bg-green-500 animate-pulse': isRunning,
              'bg-yellow-500': isPaused,
              'bg-blue-500': isCompleted,
            })}
          />
          {isIdle && 'Ready'}
          {isRunning && 'Running'}
          {isPaused && 'Paused'}
          {isCompleted && 'Completed'}
        </div>
      </div>
    </div>
  );
});

/**
 * Mini timeline display for headers or compact areas
 */
export const TimelineMini = memo(function TimelineMini({
  className,
}: {
  className?: string;
}) {
  const currentDay = useSimulationStore((state) => state.state.currentDay);
  const duration = useSimulationStore((state) => state.config.duration);
  const status = useSimulationStore((state) => state.state.status);

  const progressPercent = duration > 0 ? (currentDay / duration) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums">
        Day {currentDay}/{duration}
      </span>
      <span
        className={cn('w-2 h-2 rounded-full', {
          'bg-slate-400': status === 'idle',
          'bg-green-500 animate-pulse': status === 'running',
          'bg-yellow-500': status === 'paused',
          'bg-blue-500': status === 'completed',
        })}
      />
    </div>
  );
});

export default TimelineControl;
