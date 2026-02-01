/**
 * Vaccination Panel Component
 *
 * Allows users to configure BCG vaccination policies for the TB simulation including:
 * - BCG coverage rate (0-100%)
 * - Eligibility criteria toggle (Universal vs Risk-based)
 * - Risk threshold for high-incidence countries
 * - Healthcare worker BCG toggle
 * - Catch-up vaccination program toggle
 *
 * @module components/controls/VaccinationPanel
 */

'use client';

import { useCallback } from 'react';
import { Syringe, Shield, AlertTriangle, Info, Users, Baby } from 'lucide-react';
import { useSimulationStore, selectVaccinationPolicy } from '@/stores/simulation-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatPercent, formatNumber } from '@/lib/utils';
import type { VaccinationPolicy } from '@/types/simulation';

/**
 * InfoTooltip - Reusable tooltip for information icons
 */
function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="More information"
        >
          <Info className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * SliderWithValue - Slider with current value display
 */
function SliderWithValue({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  tooltip,
  disabled = false,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  tooltip?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className={cn(disabled && 'opacity-50')}>
            {label}
          </Label>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {formatValue(value)}
        </Badge>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        disabled={disabled}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
      />
    </div>
  );
}

/**
 * ToggleSwitch - Switch with label and description
 */
function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  icon: Icon,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="flex gap-3">
        {Icon && (
          <div className="mt-0.5">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-1">
          <Label
            htmlFor={id}
            className={cn(
              'text-sm font-medium cursor-pointer',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

/**
 * VaccinationMetrics - Display current vaccination statistics
 */
function VaccinationMetrics({
  policy,
  totalPopulation,
}: {
  policy: VaccinationPolicy;
  totalPopulation: number;
}) {
  // Calculate estimated vaccinated population
  const neonatalVaccinated = policy.neonatalBCG.enabled
    ? Math.round(totalPopulation * 0.012 * policy.neonatalBCG.coverageTarget) // ~1.2% births
    : 0;

  const healthcareWorkerVaccinated = policy.healthcareWorkerBCG.enabled
    ? Math.round(totalPopulation * 0.022 * policy.healthcareWorkerBCG.coverageTarget)
    : 0;

  const catchUpVaccinated = policy.catchUpVaccination.enabled
    ? Math.round(
        totalPopulation * 0.15 * policy.catchUpVaccination.coverageTarget
      ) // ~15% eligible
    : 0;

  const totalVaccinated =
    neonatalVaccinated + healthcareWorkerVaccinated + catchUpVaccinated;
  const coveragePercent = (totalVaccinated / totalPopulation) * 100;

  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Syringe className="size-4" />
          Current Vaccination Metrics
        </h4>
        <Badge
          variant={coveragePercent > 50 ? 'default' : 'secondary'}
          className="font-mono"
        >
          {formatPercent(coveragePercent / 100, 1)} coverage
        </Badge>
      </div>

      <Progress value={coveragePercent} className="h-2" aria-label="Overall vaccination coverage" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Annual Neonatal</p>
          <p className="font-semibold">{formatNumber(neonatalVaccinated)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Healthcare Workers</p>
          <p className="font-semibold">{formatNumber(healthcareWorkerVaccinated)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Catch-up Program</p>
          <p className="font-semibold">{formatNumber(catchUpVaccinated)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Protected</p>
          <p className="font-semibold">{formatNumber(totalVaccinated)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * VaccinationPanel Component
 *
 * Main control panel for configuring BCG vaccination policies.
 * Connects to the simulation store to update configuration in real-time.
 */
export function VaccinationPanel() {
  const config = useSimulationStore((state) => state.config);
  const vaccinationPolicy = useSimulationStore(selectVaccinationPolicy);
  const setConfig = useSimulationStore((state) => state.setConfig);
  const status = useSimulationStore((state) => state.state.status);

  const isDisabled = status === 'running';

  /**
   * Update neonatal BCG settings
   */
  const updateNeonatalBCG = useCallback(
    (updates: Partial<VaccinationPolicy['neonatalBCG']>) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          neonatalBCG: {
            ...vaccinationPolicy.neonatalBCG,
            ...updates,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  /**
   * Update healthcare worker BCG settings
   */
  const updateHealthcareWorkerBCG = useCallback(
    (updates: Partial<VaccinationPolicy['healthcareWorkerBCG']>) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          healthcareWorkerBCG: {
            ...vaccinationPolicy.healthcareWorkerBCG,
            ...updates,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  /**
   * Update catch-up vaccination settings
   */
  const updateCatchUpVaccination = useCallback(
    (updates: Partial<VaccinationPolicy['catchUpVaccination']>) => {
      setConfig({
        vaccinationPolicy: {
          ...vaccinationPolicy,
          catchUpVaccination: {
            ...vaccinationPolicy.catchUpVaccination,
            ...updates,
          },
        },
      });
    },
    [vaccinationPolicy, setConfig]
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="size-5" />
          Vaccination Policy
        </CardTitle>
        <CardDescription>
          Configure BCG vaccination coverage and eligibility criteria
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Neonatal BCG Section */}
        <div className="space-y-4">
          <ToggleSwitch
            id="neonatal-bcg-enabled"
            label="Neonatal BCG Program"
            description="BCG vaccination for newborns"
            checked={vaccinationPolicy.neonatalBCG.enabled}
            onCheckedChange={(enabled) => updateNeonatalBCG({ enabled })}
            disabled={isDisabled}
            icon={Baby}
          />

          {vaccinationPolicy.neonatalBCG.enabled && (
            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
              {/* Coverage Target */}
              <SliderWithValue
                id="neonatal-coverage"
                label="Coverage Target"
                value={vaccinationPolicy.neonatalBCG.coverageTarget}
                min={0}
                max={1}
                step={0.01}
                onChange={(coverageTarget) =>
                  updateNeonatalBCG({ coverageTarget })
                }
                formatValue={(v) => formatPercent(v, 0)}
                tooltip="Target percentage of eligible newborns to vaccinate"
                disabled={isDisabled}
              />

              {/* Eligibility Criteria */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="eligibility-criteria">
                    Eligibility Criteria
                  </Label>
                  <InfoTooltip content="Universal: All newborns. Risk-based: Only newborns with parents from high-incidence countries." />
                </div>
                <Select
                  value={vaccinationPolicy.neonatalBCG.eligibilityCriteria}
                  onValueChange={(value) =>
                    updateNeonatalBCG({
                      eligibilityCriteria: value as
                        | 'universal'
                        | 'risk-based'
                        | 'none',
                    })
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger
                    id="eligibility-criteria"
                    className="w-full"
                    aria-label="Select eligibility criteria"
                  >
                    <SelectValue placeholder="Select eligibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universal">
                      <div className="flex items-center gap-2">
                        <Users className="size-4" />
                        Universal (All newborns)
                      </div>
                    </SelectItem>
                    <SelectItem value="risk-based">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        Risk-based (High-incidence only)
                      </div>
                    </SelectItem>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        None (Program suspended)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Threshold */}
              {vaccinationPolicy.neonatalBCG.eligibilityCriteria ===
                'risk-based' && (
                <SliderWithValue
                  id="risk-threshold"
                  label="Risk Threshold"
                  value={vaccinationPolicy.neonatalBCG.riskBasedThreshold}
                  min={10}
                  max={200}
                  step={5}
                  onChange={(riskBasedThreshold) =>
                    updateNeonatalBCG({ riskBasedThreshold })
                  }
                  formatValue={(v) => `>${v}/100k`}
                  tooltip="Countries with TB incidence above this threshold are considered high-risk"
                  disabled={isDisabled}
                />
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Healthcare Worker BCG Section */}
        <div className="space-y-4">
          <ToggleSwitch
            id="healthcare-bcg-enabled"
            label="Healthcare Worker BCG"
            description="BCG vaccination for NHS and care workers"
            checked={vaccinationPolicy.healthcareWorkerBCG.enabled}
            onCheckedChange={(enabled) =>
              updateHealthcareWorkerBCG({ enabled })
            }
            disabled={isDisabled}
            icon={Syringe}
          />

          {vaccinationPolicy.healthcareWorkerBCG.enabled && (
            <div className="ml-4 border-l-2 border-muted pl-4">
              <SliderWithValue
                id="healthcare-coverage"
                label="Coverage Target"
                value={vaccinationPolicy.healthcareWorkerBCG.coverageTarget}
                min={0}
                max={1}
                step={0.01}
                onChange={(coverageTarget) =>
                  updateHealthcareWorkerBCG({ coverageTarget })
                }
                formatValue={(v) => formatPercent(v, 0)}
                tooltip="Target percentage of healthcare workers to vaccinate"
                disabled={isDisabled}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Catch-up Vaccination Section */}
        <div className="space-y-4">
          <ToggleSwitch
            id="catchup-enabled"
            label="Catch-up Vaccination Program"
            description="Vaccinate unvaccinated children and adolescents"
            checked={vaccinationPolicy.catchUpVaccination.enabled}
            onCheckedChange={(enabled) => updateCatchUpVaccination({ enabled })}
            disabled={isDisabled}
            icon={Users}
          />

          {vaccinationPolicy.catchUpVaccination.enabled && (
            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
              <SliderWithValue
                id="catchup-coverage"
                label="Coverage Target"
                value={vaccinationPolicy.catchUpVaccination.coverageTarget}
                min={0}
                max={1}
                step={0.01}
                onChange={(coverageTarget) =>
                  updateCatchUpVaccination({ coverageTarget })
                }
                formatValue={(v) => formatPercent(v, 0)}
                tooltip="Target percentage of eligible population for catch-up"
                disabled={isDisabled}
              />

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Target Age Range</p>
                <p className="text-xs text-muted-foreground">
                  Ages{' '}
                  {vaccinationPolicy.catchUpVaccination.targetAgeGroup[0]} to{' '}
                  {vaccinationPolicy.catchUpVaccination.targetAgeGroup[1]} years
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Vaccination Metrics Display */}
        <VaccinationMetrics
          policy={vaccinationPolicy}
          totalPopulation={config.totalPopulation}
        />
      </CardContent>
    </Card>
  );
}

export default VaccinationPanel;
