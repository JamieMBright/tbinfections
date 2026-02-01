'use client';

/**
 * VaccinationShield Component
 *
 * Renders an animated shield effect when vaccination blocks an infection.
 * Shows a brief, celebratory but subtle visual feedback to indicate
 * successful protection from the BCG vaccine.
 *
 * Compatible with PixiJS v8 API.
 *
 * Animation:
 * - Expanding shield ring
 * - Shield icon flash
 * - Particle sparkle effect
 *
 * @module components/simulation/VaccinationShield
 */

import React, { memo, useRef, useState } from 'react';
import { extend, useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';

// Extend Graphics for use in React
extend({ Graphics });

/**
 * Shield colors (green for protection)
 */
const SHIELD_COLOR = 0x22c55e;
const SHIELD_COLOR_LIGHT = 0x86efac;

/**
 * Props for VaccinationShield component
 */
interface VaccinationShieldProps {
  /** X coordinate of the shield effect center */
  x: number;
  /** Y coordinate of the shield effect center */
  y: number;
  /** Timestamp when the effect started */
  startTime: number;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Size of the shield effect */
  size?: number;
}

/**
 * Particle for sparkle effect
 */
interface Particle {
  angle: number;
  speed: number;
  life: number;
  size: number;
}

/**
 * VaccinationShield Component
 *
 * Renders a shield animation when vaccination blocks an infection.
 * The effect is designed to be noticeable but not distracting,
 * providing positive feedback without overwhelming the visualization.
 *
 * @example
 * ```tsx
 * <VaccinationShield
 *   x={200}
 *   y={300}
 *   startTime={Date.now()}
 * />
 * ```
 */
export const VaccinationShield = memo(function VaccinationShield({
  x,
  y,
  startTime,
  duration = 1000,
  size = 30,
}: VaccinationShieldProps) {
  const graphicsRef = useRef<Graphics>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Generate particles for sparkle effect - use ref to avoid re-renders
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2 + (i * 0.1),
      speed: 1 + (i * 0.2),
      life: 0.5 + (i * 0.05),
      size: 2 + (i * 0.25),
    }))
  );
  const particles = particlesRef.current;

  // Animation tick
  useTick(() => {
    if (!graphicsRef.current || isComplete) return;

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      setIsComplete(true);
      return;
    }

    const g = graphicsRef.current;
    g.clear();

    // Calculate animation phases
    const expandPhase = Math.min(progress * 3, 1); // Quick expand (first third)
    const fadePhase = progress > 0.3 ? (progress - 0.3) / 0.7 : 0; // Fade out (last 70%)

    const alpha = 1 - fadePhase;
    const currentSize = size * (0.5 + expandPhase * 0.5);

    // Outer glow ring
    g.circle(x, y, currentSize * 1.3);
    g.stroke({
      width: 3 * (1 - fadePhase * 0.5),
      color: SHIELD_COLOR,
      alpha: alpha * 0.3,
    });

    // Main shield ring
    g.circle(x, y, currentSize);
    g.stroke({ width: 2, color: SHIELD_COLOR, alpha: alpha * 0.7 });

    // Inner filled circle (flash effect)
    const flashAlpha = progress < 0.2 ? (0.2 - progress) / 0.2 : 0;
    if (flashAlpha > 0) {
      g.circle(x, y, currentSize * 0.8);
      g.fill({ color: SHIELD_COLOR_LIGHT, alpha: flashAlpha * 0.4 });
    }

    // Shield icon (simplified shield shape)
    if (alpha > 0.3) {
      const iconScale = currentSize / 30;
      const iconAlpha = alpha * 0.8;

      // Draw shield shape using path
      g.moveTo(x, y - 10 * iconScale);
      g.lineTo(x + 8 * iconScale, y - 6 * iconScale);
      g.lineTo(x + 8 * iconScale, y + 2 * iconScale);
      g.quadraticCurveTo(
        x + 8 * iconScale,
        y + 8 * iconScale,
        x,
        y + 12 * iconScale
      );
      g.quadraticCurveTo(
        x - 8 * iconScale,
        y + 8 * iconScale,
        x - 8 * iconScale,
        y + 2 * iconScale
      );
      g.lineTo(x - 8 * iconScale, y - 6 * iconScale);
      g.closePath();
      g.fill({ color: SHIELD_COLOR, alpha: iconAlpha });

      // Checkmark on shield
      if (progress > 0.15) {
        const checkAlpha = Math.min((progress - 0.15) / 0.2, 1) * iconAlpha;
        g.moveTo(x - 3 * iconScale, y);
        g.lineTo(x - 1 * iconScale, y + 3 * iconScale);
        g.lineTo(x + 4 * iconScale, y - 3 * iconScale);
        g.stroke({ width: 2 * iconScale, color: 0xffffff, alpha: checkAlpha });
      }
    }

    // Sparkle particles
    if (progress > 0.1 && progress < 0.8) {
      const particleProgress = (progress - 0.1) / 0.7;
      const particleAlpha =
        particleProgress < 0.5 ? 1 : 1 - (particleProgress - 0.5) / 0.5;

      for (const particle of particles) {
        if (particleProgress > particle.life) continue;

        const pProgress = particleProgress / particle.life;
        const distance = currentSize * 1.5 * pProgress * particle.speed;
        const px = x + Math.cos(particle.angle) * distance;
        const py = y + Math.sin(particle.angle) * distance;
        const pAlpha = particleAlpha * (1 - pProgress);

        g.circle(px, py, particle.size * (1 - pProgress * 0.5));
        g.fill({ color: SHIELD_COLOR_LIGHT, alpha: pAlpha * 0.8 });
      }
    }

    // Ripple effect
    if (progress > 0.2 && progress < 0.6) {
      const rippleProgress = (progress - 0.2) / 0.4;
      const rippleAlpha = 1 - rippleProgress;
      const rippleSize = currentSize * (1 + rippleProgress * 0.5);

      g.circle(x, y, rippleSize);
      g.stroke({ width: 1, color: SHIELD_COLOR, alpha: rippleAlpha * 0.4 });
    }
  });

  if (isComplete) return null;

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

/**
 * Batch renderer for multiple shield effects
 * More efficient when rendering many effects simultaneously
 */
export const VaccinationShieldBatch = memo(function VaccinationShieldBatch({
  effects,
}: {
  effects: Array<{
    id: string;
    x: number;
    y: number;
    startTime: number;
  }>;
}) {
  const graphicsRef = useRef<Graphics>(null);

  useTick(() => {
    if (!graphicsRef.current) return;

    const g = graphicsRef.current;
    g.clear();

    const now = Date.now();
    const duration = 1000;
    const size = 30;

    for (const effect of effects) {
      const elapsed = now - effect.startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) continue;

      const { x, y } = effect;
      const expandPhase = Math.min(progress * 3, 1);
      const fadePhase = progress > 0.3 ? (progress - 0.3) / 0.7 : 0;
      const alpha = 1 - fadePhase;
      const currentSize = size * (0.5 + expandPhase * 0.5);

      // Main shield ring
      g.circle(x, y, currentSize);
      g.stroke({ width: 2, color: SHIELD_COLOR, alpha: alpha * 0.7 });

      // Center point
      g.circle(x, y, 4);
      g.fill({ color: SHIELD_COLOR, alpha: alpha * 0.5 });
    }
  });

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

export default VaccinationShield;
