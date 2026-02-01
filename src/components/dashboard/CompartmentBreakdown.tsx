'use client';

import * as React from 'react';
import { ResponsiveBar, type BarDatum } from '@nivo/bar';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatNumber, formatPercent } from '@/lib/utils';
import type { CompartmentState } from '@/types/simulation';

/**
 * Compartment configuration for display
 */
interface CompartmentDisplayConfig {
  key: keyof CompartmentState;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}

/**
 * Compartment display configurations
 */
const COMPARTMENT_DISPLAY_CONFIGS: CompartmentDisplayConfig[] = [
  {
    key: 'S',
    label: 'Susceptible',
    shortLabel: 'S',
    color: '#3b82f6', // blue-500
    description: 'Never infected, unvaccinated',
  },
  {
    key: 'V',
    label: 'Vaccinated',
    shortLabel: 'V',
    color: '#22c55e', // green-500
    description: 'BCG vaccinated with partial protection',
  },
  {
    key: 'E_H',
    label: 'Exposed (High-risk)',
    shortLabel: 'EH',
    color: '#f59e0b', // amber-500
    description: 'Recently infected, higher progression risk',
  },
  {
    key: 'E_L',
    label: 'Exposed (Low-risk)',
    shortLabel: 'EL',
    color: '#eab308', // yellow-500
    description: 'Latent TB, stable state',
  },
  {
    key: 'I',
    label: 'Infectious',
    shortLabel: 'I',
    color: '#ef4444', // red-500
    description: 'Active TB disease, can transmit',
  },
  {
    key: 'R',
    label: 'Recovered',
    shortLabel: 'R',
    color: '#8b5cf6', // violet-500
    description: 'Treated or self-cured',
  },
  {
    key: 'D',
    label: 'Deceased',
    shortLabel: 'D',
    color: '#6b7280', // gray-500
    description: 'Cumulative TB deaths',
  },
];

/**
 * Props for the CompartmentBreakdown component
 */
export interface CompartmentBreakdownProps {
  /** Current compartment state */
  compartments: CompartmentState;
  /** Total population (for percentage calculations) */
  totalPopulation: number;
  /** Display mode: 'bar' or 'pie' style visualization */
  displayMode?: 'bar' | 'stacked';
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compartment item for the legend/details view
 */
interface CompartmentItemProps {
  config: CompartmentDisplayConfig;
  value: number;
  percentage: number;
}

function CompartmentItem({ config, value, percentage }: CompartmentItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: config.color }}
              aria-hidden="true"
            />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums">{formatNumber(value)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              ({formatPercent(percentage)})
            </span>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Horizontal stacked bar visualization
 */
interface StackedBarProps {
  compartments: CompartmentState;
  totalPopulation: number;
}

function StackedBar({ compartments, totalPopulation }: StackedBarProps) {
  const segments = COMPARTMENT_DISPLAY_CONFIGS.map((config) => ({
    ...config,
    value: compartments[config.key],
    percentage: totalPopulation > 0 ? compartments[config.key] / totalPopulation : 0,
  })).filter((segment) => segment.value > 0);

  return (
    <div className="space-y-2">
      <div
        className="h-8 w-full overflow-hidden rounded-lg flex"
        role="img"
        aria-label="Compartment distribution"
      >
        {segments.map((segment, index) => (
          <Tooltip key={segment.key}>
            <TooltipTrigger asChild>
              <motion.div
                className="h-full cursor-default"
                style={{ backgroundColor: segment.color }}
                initial={{ width: 0 }}
                animate={{ width: `${segment.percentage * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                aria-label={`${segment.label}: ${formatPercent(segment.percentage)}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{segment.label}</p>
                <p className="text-xs">
                  {formatNumber(segment.value)} ({formatPercent(segment.percentage)})
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

/**
 * Nivo bar chart visualization
 */
interface BarChartProps {
  compartments: CompartmentState;
  height: number;
}

function BarChart({ compartments, height }: BarChartProps) {
  const data: BarDatum[] = COMPARTMENT_DISPLAY_CONFIGS.map((config) => ({
    compartment: config.shortLabel,
    value: compartments[config.key],
    label: config.label,
    color: config.color,
  }));

  return (
    <div style={{ height }} role="img" aria-label="Compartment distribution bar chart">
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="compartment"
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={(d) => {
          const config = COMPARTMENT_DISPLAY_CONFIGS.find(
            (c) => c.shortLabel === d.indexValue
          );
          return config?.color ?? '#6b7280';
        }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: (value: number) =>
            value >= 1000000
              ? `${(value / 1000000).toFixed(1)}M`
              : value >= 1000
                ? `${(value / 1000).toFixed(0)}K`
                : value.toString(),
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
        animate={true}
        motionConfig="gentle"
        theme={{
          axis: {
            ticks: {
              text: {
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
              },
            },
          },
          grid: {
            line: {
              stroke: 'hsl(var(--border))',
              strokeWidth: 1,
            },
          },
        }}
        tooltip={({ value, indexValue, color }) => {
          const config = COMPARTMENT_DISPLAY_CONFIGS.find(
            (c) => c.shortLabel === indexValue
          );
          return (
            <div className="rounded-lg bg-background border shadow-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium">{config?.label ?? indexValue}</span>
              </div>
              <div className="text-muted-foreground">
                Count: <span className="text-foreground font-medium">{formatNumber(value as number)}</span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

/**
 * CompartmentBreakdown displays the current distribution of population across
 * SEIR compartments using either a stacked horizontal bar or a vertical bar chart.
 *
 * Features:
 * - Color-coded compartments matching the time series chart
 * - Tooltips with exact values and percentages
 * - Detailed legend with all compartments
 * - Responsive design adapting to container width
 *
 * @example
 * ```tsx
 * <CompartmentBreakdown
 *   compartments={currentState.compartments}
 *   totalPopulation={67000000}
 *   displayMode="stacked"
 * />
 * ```
 */
export function CompartmentBreakdown({
  compartments,
  totalPopulation,
  displayMode = 'stacked',
  height = 250,
  className,
}: CompartmentBreakdownProps) {
  // Calculate total for percentage calculations
  const actualTotal = Object.values(compartments).reduce((sum, val) => sum + val, 0);
  const effectiveTotal = Math.max(actualTotal, totalPopulation);

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="region"
      aria-label="Compartment Distribution"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Population Distribution
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visualization */}
        {displayMode === 'stacked' ? (
          <StackedBar compartments={compartments} totalPopulation={effectiveTotal} />
        ) : (
          <BarChart compartments={compartments} height={height} />
        )}

        {/* Detailed breakdown list */}
        <div className="space-y-1 pt-2 border-t">
          {COMPARTMENT_DISPLAY_CONFIGS.map((config) => {
            const value = compartments[config.key];
            const percentage = effectiveTotal > 0 ? value / effectiveTotal : 0;
            return (
              <CompartmentItem
                key={config.key}
                config={config}
                value={value}
                percentage={percentage}
              />
            );
          })}
        </div>

        {/* Total summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total Population</span>
            <span className="tabular-nums">{formatNumber(effectiveTotal)}</span>
          </div>
          {actualTotal !== totalPopulation && (
            <p className="text-xs text-muted-foreground mt-1">
              Note: Sum of compartments ({formatNumber(actualTotal)}) differs from
              configured population ({formatNumber(totalPopulation)})
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CompartmentBreakdown;
