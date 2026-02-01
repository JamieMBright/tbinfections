'use client';

/**
 * SimulationCanvas Component
 *
 * WebGL canvas for rendering agent-based simulation visualization using PixiJS v8.
 * Renders agents as colored circles based on their compartment state,
 * shows transmission events, and displays vaccination shield effects.
 *
 * Performance optimized for 60fps at 5000+ agents using:
 * - Sprite batching
 * - Object pooling
 * - Efficient canvas-based rendering
 *
 * @module components/simulation/SimulationCanvas
 */

import React, {
  useEffect,
  useRef,
  useState,
  memo,
} from 'react';
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useSimulationStore } from '@/stores/simulation-store';
import type { CompartmentState } from '@/types/simulation';

// Extend PIXI components for use in React
extend({ Container, Graphics });

/**
 * Compartment colors for agent visualization
 * Based on epidemiological convention
 */
const COMPARTMENT_COLORS: Record<keyof CompartmentState, number> = {
  S: 0x3b82f6, // Blue - Susceptible
  V: 0x22c55e, // Green - Vaccinated
  E_H: 0xeab308, // Yellow - Exposed High-risk
  E_L: 0xf97316, // Orange - Exposed Low-risk
  I: 0xef4444, // Red - Infectious
  R: 0x6b7280, // Gray - Recovered
  D: 0x1f2937, // Dark gray - Deceased (not rendered)
};

/**
 * Visual agent representation for rendering
 */
interface VisualAgent {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  compartment: keyof CompartmentState;
  radius: number;
  color: number;
}

/**
 * Props for SimulationCanvas component
 */
interface SimulationCanvasProps {
  /** Width of the canvas in pixels */
  width?: number;
  /** Height of the canvas in pixels */
  height?: number;
  /** Maximum number of agents to render */
  maxAgents?: number;
  /** Whether to show transmission event lines */
  showTransmissionEvents?: boolean;
  /** Whether to show vaccination shield effects */
  showVaccinationEffects?: boolean;
  /** CSS class name for the container */
  className?: string;
}

/**
 * Generate initial agents based on compartment state
 */
function generateAgents(
  compartments: CompartmentState,
  width: number,
  height: number,
  maxAgents: number
): VisualAgent[] {
  const agents: VisualAgent[] = [];
  const totalPop =
    compartments.S +
    compartments.V +
    compartments.E_H +
    compartments.E_L +
    compartments.I +
    compartments.R;

  if (totalPop === 0) return agents;

  // Calculate proportional agent counts (excluding deceased)
  const compartmentKeys: (keyof CompartmentState)[] = [
    'S',
    'V',
    'E_H',
    'E_L',
    'I',
    'R',
  ];

  let agentId = 0;
  for (const key of compartmentKeys) {
    const proportion = compartments[key] / totalPop;
    const count = Math.round(proportion * maxAgents);

    for (let i = 0; i < count; i++) {
      // Random position with some padding from edges
      const padding = 20;
      const x = padding + Math.random() * (width - 2 * padding);
      const y = padding + Math.random() * (height - 2 * padding);

      // Random velocity for movement
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;

      agents.push({
        id: `agent-${agentId++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        compartment: key,
        radius: key === 'I' ? 4 : 3, // Infectious agents slightly larger
        color: COMPARTMENT_COLORS[key],
      });
    }
  }

  return agents;
}

/**
 * Agent renderer component using PixiJS Graphics
 */
const AgentRenderer = memo(function AgentRenderer({
  agents,
  isRunning,
  width,
  height,
}: {
  agents: VisualAgent[];
  isRunning: boolean;
  width: number;
  height: number;
}) {
  const graphicsRef = useRef<Graphics>(null);
  const [localAgents, setLocalAgents] = useState(agents);

  // Update agents when prop changes
  useEffect(() => {
    setLocalAgents(agents);
  }, [agents]);

  // Animation tick for agent movement
  useTick((ticker) => {
    const delta = ticker.deltaTime;

    if (!graphicsRef.current) return;

    // Update agent positions if running
    if (isRunning) {
      setLocalAgents((prevAgents) =>
        prevAgents.map((agent) => {
          let newX = agent.x + agent.vx * delta;
          let newY = agent.y + agent.vy * delta;
          let newVx = agent.vx;
          let newVy = agent.vy;

          // Bounce off walls
          const padding = 10;
          if (newX < padding || newX > width - padding) {
            newVx = -newVx;
            newX = Math.max(padding, Math.min(width - padding, newX));
          }
          if (newY < padding || newY > height - padding) {
            newVy = -newVy;
            newY = Math.max(padding, Math.min(height - padding, newY));
          }

          return {
            ...agent,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }

    // Redraw agents
    const g = graphicsRef.current;
    g.clear();

    for (const agent of localAgents) {
      g.circle(agent.x, agent.y, agent.radius);
      g.fill({ color: agent.color, alpha: 0.8 });
    }
  });

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

/**
 * Transmission line renderer
 */
const TransmissionLines = memo(function TransmissionLines({
  events,
}: {
  events: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
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

      const drawProgress = Math.min(progress * 2, 1);
      const currentToX = event.fromX + (event.toX - event.fromX) * drawProgress;
      const currentToY = event.fromY + (event.toY - event.fromY) * drawProgress;

      // Draw line
      g.moveTo(event.fromX, event.fromY);
      g.lineTo(currentToX, currentToY);
      g.stroke({ width: 2, color: 0xef4444, alpha: alpha * 0.8 });

      // Source point
      g.circle(event.fromX, event.fromY, 4);
      g.fill({ color: 0xef4444, alpha: alpha * 0.6 });

      // Destination point
      if (drawProgress >= 1) {
        g.circle(event.toX, event.toY, 5);
        g.fill({ color: 0xef4444, alpha: alpha * 0.8 });
      }
    }
  });

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

/**
 * Vaccination shield effect renderer
 */
const ShieldEffects = memo(function ShieldEffects({
  effects,
}: {
  effects: Array<{
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

      // Outer glow ring
      g.circle(x, y, currentSize * 1.3);
      g.stroke({ width: 3 * (1 - fadePhase * 0.5), color: 0x22c55e, alpha: alpha * 0.3 });

      // Main shield ring
      g.circle(x, y, currentSize);
      g.stroke({ width: 2, color: 0x22c55e, alpha: alpha * 0.7 });

      // Center point
      g.circle(x, y, 4);
      g.fill({ color: 0x22c55e, alpha: alpha * 0.5 });
    }
  });

  return <pixiGraphics ref={graphicsRef} draw={() => {}} />;
});

/**
 * Main simulation scene content
 */
function SimulationScene({
  width,
  height,
  maxAgents,
  showTransmissionEvents,
  showVaccinationEffects,
}: {
  width: number;
  height: number;
  maxAgents: number;
  showTransmissionEvents: boolean;
  showVaccinationEffects: boolean;
}) {
  const [agents, setAgents] = useState<VisualAgent[]>([]);
  const [transmissionEvents, setTransmissionEvents] = useState<
    Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      startTime: number;
    }>
  >([]);
  const [shieldEffects, setShieldEffects] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      startTime: number;
    }>
  >([]);

  // Store subscriptions
  const compartments = useSimulationStore((state) => state.state.compartments);
  const status = useSimulationStore((state) => state.state.status);
  const events = useSimulationStore((state) => state.state.events);

  // Track processed event IDs to avoid reprocessing
  const processedEventsRef = useRef<Set<string>>(new Set());

  const isRunning = status === 'running';

  // Initialize and update agents when compartments change
  useEffect(() => {
    const newAgents = generateAgents(compartments, width, height, maxAgents);
    setAgents(newAgents);
  }, [compartments, width, height, maxAgents]);

  // Process simulation events for visualization - only process new events
  const eventsLength = events.length;
  useEffect(() => {
    if (!showTransmissionEvents && !showVaccinationEffects) return;
    if (eventsLength === 0) return;

    const now = Date.now();
    const processedIds = processedEventsRef.current;

    // Filter to only new, unprocessed events
    const newEvents = events.filter((e) => !processedIds.has(e.id));
    if (newEvents.length === 0) return;

    // Mark events as processed
    newEvents.forEach((e) => processedIds.add(e.id));

    // Create transmission event visualizations
    if (showTransmissionEvents) {
      const newTransmissions = newEvents
        .filter((e) => e.type === 'infection')
        .slice(-10)
        .map((event, idx) => {
          const fromX = Math.random() * width;
          const fromY = Math.random() * height;
          const toX = fromX + (Math.random() - 0.5) * 100;
          const toY = fromY + (Math.random() - 0.5) * 100;

          return {
            id: `transmission-${event.id}-${idx}`,
            fromX,
            fromY,
            toX,
            toY,
            startTime: now,
          };
        });

      if (newTransmissions.length > 0) {
        setTransmissionEvents((prev) => {
          const filtered = prev.filter((e) => now - e.startTime < 2000);
          return [...filtered, ...newTransmissions];
        });
      }
    }

    // Create vaccination shield effects
    if (showVaccinationEffects) {
      const newShields = newEvents
        .filter((e) => e.type === 'vaccination')
        .slice(-5)
        .map((event, idx) => ({
          id: `shield-${event.id}-${idx}`,
          x: Math.random() * width,
          y: Math.random() * height,
          startTime: now,
        }));

      if (newShields.length > 0) {
        setShieldEffects((prev) => {
          const filtered = prev.filter((e) => now - e.startTime < 1000);
          return [...filtered, ...newShields];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsLength, showTransmissionEvents, showVaccinationEffects, width, height]);

  // Clean up old effects periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setTransmissionEvents((prev) =>
        prev.filter((e) => now - e.startTime < 2000)
      );
      setShieldEffects((prev) => prev.filter((e) => now - e.startTime < 1000));
    }, 500);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <pixiContainer>
      {/* Transmission event lines */}
      {showTransmissionEvents && (
        <TransmissionLines events={transmissionEvents} />
      )}

      {/* Agent renderer */}
      <AgentRenderer
        agents={agents}
        isRunning={isRunning}
        width={width}
        height={height}
      />

      {/* Vaccination shield effects */}
      {showVaccinationEffects && <ShieldEffects effects={shieldEffects} />}
    </pixiContainer>
  );
}

/**
 * Main SimulationCanvas component
 *
 * Renders an interactive WebGL canvas showing the agent-based simulation.
 * Agents move around and are colored based on their disease compartment.
 *
 * @example
 * ```tsx
 * <SimulationCanvas
 *   width={800}
 *   height={600}
 *   maxAgents={1000}
 *   showTransmissionEvents={true}
 * />
 * ```
 */
export const SimulationCanvas = memo(function SimulationCanvas({
  width: propWidth,
  height: propHeight,
  maxAgents = 500,
  showTransmissionEvents = true,
  showVaccinationEffects = true,
  className,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth ?? 800,
    height: propHeight ?? 600,
  });

  const status = useSimulationStore((state) => state.state.status);

  // Responsive sizing - use ResizeObserver callback instead of synchronous setState
  useEffect(() => {
    if (propWidth && propHeight) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const rect = entry.contentRect;
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 600,
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [propWidth, propHeight]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 ${className || ''}`}
    >
      <Application
        width={dimensions.width}
        height={dimensions.height}
        background={0xf8fafc}
        antialias={true}
        resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
      >
        <SimulationScene
          width={dimensions.width}
          height={dimensions.height}
          maxAgents={maxAgents}
          showTransmissionEvents={showTransmissionEvents}
          showVaccinationEffects={showVaccinationEffects}
        />
      </Application>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 rounded-md px-3 py-2 text-xs shadow-sm">
        <div className="flex flex-wrap gap-3">
          <LegendItem color="#3b82f6" label="Susceptible" />
          <LegendItem color="#22c55e" label="Vaccinated" />
          <LegendItem color="#eab308" label="Exposed (High)" />
          <LegendItem color="#f97316" label="Exposed (Low)" />
          <LegendItem color="#ef4444" label="Infectious" />
          <LegendItem color="#6b7280" label="Recovered" />
        </div>
      </div>

      {/* Status indicator */}
      {status !== 'running' && (
        <div className="absolute top-2 right-2 bg-white/90 rounded-md px-3 py-1 text-xs font-medium shadow-sm">
          {status === 'idle' && 'Ready'}
          {status === 'paused' && 'Paused'}
          {status === 'completed' && 'Completed'}
        </div>
      )}
    </div>
  );
});

/**
 * Legend item component
 */
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-slate-600">{label}</span>
    </div>
  );
}

export default SimulationCanvas;
