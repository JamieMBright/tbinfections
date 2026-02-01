'use client';

/**
 * UKMap Component
 *
 * Interactive choropleth map of UK regions using React Simple Maps.
 * Displays regional TB incidence rates, deaths, or other metrics
 * with color-coded regions and interactive hover/click states.
 *
 * Features:
 * - Choropleth coloring based on selected metric
 * - Hover tooltips with region details
 * - Click to select/filter regions
 * - Responsive sizing
 * - Color scale legend
 *
 * @module components/simulation/UKMap
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import type { GeographyType } from 'react-simple-maps';
import { scaleSequential } from 'd3-scale';
import {
  interpolateReds,
  interpolateBlues,
  interpolateGreens,
} from 'd3-scale-chromatic';
import { useSimulationStore } from '@/stores/simulation-store';
import { UK_REGIONS, UK_GEOGRAPHY } from '@/types/geography';
import type { UKRegionId } from '@/types/geography';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatNumber, formatRate } from '@/lib/utils';

/**
 * Available metrics for choropleth visualization
 */
type MetricType = 'incidence' | 'deaths' | 'vaccinations' | 'infections';

/**
 * Color scheme mapping for metrics
 */
const METRIC_COLOR_SCHEMES = {
  incidence: interpolateReds,
  deaths: interpolateReds,
  vaccinations: interpolateGreens,
  infections: interpolateBlues,
} as const;

/**
 * Metric labels for display
 */
const METRIC_LABELS: Record<MetricType, string> = {
  incidence: 'TB Incidence Rate',
  deaths: 'Deaths',
  vaccinations: 'Vaccination Coverage',
  infections: 'Active Infections',
};

/**
 * Props for UKMap component
 */
interface UKMapProps {
  /** The metric to display on the choropleth */
  metric?: MetricType;
  /** Callback when a region is clicked */
  onRegionClick?: (regionId: UKRegionId) => void;
  /** Callback when a region is hovered */
  onRegionHover?: (regionId: UKRegionId | null) => void;
  /** Currently selected region */
  selectedRegion?: UKRegionId | null;
  /** Width of the map */
  width?: number;
  /** Height of the map */
  height?: number;
  /** CSS class name */
  className?: string;
}

/**
 * Region state type for type-safe access
 */
interface RegionStateData {
  incidenceRate: number;
  compartments: {
    I: number;
    D: number;
    V: number;
  };
}

/**
 * Get metric value for a region
 */
function getRegionMetricValue(
  regionId: string,
  metric: MetricType,
  regionStates: Map<string, RegionStateData>
): number {
  const region = UK_REGIONS.find((r) => r.id === regionId);
  const regionState = regionStates.get(regionId);

  switch (metric) {
    case 'incidence':
      return regionState?.incidenceRate ?? region?.tbIncidenceRate ?? 0;
    case 'deaths':
      return regionState?.compartments?.D ?? 0;
    case 'vaccinations':
      return region?.bcgCoverage ?? 0;
    case 'infections':
      return regionState?.compartments?.I ?? 0;
    default:
      return 0;
  }
}

/**
 * Get geometry for a region (simplified polygon data)
 * This provides basic region shapes for the map
 */
function getRegionGeometry(regionId: string): {
  type: 'Polygon';
  coordinates: number[][][];
} {
  // Simplified polygon coordinates for each UK region
  const regionGeometries: Record<string, number[][][]> = {
    london: [
      [
        [-0.51, 51.28],
        [-0.51, 51.69],
        [0.33, 51.69],
        [0.33, 51.28],
        [-0.51, 51.28],
      ],
    ],
    south_east: [
      [
        [-2.0, 50.7],
        [-1.8, 51.3],
        [-0.8, 51.7],
        [0.33, 51.28],
        [1.45, 51.38],
        [1.42, 50.75],
        [0.0, 50.75],
        [-1.3, 50.65],
        [-2.0, 50.7],
      ],
    ],
    south_west: [
      [
        [-5.72, 50.07],
        [-5.05, 50.55],
        [-4.2, 50.35],
        [-3.55, 50.22],
        [-3.0, 50.7],
        [-2.0, 50.7],
        [-1.8, 51.3],
        [-2.4, 51.9],
        [-2.65, 51.6],
        [-3.1, 51.2],
        [-3.6, 51.4],
        [-4.3, 51.4],
        [-5.3, 51.9],
        [-5.5, 51.0],
        [-5.72, 50.07],
      ],
    ],
    east_of_england: [
      [
        [-0.51, 51.69],
        [0.33, 51.69],
        [1.45, 51.38],
        [1.76, 52.0],
        [1.75, 52.49],
        [0.5, 52.98],
        [-0.5, 52.65],
        [-0.27, 52.1],
        [-0.51, 51.69],
      ],
    ],
    west_midlands: [
      [
        [-3.1, 52.0],
        [-2.65, 51.6],
        [-2.4, 51.9],
        [-1.8, 52.1],
        [-1.5, 52.0],
        [-1.5, 52.5],
        [-1.7, 52.9],
        [-2.4, 53.0],
        [-3.05, 52.75],
        [-3.1, 52.0],
      ],
    ],
    east_midlands: [
      [
        [-1.5, 52.0],
        [-0.27, 52.1],
        [-0.5, 52.65],
        [0.0, 53.0],
        [-0.3, 53.5],
        [-1.2, 53.5],
        [-1.7, 52.9],
        [-1.5, 52.5],
        [-1.5, 52.0],
      ],
    ],
    yorkshire_humber: [
      [
        [-2.2, 53.4],
        [-1.2, 53.5],
        [-0.3, 53.5],
        [0.15, 53.7],
        [-0.1, 54.0],
        [-0.43, 54.35],
        [-1.95, 54.5],
        [-2.2, 54.1],
        [-2.2, 53.4],
      ],
    ],
    north_west: [
      [
        [-3.1, 53.0],
        [-2.4, 53.0],
        [-2.2, 53.4],
        [-2.2, 54.1],
        [-1.95, 54.5],
        [-2.4, 55.0],
        [-2.8, 55.5],
        [-3.05, 55.05],
        [-3.6, 54.1],
        [-3.2, 53.25],
        [-3.1, 53.0],
      ],
    ],
    north_east: [
      [
        [-2.4, 55.0],
        [-1.95, 54.5],
        [-0.43, 54.35],
        [-0.1, 54.5],
        [-0.9, 55.0],
        [-1.6, 55.65],
        [-2.1, 55.8],
        [-2.5, 55.65],
        [-2.4, 55.0],
      ],
    ],
    wales: [
      [
        [-4.3, 51.4],
        [-3.6, 51.4],
        [-3.1, 51.2],
        [-2.65, 51.6],
        [-3.1, 52.0],
        [-3.05, 52.75],
        [-3.1, 53.0],
        [-3.2, 53.25],
        [-4.1, 53.3],
        [-4.75, 53.2],
        [-4.5, 52.9],
        [-5.3, 51.9],
        [-4.3, 51.4],
      ],
    ],
    scotland: [
      [
        [-5.2, 55.4],
        [-4.6, 55.45],
        [-3.05, 55.05],
        [-2.8, 55.5],
        [-2.5, 55.65],
        [-2.1, 55.8],
        [-1.6, 55.65],
        [-1.75, 57.5],
        [-3.0, 58.65],
        [-5.0, 58.65],
        [-6.2, 58.0],
        [-5.8, 57.0],
        [-6.5, 56.5],
        [-6.3, 55.8],
        [-5.2, 55.4],
      ],
    ],
    northern_ireland: [
      [
        [-7.5, 54.1],
        [-6.0, 54.0],
        [-5.45, 54.5],
        [-5.5, 55.25],
        [-6.3, 55.25],
        [-7.3, 55.3],
        [-8.2, 55.0],
        [-8.0, 54.5],
        [-7.5, 54.1],
      ],
    ],
  };

  return {
    type: 'Polygon',
    coordinates: regionGeometries[regionId] || [
      [
        [-1, 51],
        [0, 51],
        [0, 52],
        [-1, 52],
        [-1, 51],
      ],
    ],
  };
}

/**
 * UKMap Component
 *
 * Renders an interactive choropleth map of UK regions showing
 * epidemiological data. Supports multiple metrics and interactive
 * region selection.
 *
 * @example
 * ```tsx
 * <UKMap
 *   metric="incidence"
 *   onRegionClick={(id) => console.log('Clicked:', id)}
 *   selectedRegion="london"
 * />
 * ```
 */
export const UKMap = memo(function UKMap({
  metric = 'incidence',
  onRegionClick,
  onRegionHover,
  selectedRegion,
  width = 400,
  height = 500,
  className,
}: UKMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<UKRegionId | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    value: number;
    metric: string;
  } | null>(null);

  // Store subscriptions
  const regionStates = useSimulationStore((state) => state.state.regionStates);

  // Calculate metric values for all regions
  const regionValues = useMemo(() => {
    const values: Record<string, number> = {};

    for (const region of UK_REGIONS) {
      values[region.id] = getRegionMetricValue(
        region.id,
        metric,
        regionStates as Map<string, RegionStateData>
      );
    }

    return values;
  }, [metric, regionStates]);

  // Calculate domain for color scale
  const domain = useMemo((): [number, number] => {
    const values = Object.values(regionValues);
    if (values.length === 0) return [0, 100];

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add some padding to the domain
    return [Math.max(0, min * 0.9), max * 1.1];
  }, [regionValues]);

  // Create color scale
  const colorScale = useMemo(() => {
    return scaleSequential(METRIC_COLOR_SCHEMES[metric]).domain(domain);
  }, [domain, metric]);

  // Handle region mouse enter
  const handleMouseEnter = useCallback(
    (regionId: string) => {
      const region = UK_REGIONS.find((r) => r.id === regionId);
      if (!region) return;

      setHoveredRegion(regionId as UKRegionId);
      setTooltipContent({
        name: region.name,
        value: regionValues[regionId] ?? 0,
        metric: METRIC_LABELS[metric],
      });

      onRegionHover?.(regionId as UKRegionId);
    },
    [regionValues, metric, onRegionHover]
  );

  // Handle region mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredRegion(null);
    setTooltipContent(null);
    onRegionHover?.(null);
  }, [onRegionHover]);

  // Handle region click
  const handleClick = useCallback(
    (regionId: string) => {
      onRegionClick?.(regionId as UKRegionId);
    },
    [onRegionClick]
  );

  // GeoJSON data for UK regions (inline for reliability)
  const geoData = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: UK_REGIONS.map((region) => ({
        type: 'Feature' as const,
        properties: {
          id: region.id,
          name: region.name,
          population: region.population,
        },
        geometry: getRegionGeometry(region.id),
      })),
    }),
    []
  );

  return (
    <div
      className={cn(
        'relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      <TooltipProvider>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: UK_GEOGRAPHY.center,
            scale: 2000,
          }}
          width={width}
          height={height}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={UK_GEOGRAPHY.center} zoom={1}>
            <Geographies geography={geoData}>
              {({ geographies }: { geographies: GeographyType[] }) =>
                geographies.map((geo: GeographyType) => {
                  const regionId = geo.properties.id as string;
                  const value = regionValues[regionId] ?? 0;
                  const isHovered = hoveredRegion === regionId;
                  const isSelected = selectedRegion === regionId;

                  return (
                    <Tooltip key={geo.rsmKey}>
                      <TooltipTrigger asChild>
                        <Geography
                          geography={geo}
                          fill={colorScale(value)}
                          stroke={
                            isSelected
                              ? '#1e40af'
                              : isHovered
                                ? '#3b82f6'
                                : '#94a3b8'
                          }
                          strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                          style={{
                            default: {
                              outline: 'none',
                              transition: 'all 0.2s ease',
                            },
                            hover: {
                              outline: 'none',
                              cursor: 'pointer',
                            },
                            pressed: {
                              outline: 'none',
                            },
                          }}
                          onMouseEnter={() => handleMouseEnter(regionId)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleClick(regionId)}
                        />
                      </TooltipTrigger>
                      {tooltipContent && hoveredRegion === regionId && (
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-semibold">
                              {tooltipContent.name}
                            </p>
                            <p className="text-slate-600">
                              {tooltipContent.metric}:{' '}
                              {metric === 'incidence'
                                ? formatRate(tooltipContent.value)
                                : metric === 'vaccinations'
                                  ? `${(tooltipContent.value * 100).toFixed(1)}%`
                                  : formatNumber(tooltipContent.value)}
                            </p>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </TooltipProvider>

      {/* Color scale legend */}
      <ColorScaleLegend
        colorScale={colorScale}
        domain={domain}
        metric={metric}
        className="absolute bottom-3 left-3"
      />

      {/* Metric selector */}
      <div className="absolute top-3 right-3 bg-white/90 rounded-md px-2 py-1 text-xs font-medium shadow-sm">
        {METRIC_LABELS[metric]}
      </div>
    </div>
  );
});

/**
 * Color scale legend component
 */
const ColorScaleLegend = memo(function ColorScaleLegend({
  colorScale,
  domain,
  metric,
  className,
}: {
  colorScale: (value: number) => string;
  domain: [number, number];
  metric: MetricType;
  className?: string;
}) {
  // Generate gradient stops
  const gradientStops = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const value = domain[0] + (domain[1] - domain[0]) * (i / 10);
      stops.push(colorScale(value));
    }
    return stops;
  }, [colorScale, domain]);

  const formatValue = useCallback(
    (value: number) => {
      if (metric === 'vaccinations') {
        return `${(value * 100).toFixed(0)}%`;
      }
      if (metric === 'incidence') {
        return value.toFixed(1);
      }
      return formatNumber(Math.round(value));
    },
    [metric]
  );

  return (
    <div className={cn('bg-white/90 rounded-md px-2 py-1.5 shadow-sm', className)}>
      <div
        className="w-24 h-2 rounded-sm"
        style={{
          background: `linear-gradient(to right, ${gradientStops.join(', ')})`,
        }}
      />
      <div className="flex justify-between mt-1 text-[10px] text-slate-600">
        <span>{formatValue(domain[0])}</span>
        <span>{formatValue(domain[1])}</span>
      </div>
    </div>
  );
});

export default UKMap;
