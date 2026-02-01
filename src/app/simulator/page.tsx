'use client';

/**
 * Simulator Page
 *
 * Main TB vaccination simulator interface.
 * Combines SEIR modeling with interactive visualization to demonstrate
 * the impact of vaccination policies on tuberculosis spread in the UK.
 *
 * Layout:
 * - Sidebar: Configuration panels (Scenarios, Population, Vaccination, Policy)
 * - Main: Visualization canvas and statistics dashboard
 * - Bottom: Timeline controls for simulation playback
 *
 * @module app/simulator/page
 */

import { useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Shield,
  Search,
  Target,
  AlertTriangle,
  Activity,
  Users,
  Heart,
  Skull,
  type LucideIcon,
} from 'lucide-react';

import { SimulatorLayout } from '@/components/layout/SimulatorLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

import {
  useSimulationStore,
  selectStatus,
  selectCurrentDay,
  selectCompartments,
  selectMetrics,
  selectSpeed,
  SCENARIO_PRESETS,
} from '@/stores/simulation-store';
import { useUIStore } from '@/stores/ui-store';

/**
 * Scenario icon mapping
 */
const SCENARIO_ICONS: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  shield: Shield,
  search: Search,
  target: Target,
  'alert-triangle': AlertTriangle,
};

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format rate per 100,000
 */
function formatRate(rate: number): string {
  return rate.toFixed(1);
}

/**
 * ScenarioPresetsPanel Component
 *
 * Quick scenario selection for common simulation configurations.
 */
function ScenarioPresetsPanel() {
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const configName = useSimulationStore((state) => state.config.name);

  const scenarios = Object.values(SCENARIO_PRESETS);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Scenarios</h3>
      <div className="grid grid-cols-1 gap-2">
        {scenarios.map((scenario) => {
          const IconComponent: LucideIcon =
            SCENARIO_ICONS[scenario.icon] ?? TrendingUp;
          const isActive = configName === scenario.config.name;

          return (
            <TooltipProvider key={scenario.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    className="h-auto w-full justify-start gap-3 p-3 text-left"
                    onClick={() => loadScenario(scenario.id)}
                  >
                    <IconComponent
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {scenario.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {scenario.description}
                      </p>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium">{scenario.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {scenario.description}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-xs">
                    <span className="font-medium">Expected outcome:</span>{' '}
                    {scenario.expectedOutcome}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

/**
 * PopulationPanel Component
 *
 * Display and configure population demographics.
 */
function PopulationPanel() {
  const config = useSimulationStore((state) => state.config);
  const setConfig = useSimulationStore((state) => state.setConfig);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Population</h3>
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Population
            </span>
            <span className="text-sm font-medium">
              {formatNumber(config.totalPopulation)}
            </span>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Imported Cases per Day
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[config.importedCasesPerDay]}
                min={0}
                max={50}
                step={1}
                className="flex-1"
                onValueChange={([value]) =>
                  setConfig({ importedCasesPerDay: value })
                }
              />
              <span className="w-8 text-right text-sm font-medium">
                {config.importedCasesPerDay}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Population Groups
            </Label>
            {config.populationGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{group.label}</span>
                <Badge variant="secondary">
                  {(group.proportion * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * VaccinationPanel Component
 *
 * Configure BCG vaccination policies.
 */
function VaccinationPanel() {
  const vaccinationPolicy = useSimulationStore(
    (state) => state.config.vaccinationPolicy
  );
  const setConfig = useSimulationStore((state) => state.setConfig);

  const handleNeonatalBCGToggle = useCallback(
    (enabled: boolean) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          neonatalBCG: {
            ...vaccinationPolicy.neonatalBCG,
            enabled,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  const handleNeonatalCoverageChange = useCallback(
    (value: number[]) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          neonatalBCG: {
            ...vaccinationPolicy.neonatalBCG,
            coverageTarget: value[0] / 100,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  const handleHealthcareToggle = useCallback(
    (enabled: boolean) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          healthcareWorkerBCG: {
            ...vaccinationPolicy.healthcareWorkerBCG,
            enabled,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  const handleScreeningToggle = useCallback(
    (enabled: boolean) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          immigrantScreening: {
            ...vaccinationPolicy.immigrantScreening,
            enabled,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Vaccination</h3>
      <Card>
        <CardContent className="space-y-4 p-4">
          {/* Neonatal BCG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="neonatal-bcg" className="text-sm font-medium">
                Neonatal BCG
              </Label>
              <Switch
                id="neonatal-bcg"
                checked={vaccinationPolicy.neonatalBCG.enabled}
                onCheckedChange={handleNeonatalBCGToggle}
              />
            </div>
            {vaccinationPolicy.neonatalBCG.enabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Coverage Target</span>
                  <span>
                    {(vaccinationPolicy.neonatalBCG.coverageTarget * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[vaccinationPolicy.neonatalBCG.coverageTarget * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={handleNeonatalCoverageChange}
                />
                <Badge variant="outline" className="text-xs">
                  {vaccinationPolicy.neonatalBCG.eligibilityCriteria}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Healthcare Worker BCG */}
          <div className="flex items-center justify-between">
            <Label htmlFor="hcw-bcg" className="text-sm font-medium">
              Healthcare Worker BCG
            </Label>
            <Switch
              id="hcw-bcg"
              checked={vaccinationPolicy.healthcareWorkerBCG.enabled}
              onCheckedChange={handleHealthcareToggle}
            />
          </div>

          <Separator />

          {/* Immigrant Screening */}
          <div className="flex items-center justify-between">
            <Label htmlFor="screening" className="text-sm font-medium">
              Immigrant Screening
            </Label>
            <Switch
              id="screening"
              checked={vaccinationPolicy.immigrantScreening.enabled}
              onCheckedChange={handleScreeningToggle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * PolicyPanel Component
 *
 * Configure active policy interventions.
 */
function PolicyPanel() {
  const interventions = useSimulationStore(
    (state) => state.config.activeInterventions
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Policy Interventions
      </h3>
      <Card>
        <CardContent className="space-y-3 p-4">
          {interventions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active interventions. Select a scenario or add custom policies.
            </p>
          ) : (
            interventions.map((intervention) => (
              <div
                key={intervention.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{intervention.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {intervention.description}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {((1 - intervention.effectOnR0) * 100).toFixed(0)}% R0
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ControlsSidebar Component
 *
 * Sidebar containing all configuration panels organized in tabs.
 */
function ControlsSidebar() {
  const sidebarTab = useUIStore((state) => state.sidebarTab);
  const setSidebarTab = useUIStore((state) => state.setSidebarTab);

  return (
    <div className="space-y-4">
      <Tabs
        value={sidebarTab}
        onValueChange={(value) =>
          setSidebarTab(value as typeof sidebarTab)
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios" className="text-xs">
            Scenarios
          </TabsTrigger>
          <TabsTrigger value="population" className="text-xs">
            Population
          </TabsTrigger>
          <TabsTrigger value="vaccination" className="text-xs">
            Vaccine
          </TabsTrigger>
          <TabsTrigger value="policy" className="text-xs">
            Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="mt-4">
          <ScenarioPresetsPanel />
        </TabsContent>

        <TabsContent value="population" className="mt-4">
          <PopulationPanel />
        </TabsContent>

        <TabsContent value="vaccination" className="mt-4">
          <VaccinationPanel />
        </TabsContent>

        <TabsContent value="policy" className="mt-4">
          <PolicyPanel />
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Run Simulation Button */}
      <SimulationControls />
    </div>
  );
}

/**
 * SimulationControls Component
 *
 * Play/pause/reset controls for simulation.
 */
function SimulationControls() {
  const status = useSimulationStore(selectStatus);
  const start = useSimulationStore((state) => state.start);
  const pause = useSimulationStore((state) => state.pause);
  const resume = useSimulationStore((state) => state.resume);
  const reset = useSimulationStore((state) => state.reset);

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      start();
    }
  }, [isRunning, isPaused, pause, resume, start]);

  return (
    <div className="flex gap-2">
      <Button
        onClick={handlePlayPause}
        className="flex-1"
        variant={isRunning ? 'secondary' : 'default'}
        disabled={isCompleted}
      >
        {isRunning ? (
          <>
            <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
            Pause
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" aria-hidden="true" />
            {isPaused ? 'Resume' : 'Start'}
          </>
        )}
      </Button>
      <Button variant="outline" size="icon" onClick={reset}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Reset simulation</span>
      </Button>
    </div>
  );
}

/**
 * StatsOverview Component
 *
 * Dashboard displaying key simulation statistics.
 */
function StatsOverview() {
  const compartments = useSimulationStore(selectCompartments);
  const metrics = useSimulationStore(selectMetrics);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* Active Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
          <Activity className="h-4 w-4 text-destructive" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatNumber(compartments.I)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRate(metrics.currentIncidenceRate)}/100k incidence
          </p>
        </CardContent>
      </Card>

      {/* Vaccinated */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vaccinated</CardTitle>
          <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatNumber(compartments.V)}
          </div>
          <p className="text-xs text-muted-foreground">
            +{formatNumber(metrics.totalVaccinated)} this simulation
          </p>
        </CardContent>
      </Card>

      {/* Recovered */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recovered</CardTitle>
          <Heart className="h-4 w-4 text-green-600" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(compartments.R)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(metrics.infectionsPrevented)} prevented
          </p>
        </CardContent>
      </Card>

      {/* Deaths */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deaths</CardTitle>
          <Skull className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(compartments.D)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(metrics.deathsPrevented)} prevented
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * SimulationVisualization Component
 *
 * Main visualization area showing the simulation canvas or map.
 * Placeholder implementation - will be replaced with PixiJS/D3 canvas.
 */
function SimulationVisualization() {
  const compartments = useSimulationStore(selectCompartments);
  const metrics = useSimulationStore(selectMetrics);
  const status = useSimulationStore(selectStatus);

  // Calculate total population for proportions
  const total =
    compartments.S +
    compartments.V +
    compartments.E_H +
    compartments.E_L +
    compartments.I +
    compartments.R;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Compartment Distribution</CardTitle>
          <Badge variant={status === 'running' ? 'default' : 'secondary'}>
            {status === 'running'
              ? 'Simulating...'
              : status === 'paused'
                ? 'Paused'
                : status === 'completed'
                  ? 'Completed'
                  : 'Ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* WHO Target Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">WHO Low-Incidence Target</span>
            <span className="font-medium">
              {metrics.lowIncidenceStatus ? (
                <Badge variant="default" className="bg-green-600">
                  On Track
                </Badge>
              ) : (
                <Badge variant="destructive">At Risk</Badge>
              )}
            </span>
          </div>
          <Progress
            value={Math.min(100, ((10 - metrics.currentIncidenceRate) / 10) * 100)}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            Current: {formatRate(metrics.currentIncidenceRate)}/100k | Target:
            &lt;10/100k
          </p>
        </div>

        <Separator />

        {/* Compartment Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Population Distribution</h4>

          {/* Susceptible */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Users className="h-3 w-3 text-blue-500" aria-hidden="true" />
                Susceptible
              </span>
              <span>{formatNumber(compartments.S)}</span>
            </div>
            <Progress
              value={(compartments.S / total) * 100}
              className="h-1.5 bg-blue-100"
            />
          </div>

          {/* Vaccinated */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" aria-hidden="true" />
                Vaccinated
              </span>
              <span>{formatNumber(compartments.V)}</span>
            </div>
            <Progress
              value={(compartments.V / total) * 100}
              className="h-1.5 bg-primary/20"
            />
          </div>

          {/* Exposed (combined) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle
                  className="h-3 w-3 text-yellow-500"
                  aria-hidden="true"
                />
                Latent TB
              </span>
              <span>{formatNumber(compartments.E_H + compartments.E_L)}</span>
            </div>
            <Progress
              value={((compartments.E_H + compartments.E_L) / total) * 100}
              className="h-1.5 bg-yellow-100"
            />
          </div>

          {/* Infectious */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Activity
                  className="h-3 w-3 text-destructive"
                  aria-hidden="true"
                />
                Infectious
              </span>
              <span>{formatNumber(compartments.I)}</span>
            </div>
            <Progress
              value={(compartments.I / total) * 100}
              className="h-1.5 bg-destructive/20"
            />
          </div>

          {/* Recovered */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-green-500" aria-hidden="true" />
                Recovered
              </span>
              <span>{formatNumber(compartments.R)}</span>
            </div>
            <Progress
              value={(compartments.R / total) * 100}
              className="h-1.5 bg-green-100"
            />
          </div>
        </div>

        {/* Effective R Number */}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Effective Reproduction Number (R)
          </span>
          <Badge
            variant={metrics.effectiveR > 1 ? 'destructive' : 'default'}
            className={metrics.effectiveR <= 1 ? 'bg-green-600' : ''}
          >
            R = {metrics.effectiveR.toFixed(2)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TimelineControl Component
 *
 * Simulation playback controls and timeline scrubber.
 */
function TimelineControl() {
  const currentDay = useSimulationStore(selectCurrentDay);
  const duration = useSimulationStore((state) => state.config.duration);
  const speed = useSimulationStore(selectSpeed);
  const status = useSimulationStore(selectStatus);
  const setSpeed = useSimulationStore((state) => state.setSpeed);
  const step = useSimulationStore((state) => state.step);

  const progressPercent = (currentDay / duration) * 100;
  const yearsElapsed = (currentDay / 365).toFixed(1);
  const totalYears = (duration / 365).toFixed(0);

  return (
    <div className="flex items-center gap-4">
      {/* Step Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={step}
              disabled={status === 'running' || status === 'completed'}
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Step forward one day</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Step +1 day</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Timeline Progress */}
      <div className="flex flex-1 items-center gap-3">
        <span className="text-xs text-muted-foreground">Day {currentDay}</span>
        <Progress value={progressPercent} className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {yearsElapsed} / {totalYears} years
        </span>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSpeed(speed / 2)}
          disabled={speed <= 0.25}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Decrease speed</span>
        </Button>
        <Badge variant="outline" className="min-w-12 justify-center">
          {speed}x
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSpeed(speed * 2)}
          disabled={speed >= 8}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Increase speed</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * SimulatorPage Component
 *
 * Main page component that assembles the simulator interface.
 */
export default function SimulatorPage() {
  const initialize = useSimulationStore((state) => state.initialize);

  // Initialize simulation on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SimulatorLayout
      sidebar={<ControlsSidebar />}
      bottomPanel={<TimelineControl />}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        {/* Main Visualization */}
        <div className="flex-1 min-h-0">
          <SimulationVisualization />
        </div>

        {/* Stats Dashboard */}
        <StatsOverview />
      </div>
    </SimulatorLayout>
  );
}
