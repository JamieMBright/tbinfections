'use client';

import * as React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Activity, HeartPulse, Info, Shield, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatNumber, formatPercent } from '@/lib/utils';

/**
 * Props for the PreventedCounter component
 */
export interface PreventedCounterProps {
  /** Infections prevented by vaccination */
  infectionsPrevented: number;
  /** Deaths prevented by vaccination */
  deathsPrevented: number;
  /** Total infections with vaccination */
  actualInfections: number;
  /** Total infections without vaccination (counterfactual) */
  counterfactualInfections: number;
  /** Total deaths with vaccination */
  actualDeaths: number;
  /** Total deaths without vaccination (counterfactual) */
  counterfactualDeaths: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated number display with smooth transitions
 */
interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

function AnimatedNumber({
  value,
  className,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const springValue = useSpring(value, {
    stiffness: 80,
    damping: 25,
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
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </motion.span>
  );
}

/**
 * Visual comparison bar component
 */
interface ComparisonVisualizationProps {
  label: string;
  actual: number;
  counterfactual: number;
  prevented: number;
  icon: LucideIcon;
  color: 'green' | 'blue';
}

function ComparisonVisualization({
  label,
  actual,
  counterfactual,
  prevented,
  icon: Icon,
  color,
}: ComparisonVisualizationProps) {
  const actualPercent = counterfactual > 0 ? (actual / counterfactual) * 100 : 0;
  const preventedPercent =
    counterfactual > 0 ? (prevented / counterfactual) * 100 : 0;

  const colorClasses = {
    green: {
      bg: 'bg-green-500 dark:bg-green-400',
      text: 'text-green-600 dark:text-green-400',
      lightBg: 'bg-green-100 dark:bg-green-900/30',
    },
    blue: {
      bg: 'bg-blue-500 dark:bg-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
      lightBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('rounded-full p-1.5', colors.lightBg)}>
          <Icon className={cn('h-4 w-4', colors.text)} aria-hidden="true" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>

      {/* Comparison bars */}
      <div className="space-y-2">
        {/* With vaccination */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>With vaccination</span>
            <span>{formatNumber(actual)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-slate-400 dark:bg-slate-500"
              initial={{ width: 0 }}
              animate={{ width: `${actualPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Without vaccination (counterfactual) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Without vaccination</span>
            <span>{formatNumber(counterfactual)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full"
              style={{
                background: `linear-gradient(to right, #94a3b8 ${actualPercent}%, ${color === 'green' ? '#22c55e' : '#3b82f6'} ${actualPercent}%)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      {/* Prevented highlight */}
      <motion.div
        className={cn('rounded-lg p-3', colors.lightBg)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn('h-4 w-4', colors.text)} aria-hidden="true" />
            <span className="text-sm font-medium">Prevented</span>
          </div>
          <div className="text-right">
            <motion.span className={cn('text-lg font-bold', colors.text)}>
              <AnimatedNumber value={prevented} />
            </motion.span>
            <span className="ml-1 text-xs text-muted-foreground">
              ({formatPercent(preventedPercent / 100)})
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * PreventedCounter displays counters for infections and deaths prevented by vaccination,
 * with visual comparisons between the actual scenario and a counterfactual scenario
 * without vaccination.
 *
 * The component includes:
 * - Animated counters for prevented infections and deaths
 * - Visual comparison bars showing with/without vaccination scenarios
 * - Tooltips explaining the counterfactual calculation methodology
 *
 * @example
 * ```tsx
 * <PreventedCounter
 *   infectionsPrevented={1500}
 *   deathsPrevented={180}
 *   actualInfections={3500}
 *   counterfactualInfections={5000}
 *   actualDeaths={340}
 *   counterfactualDeaths={520}
 * />
 * ```
 */
export function PreventedCounter({
  infectionsPrevented,
  deathsPrevented,
  actualInfections,
  counterfactualInfections,
  actualDeaths,
  counterfactualDeaths,
  className,
}: PreventedCounterProps) {
  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="region"
      aria-label="Vaccination Impact - Prevented Cases"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vaccination Impact
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Learn more about counterfactual calculation"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-sm">
              <div className="space-y-2">
                <p className="font-medium">How is this calculated?</p>
                <p className="text-xs">
                  The counterfactual scenario simulates disease spread with the
                  same parameters but without any vaccination. The difference
                  between the counterfactual and actual outcomes represents
                  cases and deaths prevented by the vaccination program.
                </p>
                <p className="text-xs text-muted-foreground">
                  This uses the same SEIR model with vaccine efficacy set to
                  zero.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <Shield className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary counters */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
              <Activity className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Infections
              </span>
            </div>
            <motion.div
              className="text-3xl font-bold text-green-600 dark:text-green-400"
              aria-live="polite"
            >
              <AnimatedNumber value={infectionsPrevented} />
            </motion.div>
            <span className="text-xs text-muted-foreground">prevented</span>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
              <HeartPulse className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Deaths
              </span>
            </div>
            <motion.div
              className="text-3xl font-bold text-blue-600 dark:text-blue-400"
              aria-live="polite"
            >
              <AnimatedNumber value={deathsPrevented} />
            </motion.div>
            <span className="text-xs text-muted-foreground">prevented</span>
          </motion.div>
        </div>

        {/* Detailed comparisons */}
        <div className="space-y-6 pt-2 border-t">
          <ComparisonVisualization
            label="Infections Comparison"
            actual={actualInfections}
            counterfactual={counterfactualInfections}
            prevented={infectionsPrevented}
            icon={Activity}
            color="green"
          />

          <ComparisonVisualization
            label="Deaths Comparison"
            actual={actualDeaths}
            counterfactual={counterfactualDeaths}
            prevented={deathsPrevented}
            icon={HeartPulse}
            color="blue"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default PreventedCounter;
