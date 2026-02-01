'use client';

import * as React from 'react';
import { ResponsiveLine, type LineSeries, type PointTooltipProps } from '@nivo/line';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatNumber } from '@/lib/utils';
import type { TimeSeriesPoint, CompartmentState } from '@/types/simulation';

/**
 * Custom series type for the chart data
 */
interface ChartSeries extends LineSeries {
  id: string;
  color?: string;
  data: readonly { x: number; y: number }[];
}

/**
 * Compartment configuration for chart display
 */
interface CompartmentConfig {
  key: keyof CompartmentState;
  label: string;
  color: string;
  description: string;
}

/**
 * Compartment configurations with colors and labels
 */
const COMPARTMENT_CONFIGS: CompartmentConfig[] = [
  {
    key: 'S',
    label: 'Susceptible',
    color: '#3b82f6', // blue-500
    description: 'Never infected, unvaccinated',
  },
  {
    key: 'V',
    label: 'Vaccinated',
    color: '#22c55e', // green-500
    description: 'BCG vaccinated with partial protection',
  },
  {
    key: 'E_H',
    label: 'Exposed (High-risk)',
    color: '#f59e0b', // amber-500
    description: 'Recently infected, higher progression risk',
  },
  {
    key: 'E_L',
    label: 'Exposed (Low-risk)',
    color: '#eab308', // yellow-500
    description: 'Latent TB, stable state',
  },
  {
    key: 'I',
    label: 'Infectious',
    color: '#ef4444', // red-500
    description: 'Active TB disease, can transmit',
  },
  {
    key: 'R',
    label: 'Recovered',
    color: '#8b5cf6', // violet-500
    description: 'Treated or self-cured',
  },
];

/**
 * Props for the InfectionChart component
 */
export interface InfectionChartProps {
  /** Time series data from simulation */
  data: TimeSeriesPoint[];
  /** Initially visible compartments */
  initialVisibleCompartments?: (keyof CompartmentState)[];
  /** Chart height in pixels */
  height?: number;
  /** Enable zoom and pan */
  enableZoom?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Custom legend item component
 */
interface LegendItemProps {
  config: CompartmentConfig;
  isVisible: boolean;
  onToggle: () => void;
}

function LegendItem({ config, isVisible, onToggle }: LegendItemProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-all',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isVisible ? 'opacity-100' : 'opacity-40'
      )}
      aria-pressed={isVisible}
      aria-label={`${isVisible ? 'Hide' : 'Show'} ${config.label}`}
      title={config.description}
    >
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      <span className={cn(!isVisible && 'line-through')}>{config.label}</span>
    </button>
  );
}

/**
 * Custom tooltip component for the chart
 */
function ChartTooltip({ point }: PointTooltipProps<ChartSeries>) {
  const config = COMPARTMENT_CONFIGS.find(
    (c) => c.label === point.seriesId
  );

  return (
    <div className="rounded-lg bg-background border shadow-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: config?.color ?? point.seriesColor }}
        />
        <span className="font-medium">{point.seriesId}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 text-xs">
        <span className="text-muted-foreground">Day:</span>
        <span className="font-medium">{point.data.x}</span>
        <span className="text-muted-foreground">Count:</span>
        <span className="font-medium">{formatNumber(point.data.y as number)}</span>
      </div>
    </div>
  );
}

/**
 * Transforms time series data into Nivo line chart format
 */
function transformData(
  data: TimeSeriesPoint[],
  visibleCompartments: Set<keyof CompartmentState>
): ChartSeries[] {
  return COMPARTMENT_CONFIGS.filter((config) =>
    visibleCompartments.has(config.key)
  ).map((config) => ({
    id: config.label,
    color: config.color,
    data: data.map((point) => ({
      x: point.day,
      y: point.compartments[config.key],
    })),
  }));
}

/**
 * InfectionChart displays a time series visualization of SEIR compartments
 * using Nivo line charts.
 *
 * Features:
 * - Interactive legend to show/hide compartments
 * - Custom tooltips with detailed values
 * - Responsive sizing
 * - Zoom and pan capabilities (when enabled)
 * - Canvas rendering for performance with large datasets
 *
 * @example
 * ```tsx
 * <InfectionChart
 *   data={simulationHistory}
 *   initialVisibleCompartments={['S', 'I', 'R']}
 *   height={400}
 *   enableZoom
 * />
 * ```
 */
export function InfectionChart({
  data,
  initialVisibleCompartments = ['S', 'V', 'I', 'R'],
  height = 400,
  enableZoom = false,
  className,
}: InfectionChartProps) {
  const [visibleCompartments, setVisibleCompartments] = React.useState<
    Set<keyof CompartmentState>
  >(new Set(initialVisibleCompartments));

  const [zoomState, setZoomState] = React.useState<{
    xMin: number;
    xMax: number;
  } | null>(null);

  const toggleCompartment = React.useCallback(
    (key: keyof CompartmentState) => {
      setVisibleCompartments((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          // Don't allow hiding all compartments
          if (next.size > 1) {
            next.delete(key);
          }
        } else {
          next.add(key);
        }
        return next;
      });
    },
    []
  );

  const chartData = React.useMemo(
    () => transformData(data, visibleCompartments),
    [data, visibleCompartments]
  );

  // Calculate axis bounds
  const xBounds = React.useMemo(() => {
    if (data.length === 0) return { min: 0, max: 100 };
    if (zoomState) return { min: zoomState.xMin, max: zoomState.xMax };
    return { min: 0, max: data[data.length - 1].day };
  }, [data, zoomState]);

  // Get colors for visible compartments
  const colors = React.useMemo(
    () =>
      COMPARTMENT_CONFIGS.filter((c) => visibleCompartments.has(c.key)).map(
        (c) => c.color
      ),
    [visibleCompartments]
  );

  // Calculate max Y value for axis
  const maxY = React.useMemo(() => {
    if (data.length === 0) return 1000;
    let max = 0;
    for (const point of data) {
      for (const key of visibleCompartments) {
        if (point.compartments[key] > max) {
          max = point.compartments[key];
        }
      }
    }
    return Math.ceil(max * 1.1); // Add 10% padding
  }, [data, visibleCompartments]);

  // Chart configuration
  const chartProps = {
    data: chartData,
    margin: { top: 20, right: 20, bottom: 60, left: 80 },
    xScale: {
      type: 'linear' as const,
      min: xBounds.min,
      max: xBounds.max,
    },
    yScale: {
      type: 'linear' as const,
      min: 0,
      max: maxY,
      stacked: false,
    },
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Day',
      legendOffset: 40,
      legendPosition: 'middle' as const,
      truncateTickAt: 0,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Population',
      legendOffset: -60,
      legendPosition: 'middle' as const,
      format: (value: number) =>
        value >= 1000000
          ? `${(value / 1000000).toFixed(1)}M`
          : value >= 1000
            ? `${(value / 1000).toFixed(0)}K`
            : value.toString(),
    },
    colors,
    pointSize: 0,
    pointBorderWidth: 0,
    enablePointLabel: false,
    useMesh: true,
    enableSlices: false as const,
    enableCrosshair: true,
    crosshairType: 'x' as const,
    tooltip: ChartTooltip,
    legends: [],
    animate: true,
    motionConfig: 'gentle' as const,
    theme: {
      axis: {
        ticks: {
          text: {
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 11,
          },
        },
        legend: {
          text: {
            fill: 'hsl(var(--foreground))',
            fontSize: 12,
            fontWeight: 500,
          },
        },
      },
      grid: {
        line: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        },
      },
      crosshair: {
        line: {
          stroke: 'hsl(var(--foreground))',
          strokeWidth: 1,
          strokeOpacity: 0.5,
        },
      },
    },
    lineWidth: 2,
    enableGridX: false,
    enableGridY: true,
  };

  // Reset zoom handler
  const handleResetZoom = React.useCallback(() => {
    setZoomState(null);
  }, []);

  // Simple zoom controls (since Nivo doesn't have built-in zoom)
  const handleZoomIn = React.useCallback(() => {
    if (data.length === 0) return;
    const maxDay = data[data.length - 1].day;
    const currentMin = zoomState?.xMin ?? 0;
    const currentMax = zoomState?.xMax ?? maxDay;
    const range = currentMax - currentMin;
    const center = (currentMin + currentMax) / 2;
    const newRange = range * 0.7;
    setZoomState({
      xMin: Math.max(0, center - newRange / 2),
      xMax: Math.min(maxDay, center + newRange / 2),
    });
  }, [data, zoomState]);

  const handleZoomOut = React.useCallback(() => {
    if (data.length === 0) return;
    const maxDay = data[data.length - 1].day;
    const currentMin = zoomState?.xMin ?? 0;
    const currentMax = zoomState?.xMax ?? maxDay;
    const range = currentMax - currentMin;
    const center = (currentMin + currentMax) / 2;
    const newRange = Math.min(range * 1.4, maxDay);
    setZoomState({
      xMin: Math.max(0, center - newRange / 2),
      xMax: Math.min(maxDay, center + newRange / 2),
    });
  }, [data, zoomState]);

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Compartment Time Series
        </CardTitle>
        {enableZoom && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Zoom in"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Zoom out"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>
            {zoomState && (
              <button
                onClick={handleResetZoom}
                className="rounded px-2 py-1 text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Reset zoom"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Interactive Legend */}
        <div
          className="flex flex-wrap gap-1 mb-4"
          role="group"
          aria-label="Toggle compartment visibility"
        >
          {COMPARTMENT_CONFIGS.map((config) => (
            <LegendItem
              key={config.key}
              config={config}
              isVisible={visibleCompartments.has(config.key)}
              onToggle={() => toggleCompartment(config.key)}
            />
          ))}
        </div>

        {/* Chart */}
        <div
          style={{ height }}
          role="img"
          aria-label="SEIR compartment time series chart"
        >
          {data.length > 0 ? (
            <ResponsiveLine {...chartProps} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No data available. Run the simulation to see results.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default InfectionChart;
