'use client';

/**
 * TransmissionEvent Component
 *
 * Renders an animated line between two points representing a disease
 * transmission event in the simulation. The line fades in and out
 * over time to indicate active transmission.
 *
 * Compatible with PixiJS v8 API.
 *
 * @module components/simulation/TransmissionEvent
 */

import React, { memo, useRef, useState } from 'react';
import { extend, useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';

// Extend Graphics for use in React
extend({ Graphics });

/**
 * Color mapping for transmission types
 */
const TRANSMISSION_COLORS = {
  infection: 0xef4444, // Red for infection
  recovery: 0x22c55e, // Green for recovery
  vaccination: 0x3b82f6, // Blue for vaccination protection
} as const;

/**
 * Props for TransmissionEvent component
 */
interface TransmissionEventProps {
  /** X coordinate of the source point */
  fromX: number;
  /** Y coordinate of the source point */
  fromY: number;
  /** X coordinate of the destination point */
  toX: number;
  /** Y coordinate of the destination point */
  toY: number;
  /** Type of transmission event */
  type: 'infection' | 'recovery' | 'vaccination';
  /** Timestamp when the event started (for animation timing) */
  startTime: number;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Maximum line width */
  lineWidth?: number;
}

/**
 * TransmissionEvent Component
 *
 * Renders an animated transmission line between two agents.
 * The line fades in, holds, then fades out over the duration.
 *
 * Animation phases:
 * - 0-25%: Fade in
 * - 25-75%: Hold at full opacity
 * - 75-100%: Fade out
 *
 * @example
 * ```tsx
 * <TransmissionEvent
 *   fromX={100}
 *   fromY={200}
 *   toX={300}
 *   toY={400}
 *   type="infection"
 *   startTime={Date.now()}
 * />
 * ```
 */
export const TransmissionEvent = memo(function TransmissionEvent({
  fromX,
  fromY,
  toX,
  toY,
  type,
  startTime,
  duration = 2000,
  lineWidth = 2,
}: TransmissionEventProps) {
  const graphicsRef = useRef<Graphics>(null);
  const [isComplete, setIsComplete] = useState(false);

  const color = TRANSMISSION_COLORS[type];

  // Animation tick
  useTick(() => {
    if (!graphicsRef.current || isComplete) return;

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      setIsComplete(true);
      return;
    }

    // Calculate alpha based on animation phase
    let alpha: number;
    if (progress < 0.25) {
      // Fade in
      alpha = progress / 0.25;
    } else if (progress < 0.75) {
      // Hold
      alpha = 1;
    } else {
      // Fade out
      alpha = 1 - (progress - 0.75) / 0.25;
    }

    // Calculate current endpoint based on progress
    const drawProgress = Math.min(progress * 2, 1);
    const currentToX = fromX + (toX - fromX) * drawProgress;
    const currentToY = fromY + (toY - fromY) * drawProgress;

    const g = graphicsRef.current;
    g.clear();

    // Main transmission line
    g.moveTo(fromX, fromY);
    g.lineTo(currentToX, currentToY);
    g.stroke({ width: lineWidth, color: color, alpha: alpha * 0.8 });

    // Glow effect (wider, more transparent line)
    g.moveTo(fromX, fromY);
    g.lineTo(currentToX, currentToY);
    g.stroke({ width: lineWidth * 3, color: color, alpha: alpha * 0.2 });

    // Source point indicator
    g.circle(fromX, fromY, lineWidth * 2);
    g.fill({ color: color, alpha: alpha * 0.6 });

    // Destination point indicator (only when line reaches it)
    if (drawProgress >= 1) {
      g.circle(toX, toY, lineWidth * 2.5);
      g.fill({ color: color, alpha: alpha * 0.8 });

      // Pulse effect at destination
      const pulseSize = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
      g.circle(toX, toY, lineWidth * 4 * pulseSize);
      g.stroke({ width: 1, color: color, alpha: alpha * 0.4 });
    }
  });

  if (isComplete) return null;

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

/**
 * Batch renderer for multiple transmission events
 * More efficient when rendering many events simultaneously
 */
export const TransmissionEventBatch = memo(function TransmissionEventBatch({
  events,
}: {
  events: Array<{
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: 'infection' | 'recovery' | 'vaccination';
    startTime: number;
  }>;
}) {
  const graphicsRef = useRef<Graphics>(null);

  useTick(() => {
    if (!graphicsRef.current) return;

    const g = graphicsRef.current;
    g.clear();

    const now = Date.now();

    for (const event of events) {
      const elapsed = now - event.startTime;
      const duration = 2000;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) continue;

      // Calculate alpha
      let alpha: number;
      if (progress < 0.25) {
        alpha = progress / 0.25;
      } else if (progress < 0.75) {
        alpha = 1;
      } else {
        alpha = 1 - (progress - 0.75) / 0.25;
      }

      const color = TRANSMISSION_COLORS[event.type];
      const drawProgress = Math.min(progress * 2, 1);
      const currentToX =
        event.fromX + (event.toX - event.fromX) * drawProgress;
      const currentToY =
        event.fromY + (event.toY - event.fromY) * drawProgress;

      // Draw line
      g.moveTo(event.fromX, event.fromY);
      g.lineTo(currentToX, currentToY);
      g.stroke({ width: 2, color: color, alpha: alpha * 0.8 });

      // Source point
      g.circle(event.fromX, event.fromY, 4);
      g.fill({ color: color, alpha: alpha * 0.6 });

      // Destination point
      if (drawProgress >= 1) {
        g.circle(event.toX, event.toY, 5);
        g.fill({ color: color, alpha: alpha * 0.8 });
      }
    }
  });

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

export default TransmissionEvent;
