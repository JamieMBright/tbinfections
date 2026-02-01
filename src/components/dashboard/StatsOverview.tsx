'use client';

import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  Heart,
  Shield,
  Skull,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatNumber, formatPercent, formatRate } from '@/lib/utils';
import type { SimulationMetrics, CompartmentState } from '@/types/simulation';

/**
 * Threshold configuration for color coding metrics
 */
interface ThresholdConfig {
  good: number;
  warning: number;
}

/**
 * Configuration for a single metric card
 */
interface MetricConfig {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  getValue: (
    metrics: SimulationMetrics,
    compartments: CompartmentState,
    population: number
  ) => number;
  format: (value: number) => string;
  thresholds: ThresholdConfig;
  /** Whether lower values are better */
  lowerIsBetter: boolean;
  /** Previous value for trend calculation (optional) */
  getPreviousValue?: (
    metrics: SimulationMetrics,
    compartments: CompartmentState,
    population: number
  ) => number | undefined;
}

/**
 * Props for the StatsOverview component
 */
export interface StatsOverviewProps {
  /** Current simulation metrics */
  metrics: SimulationMetrics;
  /** Current compartment state */
  compartments: CompartmentState;
  /** Total population */
  population: number;
  /** Previous metrics for trend calculation (optional) */
  previousMetrics?: SimulationMetrics;
  /** Previous compartment state for trend calculation (optional) */
  previousCompartments?: CompartmentState;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Metric card configurations
 */
const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: 'totalInfections',
    label: 'Total Infections',
    description: 'Cumulative number of TB infections since simulation start',
    icon: Activity,
    getValue: (metrics) => metrics.totalInfections,
    format: formatNumber,
    thresholds: { good: 1000, warning: 5000 },
    lowerIsBetter: true,
  },
  {
    id: 'activeCases',
    label: 'Active Cases',
    description: 'Current number of infectious TB cases',
    icon: AlertTriangle,
    getValue: (_, compartments) => compartments.I,
    format: formatNumber,
    thresholds: { good: 100, warning: 500 },
    lowerIsBetter: true,
  },
  {
    id: 'totalDeaths',
    label: 'Total Deaths',
    description: 'Cumulative TB-related deaths',
    icon: Skull,
    getValue: (metrics) => metrics.totalDeaths,
    format: formatNumber,
    thresholds: { good: 50, warning: 200 },
    lowerIsBetter: true,
  },
  {
    id: 'effectiveR',
    label: 'Effective R',
    description:
      'Reproduction number - average secondary infections per case. Below 1.0 indicates declining epidemic.',
    icon: Users,
    getValue: (metrics) => metrics.effectiveR,
    format: (v) => v.toFixed(2),
    thresholds: { good: 1.0, warning: 1.5 },
    lowerIsBetter: true,
  },
  {
    id: 'incidenceRate',
    label: 'Incidence Rate',
    description:
      'New cases per 100,000 population. WHO low-incidence target is below 10.',
    icon: Heart,
    getValue: (metrics) => metrics.currentIncidenceRate,
    format: (v) => formatRate(v),
    thresholds: { good: 10, warning: 20 },
    lowerIsBetter: true,
  },
  {
    id: 'vaccinationCoverage',
    label: 'Vaccination Coverage',
    description: 'Percentage of population vaccinated with BCG',
    icon: Shield,
    getValue: (_, compartments, population) =>
      population > 0 ? compartments.V / population : 0,
    format: (v) => formatPercent(v),
    thresholds: { good: 0.8, warning: 0.5 },
    lowerIsBetter: false,
  },
];

/**
 * Determines the status color based on value and thresholds
 */
function getStatusColor(
  value: number,
  thresholds: ThresholdConfig,
  lowerIsBetter: boolean
): 'green' | 'yellow' | 'red' {
  if (lowerIsBetter) {
    if (value <= thresholds.good) return 'green';
    if (value <= thresholds.warning) return 'yellow';
    return 'red';
  } else {
    if (value >= thresholds.good) return 'green';
    if (value >= thresholds.warning) return 'yellow';
    return 'red';
  }
}

/**
 * Returns the appropriate color classes for a status
 */
function getStatusClasses(status: 'green' | 'yellow' | 'red'): string {
  switch (status) {
    case 'green':
      return 'text-green-600 dark:text-green-400';
    case 'yellow':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'red':
      return 'text-red-600 dark:text-red-400';
  }
}

/**
 * Returns the appropriate background classes for a status
 */
function getStatusBgClasses(status: 'green' | 'yellow' | 'red'): string {
  switch (status) {
    case 'green':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'yellow':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'red':
      return 'bg-red-100 dark:bg-red-900/30';
  }
}

/**
 * Trend indicator component
 */
interface TrendIndicatorProps {
  current: number;
  previous: number | undefined;
  lowerIsBetter: boolean;
}

function TrendIndicator({
  current,
  previous,
  lowerIsBetter,
}: TrendIndicatorProps) {
  if (previous === undefined || previous === 0) return null;

  const percentChange = ((current - previous) / previous) * 100;
  const isIncreasing = percentChange > 0;
  const isImproving = lowerIsBetter ? !isIncreasing : isIncreasing;

  if (Math.abs(percentChange) < 0.1) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs',
        isImproving
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      )}
      aria-label={`${isIncreasing ? 'Increased' : 'Decreased'} by ${Math.abs(percentChange).toFixed(1)}%`}
    >
      {isIncreasing ? (
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
      )}
      <span>{Math.abs(percentChange).toFixed(1)}%</span>
    </div>
  );
}

/**
 * Individual metric card component
 */
interface MetricCardProps {
  config: MetricConfig;
  value: number;
  previousValue?: number;
}

function MetricCard({ config, value, previousValue }: MetricCardProps) {
  const status = getStatusColor(value, config.thresholds, config.lowerIsBetter);
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className={cn(
            'transition-colors hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-default',
            getStatusBgClasses(status)
          )}
          tabIndex={0}
          role="article"
          aria-label={`${config.label}: ${config.format(value)}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {config.label}
            </CardTitle>
            <div
              className={cn(
                'rounded-full p-2',
                getStatusBgClasses(status),
                getStatusClasses(status)
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div
                className={cn('text-2xl font-bold', getStatusClasses(status))}
              >
                {config.format(value)}
              </div>
              <TrendIndicator
                current={value}
                previous={previousValue}
                lowerIsBetter={config.lowerIsBetter}
              />
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p>{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * StatsOverview displays a grid of metric cards showing key simulation statistics.
 * Each card includes an icon, current value, trend indicator, and color coding
 * based on configurable thresholds.
 *
 * @example
 * ```tsx
 * <StatsOverview
 *   metrics={simulationMetrics}
 *   compartments={compartmentState}
 *   population={67000000}
 * />
 * ```
 */
export function StatsOverview({
  metrics,
  compartments,
  population,
  previousMetrics,
  previousCompartments,
  className,
}: StatsOverviewProps) {
  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
        className
      )}
      role="region"
      aria-label="Simulation Statistics Overview"
    >
      {METRIC_CONFIGS.map((config) => {
        const value = config.getValue(metrics, compartments, population);
        const previousValue =
          previousMetrics && previousCompartments
            ? config.getValue(previousMetrics, previousCompartments, population)
            : undefined;

        return (
          <MetricCard
            key={config.id}
            config={config}
            value={value}
            previousValue={previousValue}
          />
        );
      })}
    </div>
  );
}

export default StatsOverview;
