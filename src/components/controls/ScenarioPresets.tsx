/**
 * Scenario Presets Component
 *
 * Displays pre-built simulation scenarios as interactive cards allowing users to:
 * - Browse available scenarios with icons, names, and descriptions
 * - See expected outcomes for each scenario
 * - Quick load a scenario configuration
 * - View which scenario is currently active
 *
 * @module components/controls/ScenarioPresets
 */

'use client';

import { useCallback } from 'react';
import {
  TrendingUp,
  Shield,
  Search,
  Target,
  AlertTriangle,
  Check,
  Play,
  Info,
} from 'lucide-react';
import { useSimulationStore, SCENARIO_PRESETS } from '@/stores/simulation-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ScenarioPreset } from '@/types/simulation';

/**
 * Icon mapping for scenario presets
 */
const SCENARIO_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  shield: Shield,
  search: Search,
  target: Target,
  'alert-triangle': AlertTriangle,
};

/**
 * Color scheme mapping for scenarios
 */
const SCENARIO_COLORS: Record<string, {
  border: string;
  bg: string;
  text: string;
  badge: string;
}> = {
  'current-trajectory': {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  },
  'universal-bcg': {
    border: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  },
  'enhanced-screening': {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  },
  'who-elimination': {
    border: 'border-green-500/50',
    bg: 'bg-green-500/10',
    text: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-500/20 text-green-700 dark:text-green-400',
  },
  'no-intervention': {
    border: 'border-red-500/50',
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-500/20 text-red-700 dark:text-red-400',
  },
};

/**
 * Default color scheme for unknown scenarios
 */
const DEFAULT_COLORS = {
  border: 'border-primary/50',
  bg: 'bg-primary/10',
  text: 'text-primary',
  badge: 'bg-primary/20 text-primary',
};

/**
 * ScenarioCard - Individual scenario preset card
 */
function ScenarioCard({
  scenario,
  isSelected,
  isDisabled,
  onSelect,
}: {
  scenario: ScenarioPreset;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}) {
  const Icon = SCENARIO_ICONS[scenario.icon] ?? TrendingUp;
  const colors = SCENARIO_COLORS[scenario.id] ?? DEFAULT_COLORS;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        'relative w-full rounded-lg border-2 p-4 text-left transition-all',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isSelected
          ? cn(colors.border, colors.bg)
          : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
      )}
      aria-label={`Load ${scenario.name} scenario`}
      aria-pressed={isSelected}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3">
          <Badge
            variant="default"
            className="gap-1 text-xs"
          >
            <Check className="size-3" />
            Selected
          </Badge>
        </div>
      )}

      {/* Card Content */}
      <div className="space-y-3">
        {/* Icon and Title */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              isSelected ? colors.bg : 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'size-5',
                isSelected ? colors.text : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="flex-1 space-y-1 pr-16">
            <h4
              className={cn(
                'font-semibold',
                isSelected && colors.text
              )}
            >
              {scenario.name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {scenario.description}
            </p>
          </div>
        </div>

        {/* Expected Outcome */}
        <div
          className={cn(
            'rounded-md p-3 text-xs',
            isSelected ? 'bg-background/50' : 'bg-muted/50'
          )}
        >
          <div className="flex items-start gap-2">
            <Info className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">
                Expected Outcome
              </p>
              <p className="mt-1 text-foreground">{scenario.expectedOutcome}</p>
            </div>
          </div>
        </div>

        {/* Quick Load Button */}
        {!isSelected && (
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className="gap-1 cursor-pointer hover:bg-accent"
            >
              <Play className="size-3" />
              Load Scenario
            </Badge>
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * ScenarioComparison - Shows comparison between scenarios
 */
function ScenarioComparison({
  currentScenarioId,
}: {
  currentScenarioId: string;
}) {
  const scenarios = Object.values(SCENARIO_PRESETS);
  const currentIndex = scenarios.findIndex((s) => s.id === currentScenarioId);

  // Find neighboring scenarios for comparison hints
  const betterScenario =
    currentScenarioId === 'who-elimination'
      ? null
      : scenarios.find((s) => s.id === 'who-elimination');

  const worseScenario =
    currentScenarioId === 'no-intervention'
      ? null
      : scenarios.find((s) => s.id === 'no-intervention');

  if (!betterScenario && !worseScenario) return null;

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Compare with other scenarios:
      </p>
      <div className="flex flex-wrap gap-2">
        {betterScenario && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="gap-1 text-green-700 dark:text-green-400 border-green-500/50 cursor-help"
              >
                <Target className="size-3" />
                Best Case
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{betterScenario.name}: {betterScenario.expectedOutcome}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {worseScenario && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="gap-1 text-red-700 dark:text-red-400 border-red-500/50 cursor-help"
              >
                <AlertTriangle className="size-3" />
                Worst Case
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{worseScenario.name}: {worseScenario.expectedOutcome}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/**
 * ScenarioPresets Component
 *
 * Main component for displaying and selecting pre-built scenarios.
 * Connects to the simulation store to load scenario configurations.
 */
export function ScenarioPresets() {
  const config = useSimulationStore((state) => state.config);
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const status = useSimulationStore((state) => state.state.status);

  const isDisabled = status === 'running';

  // Determine currently selected scenario
  const currentScenarioId = Object.entries(SCENARIO_PRESETS).find(
    ([id, scenario]) => scenario.config.name === config.name
  )?.[0];

  /**
   * Handle scenario selection
   */
  const handleSelectScenario = useCallback(
    (scenarioId: string) => {
      if (!isDisabled) {
        loadScenario(scenarioId);
      }
    },
    [isDisabled, loadScenario]
  );

  const scenarios = Object.values(SCENARIO_PRESETS);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="size-5" />
          Scenario Presets
        </CardTitle>
        <CardDescription>
          Choose a pre-configured scenario or customize your own settings
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Disabled Warning */}
        {isDisabled && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/50 p-3">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Pause the simulation to change scenarios
            </p>
          </div>
        )}

        {/* Scenario Cards */}
        <div className="grid gap-3">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isSelected={currentScenarioId === scenario.id}
              isDisabled={isDisabled}
              onSelect={() => handleSelectScenario(scenario.id)}
            />
          ))}
        </div>

        {/* Custom Configuration Notice */}
        {!currentScenarioId && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="size-3" />
                Custom Configuration
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You are using a custom configuration. Select a preset above to
              reset to predefined settings, or continue customizing using the
              panels below.
            </p>
          </div>
        )}

        {/* Scenario Comparison */}
        {currentScenarioId && (
          <ScenarioComparison currentScenarioId={currentScenarioId} />
        )}

        {/* Reset to Custom Button */}
        {currentScenarioId && (
          <div className="flex justify-center pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Modify any parameter to switch to "custom" mode
                    // This will be handled by the parent component
                  }}
                  disabled={isDisabled}
                  className="text-muted-foreground"
                >
                  Customize this scenario...
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adjust parameters using the panels below</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ScenarioPresets;
