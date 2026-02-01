'use client';

/**
 * Scenario Detail Page
 *
 * Displays detailed information about a specific pre-built scenario including:
 * - Full scenario description
 * - Configuration details (vaccination policy, interventions)
 * - Launch simulation button
 * - Compare with other scenarios dropdown
 *
 * @module app/scenarios/[scenarioId]/page
 */

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import {
  TrendingUp,
  ShieldCheck,
  Search,
  Target,
  AlertTriangle,
  Play,
  GitCompare,
  ArrowLeft,
  Calendar,
  Users,
  Shield,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PRESET_SCENARIOS,
  getScenarioById,
  isValidScenarioId,
  type ScenarioId,
} from '@/lib/constants/scenarios';
import { useSimulationStore } from '@/stores/simulation-store';

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
 * Page props with dynamic route parameter
 */
interface ScenarioDetailPageProps {
  params: Promise<{
    scenarioId: string;
  }>;
}

/**
 * Configuration Detail Item Component
 */
interface ConfigItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  enabled?: boolean;
}

function ConfigItem({ label, value, icon, enabled }: ConfigItemProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="font-medium">{value}</p>
          {enabled !== undefined && (
            enabled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Enabled" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" aria-label="Disabled" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Intervention Card Component
 */
interface InterventionCardProps {
  name: string;
  description: string;
  effectOnR0: number;
}

function InterventionCard({ name, description, effectOnR0 }: InterventionCardProps) {
  const reductionPercent = Math.round((1 - effectOnR0) * 100);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm">{name}</h4>
        <Badge variant="secondary" className="shrink-0">
          -{reductionPercent}% R0
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * Scenario Detail Page Component
 */
export default function ScenarioDetailPage({ params }: ScenarioDetailPageProps) {
  const router = useRouter();
  const loadScenario = useSimulationStore((state) => state.loadScenario);

  // Unwrap the params promise using React.use()
  const { scenarioId } = use(params);

  // Validate and get scenario data
  const scenario = useMemo(() => {
    if (!isValidScenarioId(scenarioId)) {
      return null;
    }
    return getScenarioById(scenarioId);
  }, [scenarioId]);

  // Handle invalid scenario ID
  if (!scenario) {
    notFound();
  }

  const IconComponent = SCENARIO_ICONS[scenario.icon] || TrendingUp;
  const config = scenario.config;

  // Get other scenarios for comparison dropdown
  const otherScenarios = PRESET_SCENARIOS.filter((s) => s.id !== scenarioId);

  /**
   * Handle launching the simulation with this scenario
   */
  const handleLaunchSimulation = () => {
    loadScenario(scenarioId);
    router.push('/simulator');
  };

  /**
   * Handle comparing with another scenario
   */
  const handleCompareWith = (compareScenarioId: string) => {
    router.push(`/simulator?compare=${scenarioId},${compareScenarioId}`);
  };

  // Format duration in human-readable format
  const formatDuration = (days: number): string => {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (years === 0) {
      return `${remainingDays} days`;
    }
    if (remainingDays === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''} ${remainingDays} days`;
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Navigation */}
      <Link
        href="/scenarios"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Scenarios
      </Link>

      {/* Scenario Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-xl ${
              scenario.id === 'no-intervention'
                ? 'bg-destructive/10 text-destructive'
                : scenario.id === 'who-elimination'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            <IconComponent className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {scenario.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {scenario.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Select onValueChange={handleCompareWith}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <GitCompare className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Compare with..." />
            </SelectTrigger>
            <SelectContent>
              {otherScenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleLaunchSimulation} size="lg">
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Launch Simulation
          </Button>
        </div>
      </div>

      {/* Expected Outcome Card */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" aria-hidden="true" />
            Expected Outcome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{scenario.expectedOutcome}</p>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Simulation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simulation Settings</CardTitle>
            <CardDescription>
              Time and population parameters for this scenario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <ConfigItem
              label="Simulation Duration"
              value={formatDuration(config.duration || 3650)}
              icon={<Clock className="h-4 w-4" />}
            />
            <Separator />
            <ConfigItem
              label="Imported Cases per Day"
              value={`${config.importedCasesPerDay?.toFixed(1) || '4.5'} cases/day`}
              icon={<Users className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Vaccination Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vaccination Policy</CardTitle>
            <CardDescription>
              BCG vaccination coverage and eligibility settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {config.vaccinationPolicy && (
              <>
                <ConfigItem
                  label="Neonatal BCG"
                  value={
                    config.vaccinationPolicy.neonatalBCG.eligibilityCriteria === 'none'
                      ? 'Disabled'
                      : `${(config.vaccinationPolicy.neonatalBCG.coverageTarget * 100).toFixed(0)}% (${config.vaccinationPolicy.neonatalBCG.eligibilityCriteria})`
                  }
                  icon={<Shield className="h-4 w-4" />}
                  enabled={config.vaccinationPolicy.neonatalBCG.enabled}
                />
                <Separator />
                <ConfigItem
                  label="Healthcare Worker BCG"
                  value={
                    config.vaccinationPolicy.healthcareWorkerBCG.enabled
                      ? `${(config.vaccinationPolicy.healthcareWorkerBCG.coverageTarget * 100).toFixed(0)}% coverage`
                      : 'Disabled'
                  }
                  icon={<Stethoscope className="h-4 w-4" />}
                  enabled={config.vaccinationPolicy.healthcareWorkerBCG.enabled}
                />
                <Separator />
                <ConfigItem
                  label="Immigrant Screening"
                  value={
                    config.vaccinationPolicy.immigrantScreening.enabled
                      ? `>${config.vaccinationPolicy.immigrantScreening.screeningCountryThreshold}/100k threshold`
                      : 'Disabled'
                  }
                  icon={<Search className="h-4 w-4" />}
                  enabled={config.vaccinationPolicy.immigrantScreening.enabled}
                />
                <Separator />
                <ConfigItem
                  label="Catch-up Vaccination"
                  value={
                    config.vaccinationPolicy.catchUpVaccination.enabled
                      ? `Ages ${config.vaccinationPolicy.catchUpVaccination.targetAgeGroup[0]}-${config.vaccinationPolicy.catchUpVaccination.targetAgeGroup[1]}, ${(config.vaccinationPolicy.catchUpVaccination.coverageTarget * 100).toFixed(0)}% coverage`
                      : 'Disabled'
                  }
                  icon={<Calendar className="h-4 w-4" />}
                  enabled={config.vaccinationPolicy.catchUpVaccination.enabled}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Interventions */}
      {config.activeInterventions && config.activeInterventions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Active Interventions</CardTitle>
            <CardDescription>
              Policy interventions included in this scenario ({config.activeInterventions.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {config.activeInterventions.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  name={intervention.name}
                  description={intervention.description}
                  effectOnR0={intervention.effectOnR0}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Interventions Message */}
      {(!config.activeInterventions || config.activeInterventions.length === 0) && (
        <Card className="mt-6 border-muted">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
            <p className="text-muted-foreground">
              {scenario.id === 'no-intervention'
                ? 'This scenario simulates the removal of all TB control interventions to demonstrate worst-case outcomes.'
                : 'No additional interventions configured for this scenario.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Launch CTA */}
      <div className="mt-10 p-6 rounded-lg bg-muted/50 text-center">
        <h2 className="text-xl font-semibold mb-2">Ready to explore this scenario?</h2>
        <p className="text-muted-foreground mb-4">
          Launch the simulation to see how these policies affect TB transmission in the UK over time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleLaunchSimulation} size="lg">
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Launch Simulation
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/scenarios">
              View All Scenarios
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
