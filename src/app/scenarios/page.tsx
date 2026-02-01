'use client';

/**
 * Scenarios Gallery Page
 *
 * Displays a grid of pre-built TB simulation scenarios for users to explore.
 * Features:
 * - Grid layout of scenario cards
 * - Each card shows scenario details and expected outcomes
 * - Click to launch scenario in simulator
 * - Comparison mode to select 2 scenarios for side-by-side analysis
 *
 * @module app/scenarios/page
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  ShieldCheck,
  Search,
  Target,
  AlertTriangle,
  Play,
  GitCompare,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRESET_SCENARIOS, type ScenarioId } from '@/lib/constants/scenarios';
import type { ScenarioPreset } from '@/types/simulation';

/**
 * Icon mapping for scenario visualization
 */
const SCENARIO_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  'shield-check': ShieldCheck,
  'search': Search,
  'target': Target,
  'alert-triangle': AlertTriangle,
};

/**
 * Get the appropriate badge variant based on scenario type
 */
function getScenarioBadgeVariant(
  scenarioId: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (scenarioId) {
    case 'who-elimination':
      return 'default';
    case 'universal-bcg':
    case 'enhanced-screening':
      return 'secondary';
    case 'no-intervention':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Get a descriptive label for the scenario category
 */
function getScenarioCategory(scenarioId: string): string {
  switch (scenarioId) {
    case 'current-trajectory':
      return 'Baseline';
    case 'universal-bcg':
      return 'Vaccination';
    case 'enhanced-screening':
      return 'Screening';
    case 'who-elimination':
      return 'Comprehensive';
    case 'no-intervention':
      return 'Worst Case';
    default:
      return 'Scenario';
  }
}

/**
 * Scenario Card Component
 *
 * Displays a single scenario with its details and actions
 */
interface ScenarioCardProps {
  scenario: ScenarioPreset;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
}

function ScenarioCard({
  scenario,
  isSelected,
  canSelect,
  onSelect,
  onDeselect,
}: ScenarioCardProps) {
  const IconComponent = SCENARIO_ICONS[scenario.icon] || TrendingUp;
  const badgeVariant = getScenarioBadgeVariant(scenario.id);
  const category = getScenarioCategory(scenario.id);

  return (
    <Card
      className={`flex flex-col transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? 'ring-2 ring-primary border-primary'
          : 'hover:border-primary/50'
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                scenario.id === 'no-intervention'
                  ? 'bg-destructive/10 text-destructive'
                  : scenario.id === 'who-elimination'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <IconComponent className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">{scenario.name}</CardTitle>
              <Badge variant={badgeVariant} className="mt-1">
                {category}
              </Badge>
            </div>
          </div>
          {isSelected && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeselect(scenario.id);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label={`Remove ${scenario.name} from comparison`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="text-sm mb-4">
          {scenario.description}
        </CardDescription>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Expected Outcome
          </p>
          <p className="text-sm">{scenario.expectedOutcome}</p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/scenarios/${scenario.id}`}>
            <Play className="h-4 w-4 mr-1" aria-hidden="true" />
            View Details
          </Link>
        </Button>
        {canSelect && !isSelected && (
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              onSelect(scenario.id);
            }}
            aria-label={`Add ${scenario.name} to comparison`}
          >
            <GitCompare className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Comparison Banner Component
 *
 * Displays selected scenarios for comparison and provides comparison action
 */
interface ComparisonBannerProps {
  selectedScenarios: string[];
  scenarios: ScenarioPreset[];
  onClear: () => void;
  onCompare: () => void;
}

function ComparisonBanner({
  selectedScenarios,
  scenarios,
  onClear,
  onCompare,
}: ComparisonBannerProps) {
  const selectedScenarioData = selectedScenarios
    .map((id) => scenarios.find((s) => s.id === id))
    .filter((s): s is ScenarioPreset => s !== undefined);

  if (selectedScenarios.length === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 mx-auto max-w-2xl">
      <div className="rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <GitCompare className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {selectedScenarioData.map((scenario, index) => (
                <span key={scenario.id} className="flex items-center gap-1">
                  <Badge variant="secondary" className="truncate max-w-[150px]">
                    {scenario.name}
                  </Badge>
                  {index === 0 && selectedScenarios.length === 2 && (
                    <span className="text-muted-foreground text-sm">vs</span>
                  )}
                </span>
              ))}
              {selectedScenarios.length === 1 && (
                <span className="text-muted-foreground text-sm">
                  Select one more scenario to compare
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              aria-label="Clear comparison selection"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={onCompare}
              disabled={selectedScenarios.length !== 2}
            >
              Compare
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Scenarios Page Component
 *
 * Main page displaying all pre-built scenarios in a responsive grid
 */
export default function ScenariosPage() {
  const router = useRouter();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  /**
   * Handle selecting a scenario for comparison
   */
  const handleSelectScenario = useCallback((scenarioId: string) => {
    setSelectedScenarios((prev) => {
      if (prev.includes(scenarioId)) {
        return prev;
      }
      if (prev.length >= 2) {
        // Replace the second selection
        return [prev[0], scenarioId];
      }
      return [...prev, scenarioId];
    });
  }, []);

  /**
   * Handle deselecting a scenario from comparison
   */
  const handleDeselectScenario = useCallback((scenarioId: string) => {
    setSelectedScenarios((prev) => prev.filter((id) => id !== scenarioId));
  }, []);

  /**
   * Clear all selected scenarios
   */
  const handleClearSelection = useCallback(() => {
    setSelectedScenarios([]);
  }, []);

  /**
   * Navigate to comparison view with selected scenarios
   */
  const handleCompare = useCallback(() => {
    if (selectedScenarios.length === 2) {
      const [first, second] = selectedScenarios;
      router.push(`/simulator?compare=${first},${second}`);
    }
  }, [router, selectedScenarios]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          TB Simulation Scenarios
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Explore pre-built scenarios to understand how different vaccination
          policies and interventions affect tuberculosis spread in the UK. Select
          any scenario to view details or compare two scenarios side by side.
        </p>
      </div>

      {/* Comparison Instructions */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <GitCompare className="h-4 w-4" aria-hidden="true" />
        <span>
          Click the <GitCompare className="h-3 w-3 inline mx-1" aria-hidden="true" />
          icon on any card to add it to a comparison (max 2 scenarios)
        </span>
      </div>

      {/* Scenarios Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-24">
        {PRESET_SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedScenarios.includes(scenario.id)}
            canSelect={selectedScenarios.length < 2}
            onSelect={handleSelectScenario}
            onDeselect={handleDeselectScenario}
          />
        ))}
      </div>

      {/* Comparison Banner */}
      <ComparisonBanner
        selectedScenarios={selectedScenarios}
        scenarios={PRESET_SCENARIOS}
        onClear={handleClearSelection}
        onCompare={handleCompare}
      />
    </main>
  );
}
