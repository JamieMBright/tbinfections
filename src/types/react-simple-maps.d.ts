/**
 * Type declarations for react-simple-maps
 * This module provides React components for rendering SVG maps
 */

declare module 'react-simple-maps' {
  import { ComponentType, ReactNode, CSSProperties } from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      center?: [number, number];
      scale?: number;
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: GeographyType[] }) => ReactNode;
  }

  export interface GeographyType {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: number[][][] | number[][][][];
    };
  }

  export interface GeographyProps {
    geography: GeographyType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties & { outline?: string; transition?: string };
      hover?: CSSProperties & { outline?: string; cursor?: string };
      pressed?: CSSProperties & { outline?: string };
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    children?: ReactNode;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
  }

  export interface LineProps {
    from: [number, number];
    to: [number, number];
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
  }

  export interface AnnotationProps {
    subject: [number, number];
    dx?: number;
    dy?: number;
    connectorProps?: {
      stroke?: string;
      strokeWidth?: number;
    };
    children?: ReactNode;
  }

  export interface SphereProps {
    id?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  export interface GraticuleProps {
    step?: [number, number];
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Line: ComponentType<LineProps>;
  export const Annotation: ComponentType<AnnotationProps>;
  export const Sphere: ComponentType<SphereProps>;
  export const Graticule: ComponentType<GraticuleProps>;
}
