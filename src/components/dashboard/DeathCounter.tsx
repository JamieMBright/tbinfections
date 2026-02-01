'use client';

import * as React from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { Skull } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatNumber } from '@/lib/utils';

/**
 * Props for the DeathCounter component
 */
export interface DeathCounterProps {
  /** Total number of deaths */
  deaths: number;
  /** Deaths that would have occurred without intervention (counterfactual) */
  counterfactualDeaths?: number;
  /** Whether counterfactual comparison is enabled */
  showComparison?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for individual animated digit
 */
interface AnimatedDigitProps {
  value: MotionValue<string>;
}

/**
 * Single animated digit component
 */
function AnimatedDigit({ value }: AnimatedDigitProps) {
  return (
    <motion.span
      className="tabular-nums"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {value}
    </motion.span>
  );
}

/**
 * Animated number display with smooth transitions
 */
interface AnimatedNumberProps {
  value: number;
  className?: string;
}

function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const displayValue = useTransform(springValue, (latest) =>
    formatNumber(Math.round(latest))
  );

  React.useEffect(() => {
    springValue.set(value);
  }, [springValue, value]);

  return (
    <motion.span className={cn('tabular-nums', className)}>
      <AnimatedDigit value={displayValue} />
    </motion.span>
  );
}

/**
 * Comparison bar showing deaths prevented
 */
interface ComparisonBarProps {
  actual: number;
  counterfactual: number;
}

function ComparisonBar({ actual, counterfactual }: ComparisonBarProps) {
  const prevented = counterfactual - actual;
  const preventedPercent =
    counterfactual > 0 ? (prevented / counterfactual) * 100 : 0;
  const actualPercent = counterfactual > 0 ? (actual / counterfactual) * 100 : 0;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>With vaccination</span>
        <span>Without vaccination</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${formatNumber(actual)} deaths with vaccination vs ${formatNumber(counterfactual)} without`}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-slate-600 to-slate-500 dark:from-slate-400 dark:to-slate-500"
          initial={{ width: 0 }}
          animate={{ width: `${actualPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {formatNumber(actual)} deaths
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-green-600 dark:text-green-400 cursor-help">
              {formatNumber(prevented)} prevented ({preventedPercent.toFixed(1)}%)
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deaths prevented by vaccination program</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/**
 * DeathCounter displays an animated counter for total TB-related deaths.
 * Uses framer-motion for smooth number transitions and provides an optional
 * comparison with counterfactual scenario (without vaccination).
 *
 * The design is sobering but not sensational, using muted colors and
 * professional typography.
 *
 * @example
 * ```tsx
 * <DeathCounter
 *   deaths={340}
 *   counterfactualDeaths={520}
 *   showComparison
 * />
 * ```
 */
export function DeathCounter({
  deaths,
  counterfactualDeaths,
  showComparison = false,
  className,
}: DeathCounterProps) {
  const hasComparison = showComparison && counterfactualDeaths !== undefined;
  const prevented = hasComparison ? counterfactualDeaths - deaths : 0;

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="region"
      aria-label="Death Counter"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Deaths
        </CardTitle>
        <div className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Skull className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <motion.div
            className="text-4xl font-bold tracking-tight text-slate-700 dark:text-slate-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatedNumber value={deaths} />
          </motion.div>
          <p className="text-xs text-muted-foreground">
            Cumulative TB-related fatalities
          </p>
        </div>

        {hasComparison && (
          <>
            <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Deaths prevented:
                </span>
                <motion.span
                  className="text-lg font-semibold text-green-600 dark:text-green-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <AnimatedNumber value={prevented} />
                </motion.span>
              </div>
            </div>
            <ComparisonBar actual={deaths} counterfactual={counterfactualDeaths} />
          </>
        )}

        {!hasComparison && (
          <p className="mt-4 text-xs text-muted-foreground italic">
            Enable counterfactual comparison to see deaths prevented by
            vaccination.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default DeathCounter;
