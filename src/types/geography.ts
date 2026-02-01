/**
 * Geography Type Definitions
 * Types for UK regions and geographic data
 */

/**
 * UK region identifiers
 */
export type UKRegionId =
  | 'london'
  | 'south_east'
  | 'south_west'
  | 'east_of_england'
  | 'west_midlands'
  | 'east_midlands'
  | 'yorkshire_humber'
  | 'north_west'
  | 'north_east'
  | 'wales'
  | 'scotland'
  | 'northern_ireland';

/**
 * UK region data
 */
export interface UKRegion {
  id: UKRegionId;
  name: string;
  population: number;
  area: number; // km²
  density: number; // people per km²
  urbanProportion: number;
  tbIncidenceRate: number; // per 100,000
  bcgCoverage: number;
  deprivationIndex: number; // 1-10
  majorCities: string[];
}

/**
 * GeoJSON feature for map rendering
 */
export interface RegionGeoFeature {
  type: 'Feature';
  properties: {
    id: UKRegionId;
    name: string;
    population: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

/**
 * GeoJSON feature collection for UK map
 */
export interface UKGeoJSON {
  type: 'FeatureCollection';
  features: RegionGeoFeature[];
}

/**
 * Map display configuration
 */
export interface MapConfig {
  /** Center coordinates [longitude, latitude] */
  center: [number, number];
  /** Initial zoom level */
  zoom: number;
  /** Min zoom level */
  minZoom: number;
  /** Max zoom level */
  maxZoom: number;
  /** Projection type */
  projection: 'mercator' | 'equalArea';
}

/**
 * Choropleth color scale configuration
 */
export interface ColorScale {
  type: 'sequential' | 'diverging' | 'categorical';
  domain: [number, number];
  colors: string[];
}

/**
 * Region state for visualization
 */
export interface RegionDisplayState {
  regionId: UKRegionId;
  value: number;
  color: string;
  highlighted: boolean;
  tooltipContent: string;
}

/**
 * Map interaction events
 */
export interface MapInteraction {
  type: 'hover' | 'click' | 'zoom' | 'pan';
  regionId?: UKRegionId;
  coordinates?: [number, number];
  timestamp: number;
}

/**
 * UK geographic constants
 */
export const UK_GEOGRAPHY = {
  bounds: {
    north: 60.86,
    south: 49.86,
    east: 1.76,
    west: -8.65,
  },
  center: [-2.5, 54.5] as [number, number],
  totalArea: 242_495, // km²
  englandArea: 130_279,
  scotlandArea: 77_933,
  walesArea: 20_779,
  northernIrelandArea: 13_562,
} as const;

/**
 * Default UK regions data
 */
export const UK_REGIONS: UKRegion[] = [
  {
    id: 'london',
    name: 'London',
    population: 9_000_000,
    area: 1_572,
    density: 5_727,
    urbanProportion: 1.0,
    tbIncidenceRate: 20.6,
    bcgCoverage: 0.92,
    deprivationIndex: 5,
    majorCities: ['London'],
  },
  {
    id: 'south_east',
    name: 'South East',
    population: 9_300_000,
    area: 19_096,
    density: 487,
    urbanProportion: 0.85,
    tbIncidenceRate: 5.2,
    bcgCoverage: 0.88,
    deprivationIndex: 3,
    majorCities: ['Brighton', 'Southampton', 'Oxford'],
  },
  {
    id: 'south_west',
    name: 'South West',
    population: 5_700_000,
    area: 23_837,
    density: 239,
    urbanProportion: 0.70,
    tbIncidenceRate: 3.8,
    bcgCoverage: 0.85,
    deprivationIndex: 4,
    majorCities: ['Bristol', 'Plymouth', 'Exeter'],
  },
  {
    id: 'east_of_england',
    name: 'East of England',
    population: 6_300_000,
    area: 19_120,
    density: 329,
    urbanProportion: 0.75,
    tbIncidenceRate: 5.5,
    bcgCoverage: 0.87,
    deprivationIndex: 4,
    majorCities: ['Cambridge', 'Norwich', 'Peterborough'],
  },
  {
    id: 'west_midlands',
    name: 'West Midlands',
    population: 5_950_000,
    area: 13_000,
    density: 458,
    urbanProportion: 0.85,
    tbIncidenceRate: 8.5,
    bcgCoverage: 0.90,
    deprivationIndex: 6,
    majorCities: ['Birmingham', 'Coventry', 'Wolverhampton'],
  },
  {
    id: 'east_midlands',
    name: 'East Midlands',
    population: 4_900_000,
    area: 15_627,
    density: 314,
    urbanProportion: 0.75,
    tbIncidenceRate: 6.2,
    bcgCoverage: 0.88,
    deprivationIndex: 5,
    majorCities: ['Nottingham', 'Leicester', 'Derby'],
  },
  {
    id: 'yorkshire_humber',
    name: 'Yorkshire and the Humber',
    population: 5_500_000,
    area: 15_420,
    density: 357,
    urbanProportion: 0.80,
    tbIncidenceRate: 6.8,
    bcgCoverage: 0.89,
    deprivationIndex: 6,
    majorCities: ['Leeds', 'Sheffield', 'Bradford'],
  },
  {
    id: 'north_west',
    name: 'North West',
    population: 7_400_000,
    area: 14_165,
    density: 522,
    urbanProportion: 0.88,
    tbIncidenceRate: 5.9,
    bcgCoverage: 0.88,
    deprivationIndex: 6,
    majorCities: ['Manchester', 'Liverpool', 'Preston'],
  },
  {
    id: 'north_east',
    name: 'North East',
    population: 2_700_000,
    area: 8_592,
    density: 314,
    urbanProportion: 0.80,
    tbIncidenceRate: 3.5,
    bcgCoverage: 0.86,
    deprivationIndex: 7,
    majorCities: ['Newcastle', 'Sunderland', 'Middlesbrough'],
  },
  {
    id: 'wales',
    name: 'Wales',
    population: 3_200_000,
    area: 20_779,
    density: 154,
    urbanProportion: 0.65,
    tbIncidenceRate: 3.2,
    bcgCoverage: 0.85,
    deprivationIndex: 6,
    majorCities: ['Cardiff', 'Swansea', 'Newport'],
  },
  {
    id: 'scotland',
    name: 'Scotland',
    population: 5_500_000,
    area: 77_933,
    density: 71,
    urbanProportion: 0.70,
    tbIncidenceRate: 4.1,
    bcgCoverage: 0.90,
    deprivationIndex: 5,
    majorCities: ['Glasgow', 'Edinburgh', 'Aberdeen'],
  },
  {
    id: 'northern_ireland',
    name: 'Northern Ireland',
    population: 1_900_000,
    area: 13_562,
    density: 140,
    urbanProportion: 0.65,
    tbIncidenceRate: 2.8,
    bcgCoverage: 0.88,
    deprivationIndex: 5,
    majorCities: ['Belfast', 'Derry', 'Lisburn'],
  },
];
