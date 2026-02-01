/**
 * Policy Panel Component
 *
 * Allows users to configure TB control policy interventions including:
 * - Pre-entry screening
 * - Active case finding
 * - Contact tracing
 * - Directly Observed Therapy (DOTS)
 * - Latent TB treatment
 *
 * Each intervention can be toggled on/off and has configurable parameters
 * and timeline (start/end days).
 *
 * @module components/controls/PolicyPanel
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
  FileSearch,
  Users,
  Link,
  Eye,
  Pill,
  Info,
  Calendar,
  Settings2,
} from 'lucide-react';
import { useSimulationStore, selectActiveInterventions } from '@/stores/simulation-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, formatPercent } from '@/lib/utils';
import type { PolicyIntervention, PolicyType } from '@/types/simulation';

/**
 * Policy intervention configuration
 */
interface PolicyConfig {
  id: string;
  type: PolicyType;
  name: string;
  shortName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultParams: Record<string, number | boolean | string>;
  parameterConfigs: Array<{
    key: string;
    label: string;
    type: 'slider' | 'toggle';
    min?: number;
    max?: number;
    step?: number;
    formatValue?: (v: number) => string;
    tooltip?: string;
  }>;
  defaultEffectOnR0: number;
}

/**
 * Available policy interventions with their configurations
 */
const POLICY_CONFIGS: PolicyConfig[] = [
  {
    id: 'pre-entry-screening',
    type: 'pre_entry_screening',
    name: 'Pre-Entry TB Screening',
    shortName: 'Pre-Entry',
    description: 'Mandatory TB screening for visa applicants from high-incidence countries',
    icon: FileSearch,
    defaultParams: {
      coverage: 0.85,
      sensitivity: 0.75,
    },
    parameterConfigs: [
      {
        key: 'coverage',
        label: 'Coverage Rate',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Percentage of eligible visa applicants screened',
      },
      {
        key: 'sensitivity',
        label: 'Test Sensitivity',
        type: 'slider',
        min: 0.5,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Probability of detecting active TB if present',
      },
    ],
    defaultEffectOnR0: 0.85,
  },
  {
    id: 'active-case-finding',
    type: 'active_case_finding',
    name: 'Active Case Finding',
    shortName: 'ACF',
    description: 'Proactive TB screening in high-risk communities and populations',
    icon: Users,
    defaultParams: {
      coverage: 0.65,
      targetHighRisk: true,
    },
    parameterConfigs: [
      {
        key: 'coverage',
        label: 'Population Coverage',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Percentage of high-risk population reached',
      },
    ],
    defaultEffectOnR0: 0.80,
  },
  {
    id: 'contact-tracing',
    type: 'contact_tracing',
    name: 'Contact Tracing',
    shortName: 'Tracing',
    description: 'Systematic investigation of contacts of confirmed TB cases',
    icon: Link,
    defaultParams: {
      contactsPerCase: 8,
      completionRate: 0.75,
    },
    parameterConfigs: [
      {
        key: 'contactsPerCase',
        label: 'Contacts per Case',
        type: 'slider',
        min: 2,
        max: 20,
        step: 1,
        formatValue: (v) => `${v} contacts`,
        tooltip: 'Average number of contacts traced per confirmed case',
      },
      {
        key: 'completionRate',
        label: 'Completion Rate',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Percentage of contacts successfully traced and evaluated',
      },
    ],
    defaultEffectOnR0: 0.85,
  },
  {
    id: 'dots',
    type: 'directly_observed_therapy',
    name: 'Directly Observed Therapy (DOTS)',
    shortName: 'DOTS',
    description: 'Supervised treatment to ensure medication adherence',
    icon: Eye,
    defaultParams: {
      adherenceRate: 0.90,
      treatmentCompletionRate: 0.85,
    },
    parameterConfigs: [
      {
        key: 'adherenceRate',
        label: 'Adherence Rate',
        type: 'slider',
        min: 0.5,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Percentage of patients adhering to treatment protocol',
      },
      {
        key: 'treatmentCompletionRate',
        label: 'Treatment Completion',
        type: 'slider',
        min: 0.5,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Percentage of patients completing full treatment course',
      },
    ],
    defaultEffectOnR0: 0.75,
  },
  {
    id: 'latent-tb-treatment',
    type: 'latent_tb_treatment',
    name: 'Latent TB Treatment',
    shortName: 'LTBI Rx',
    description: 'Preventive treatment for individuals with latent TB infection',
    icon: Pill,
    defaultParams: {
      coverage: 0.50,
      efficacy: 0.85,
    },
    parameterConfigs: [
      {
        key: 'coverage',
        label: 'Treatment Coverage',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Percentage of diagnosed LTBI cases offered treatment',
      },
      {
        key: 'efficacy',
        label: 'Treatment Efficacy',
        type: 'slider',
        min: 0.5,
        max: 1,
        step: 0.05,
        formatValue: (v) => formatPercent(v, 0),
        tooltip: 'Probability of preventing progression to active TB',
      },
    ],
    defaultEffectOnR0: 0.70,
  },
];

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
 * PolicyCard - Individual policy intervention card with toggle and parameters
 */
function PolicyCard({
  config,
  intervention,
  onToggle,
  onUpdateParams,
  onUpdateTimeline,
  disabled,
  simulationDuration,
}: {
  config: PolicyConfig;
  intervention: PolicyIntervention | undefined;
  onToggle: (enabled: boolean) => void;
  onUpdateParams: (params: Record<string, number | boolean | string>) => void;
  onUpdateTimeline: (startDay: number, endDay?: number) => void;
  disabled: boolean;
  simulationDuration: number;
}) {
  const isEnabled = intervention !== undefined;
  const Icon = config.icon;

  const handleParamChange = useCallback(
    (key: string, value: number | boolean | string) => {
      if (intervention) {
        onUpdateParams({ ...intervention.parameters, [key]: value });
      }
    },
    [intervention, onUpdateParams]
  );

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isEnabled ? 'border-primary/50 bg-primary/5' : 'border-border'
      )}
    >
      {/* Header with checkbox and title */}
      <div className="flex items-start gap-3">
        <Checkbox
          id={`policy-${config.id}`}
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label={`Enable ${config.name}`}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            <Label
              htmlFor={`policy-${config.id}`}
              className={cn(
                'text-sm font-medium cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {config.name}
            </Label>
            {isEnabled && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Parameters (shown when enabled) */}
      {isEnabled && intervention && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* R0 Effect Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Effect on R0:</span>
            <Badge variant="secondary" className="font-mono">
              {(intervention.effectOnR0 * 100).toFixed(0)}% transmission
            </Badge>
          </div>

          {/* Parameter Sliders */}
          {config.parameterConfigs.map((paramConfig) => {
            if (paramConfig.type !== 'slider') return null;

            const currentValue =
              (intervention.parameters[paramConfig.key] as number) ??
              (config.defaultParams[paramConfig.key] as number);

            return (
              <div key={paramConfig.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`${config.id}-${paramConfig.key}`}
                      className={cn(
                        'text-xs',
                        disabled && 'opacity-50'
                      )}
                    >
                      {paramConfig.label}
                    </Label>
                    {paramConfig.tooltip && (
                      <InfoTooltip content={paramConfig.tooltip} />
                    )}
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {paramConfig.formatValue?.(currentValue) ?? currentValue}
                  </Badge>
                </div>
                <Slider
                  id={`${config.id}-${paramConfig.key}`}
                  min={paramConfig.min}
                  max={paramConfig.max}
                  step={paramConfig.step}
                  value={[currentValue]}
                  onValueChange={([value]) =>
                    handleParamChange(paramConfig.key, value)
                  }
                  disabled={disabled}
                  aria-label={paramConfig.label}
                />
              </div>
            );
          })}

          {/* Timeline Configuration */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-xs font-medium">Intervention Timeline</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={`${config.id}-start`}
                  className="text-xs text-muted-foreground"
                >
                  Start Day
                </Label>
                <Slider
                  id={`${config.id}-start`}
                  min={0}
                  max={simulationDuration}
                  step={30}
                  value={[intervention.startDay]}
                  onValueChange={([value]) =>
                    onUpdateTimeline(value, intervention.endDay)
                  }
                  disabled={disabled}
                  aria-label="Start day"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  Day {intervention.startDay}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={`${config.id}-end`}
                  className="text-xs text-muted-foreground"
                >
                  End Day
                </Label>
                <Slider
                  id={`${config.id}-end`}
                  min={intervention.startDay}
                  max={simulationDuration}
                  step={30}
                  value={[intervention.endDay ?? simulationDuration]}
                  onValueChange={([value]) =>
                    onUpdateTimeline(
                      intervention.startDay,
                      value === simulationDuration ? undefined : value
                    )
                  }
                  disabled={disabled}
                  aria-label="End day"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {intervention.endDay
                    ? `Day ${intervention.endDay}`
                    : 'Indefinite'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * InterventionTimeline - Visual timeline of active interventions
 */
function InterventionTimeline({
  interventions,
  duration,
}: {
  interventions: PolicyIntervention[];
  duration: number;
}) {
  if (interventions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Calendar className="size-4" />
        Intervention Timeline
      </h4>
      <div className="space-y-2">
        {interventions.map((intervention) => {
          const config = POLICY_CONFIGS.find(
            (c) => c.type === intervention.type
          );
          const startPercent = (intervention.startDay / duration) * 100;
          const endPercent =
            ((intervention.endDay ?? duration) / duration) * 100;
          const widthPercent = endPercent - startPercent;

          return (
            <div key={intervention.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {config?.shortName ?? intervention.name}
                </span>
                <span className="text-muted-foreground">
                  Day {intervention.startDay} -{' '}
                  {intervention.endDay ?? 'End'}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-primary rounded-full"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Day 0</span>
        <span>Day {Math.round(duration / 2)}</span>
        <span>Day {duration}</span>
      </div>
    </div>
  );
}

/**
 * PolicySummary - Summary of combined policy effects
 */
function PolicySummary({ interventions }: { interventions: PolicyIntervention[] }) {
  const combinedEffect = useMemo(() => {
    if (interventions.length === 0) return 1;
    return interventions.reduce((acc, i) => acc * i.effectOnR0, 1);
  }, [interventions]);

  const reductionPercent = ((1 - combinedEffect) * 100).toFixed(0);

  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Settings2 className="size-4" />
        Combined Policy Impact
      </h4>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Transmission Reduction
        </span>
        <Badge
          variant={interventions.length > 0 ? 'default' : 'secondary'}
          className="font-mono"
        >
          {reductionPercent}% reduction
        </Badge>
      </div>
      <Progress
        value={Number(reductionPercent)}
        className="h-2"
        aria-label="Combined transmission reduction"
      />
      <p className="text-xs text-muted-foreground">
        {interventions.length} active intervention
        {interventions.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/**
 * PolicyPanel Component
 *
 * Main control panel for configuring TB policy interventions.
 * Connects to the simulation store to update configuration in real-time.
 */
export function PolicyPanel() {
  const config = useSimulationStore((state) => state.config);
  const activeInterventions = useSimulationStore(selectActiveInterventions);
  const setConfig = useSimulationStore((state) => state.setConfig);
  const status = useSimulationStore((state) => state.state.status);

  const isDisabled = status === 'running';

  /**
   * Toggle a policy intervention on/off
   */
  const handleTogglePolicy = useCallback(
    (policyConfig: PolicyConfig, enabled: boolean) => {
      if (enabled) {
        // Add new intervention
        const newIntervention: PolicyIntervention = {
          id: policyConfig.id,
          type: policyConfig.type,
          name: policyConfig.name,
          description: policyConfig.description,
          startDay: 0,
          parameters: { ...policyConfig.defaultParams },
          effectOnR0: policyConfig.defaultEffectOnR0,
        };

        setConfig({
          activeInterventions: [...activeInterventions, newIntervention],
        });
      } else {
        // Remove intervention
        setConfig({
          activeInterventions: activeInterventions.filter(
            (i) => i.type !== policyConfig.type
          ),
        });
      }
    },
    [activeInterventions, setConfig]
  );

  /**
   * Update intervention parameters
   */
  const handleUpdateParams = useCallback(
    (interventionId: string, params: Record<string, number | boolean | string>) => {
      setConfig({
        activeInterventions: activeInterventions.map((i) =>
          i.id === interventionId ? { ...i, parameters: params } : i
        ),
      });
    },
    [activeInterventions, setConfig]
  );

  /**
   * Update intervention timeline
   */
  const handleUpdateTimeline = useCallback(
    (interventionId: string, startDay: number, endDay?: number) => {
      setConfig({
        activeInterventions: activeInterventions.map((i) =>
          i.id === interventionId ? { ...i, startDay, endDay } : i
        ),
      });
    },
    [activeInterventions, setConfig]
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="size-5" />
          Policy Interventions
        </CardTitle>
        <CardDescription>
          Configure TB control policies and their parameters
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Policy Cards */}
        {POLICY_CONFIGS.map((policyConfig) => {
          const intervention = activeInterventions.find(
            (i) => i.type === policyConfig.type
          );

          return (
            <PolicyCard
              key={policyConfig.id}
              config={policyConfig}
              intervention={intervention}
              onToggle={(enabled) => handleTogglePolicy(policyConfig, enabled)}
              onUpdateParams={(params) =>
                handleUpdateParams(policyConfig.id, params)
              }
              onUpdateTimeline={(startDay, endDay) =>
                handleUpdateTimeline(policyConfig.id, startDay, endDay)
              }
              disabled={isDisabled}
              simulationDuration={config.duration}
            />
          );
        })}

        <Separator />

        {/* Intervention Timeline */}
        <InterventionTimeline
          interventions={activeInterventions}
          duration={config.duration}
        />

        <Separator />

        {/* Policy Summary */}
        <PolicySummary interventions={activeInterventions} />
      </CardContent>
    </Card>
  );
}

export default PolicyPanel;
