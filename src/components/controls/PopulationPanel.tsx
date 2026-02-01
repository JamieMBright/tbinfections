/**
 * Population Panel Component
 *
 * Allows users to configure population demographics for the TB simulation including:
 * - Age group distribution (0-4, 5-14, 15-24, 25-44, 45-64, 65+)
 * - UK-born vs non-UK-born proportion
 * - Immigration rate
 * - Healthcare worker population
 *
 * @module components/controls/PopulationPanel
 */

'use client';

import { useCallback } from 'react';
import { Users, Globe, Building2, Info } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulation-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn, formatNumber, formatPercent } from '@/lib/utils';
import type { AgeDistribution } from '@/types/simulation';

/**
 * Age group configuration for display
 */
const AGE_GROUPS: Array<{
  key: keyof AgeDistribution;
  label: string;
  description: string;
}> = [
  { key: '0-4', label: '0-4 years', description: 'Infants and toddlers' },
  { key: '5-14', label: '5-14 years', description: 'Children and early teens' },
  { key: '15-24', label: '15-24 years', description: 'Young adults' },
  { key: '25-44', label: '25-44 years', description: 'Working age adults' },
  { key: '45-64', label: '45-64 years', description: 'Middle-aged adults' },
  { key: '65+', label: '65+ years', description: 'Older adults' },
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
 * PopulationBreakdown - Displays current population statistics
 */
function PopulationBreakdown({
  totalPopulation,
  ukBornProportion,
  healthcareWorkers,
}: {
  totalPopulation: number;
  ukBornProportion: number;
  healthcareWorkers: number;
}) {
  const ukBornCount = Math.round(totalPopulation * ukBornProportion);
  const nonUkBornCount = totalPopulation - ukBornCount;

  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Users className="size-4" />
        Current Population Breakdown
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Total Population</p>
          <p className="font-semibold">{formatNumber(totalPopulation)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">UK-Born</p>
          <p className="font-semibold">{formatNumber(ukBornCount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Non-UK-Born</p>
          <p className="font-semibold">{formatNumber(nonUkBornCount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Healthcare Workers</p>
          <p className="font-semibold">{formatNumber(healthcareWorkers)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * PopulationPanel Component
 *
 * Main control panel for configuring population demographics in the TB simulation.
 * Connects to the simulation store to update configuration in real-time.
 */
export function PopulationPanel() {
  const config = useSimulationStore((state) => state.config);
  const setConfig = useSimulationStore((state) => state.setConfig);
  const status = useSimulationStore((state) => state.state.status);

  const isDisabled = status === 'running';

  // Find UK-born population group
  const ukBornGroup = config.populationGroups.find(
    (g) => g.characteristics.ukBorn
  );
  const ukBornProportion = ukBornGroup?.proportion ?? 0.86;

  // Calculate healthcare workers (approximately 1.5M in UK)
  const healthcareWorkers = Math.round(config.totalPopulation * 0.022);

  /**
   * Handle age distribution changes
   * Normalizes values to ensure they sum to 1.0
   */
  const handleAgeDistributionChange = useCallback(
    (ageGroup: keyof AgeDistribution, newValue: number) => {
      const currentDistribution = { ...config.ageDistribution };
      const oldValue = currentDistribution[ageGroup];
      const delta = newValue - oldValue;

      // Calculate the sum of other groups
      const otherGroupsSum =
        Object.entries(currentDistribution)
          .filter(([key]) => key !== ageGroup)
          .reduce((sum, [, val]) => sum + val, 0);

      if (otherGroupsSum > 0) {
        // Adjust other groups proportionally to maintain sum of 1.0
        const adjustmentFactor = (otherGroupsSum - delta) / otherGroupsSum;

        const newDistribution: AgeDistribution = {
          '0-4': currentDistribution['0-4'],
          '5-14': currentDistribution['5-14'],
          '15-24': currentDistribution['15-24'],
          '25-44': currentDistribution['25-44'],
          '45-64': currentDistribution['45-64'],
          '65+': currentDistribution['65+'],
        };

        // Update all groups with new values
        for (const key of Object.keys(newDistribution) as Array<keyof AgeDistribution>) {
          if (key === ageGroup) {
            newDistribution[key] = newValue;
          } else {
            newDistribution[key] = Math.max(0, currentDistribution[key] * adjustmentFactor);
          }
        }

        setConfig({ ageDistribution: newDistribution });
      }
    },
    [config.ageDistribution, setConfig]
  );

  /**
   * Handle UK-born proportion changes
   */
  const handleUkBornProportionChange = useCallback(
    (newProportion: number) => {
      const updatedGroups = config.populationGroups.map((group) => {
        if (group.characteristics.ukBorn) {
          return { ...group, proportion: newProportion };
        }
        // Adjust non-UK-born proportion
        return { ...group, proportion: 1 - newProportion };
      });

      setConfig({ populationGroups: updatedGroups });
    },
    [config.populationGroups, setConfig]
  );

  /**
   * Handle immigration rate changes
   */
  const handleImmigrationRateChange = useCallback(
    (newRate: number) => {
      setConfig({ importedCasesPerDay: newRate });
    },
    [setConfig]
  );

  /**
   * Handle total population changes
   */
  const handleTotalPopulationChange = useCallback(
    (newPopulation: number) => {
      setConfig({ totalPopulation: Math.round(newPopulation * 1_000_000) });
    },
    [setConfig]
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5" />
          Population Settings
        </CardTitle>
        <CardDescription>
          Configure demographic characteristics for the simulation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Population */}
        <SliderWithValue
          id="total-population"
          label="Total Population"
          value={config.totalPopulation / 1_000_000}
          min={10}
          max={100}
          step={1}
          onChange={handleTotalPopulationChange}
          formatValue={(v) => `${v}M`}
          tooltip="Total UK population in millions"
          disabled={isDisabled}
        />

        <Separator />

        {/* Age Distribution */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Age Group Distribution</h4>
            <InfoTooltip content="Adjust the proportion of each age group in the population. Values automatically normalize to 100%." />
          </div>

          <div className="space-y-4">
            {AGE_GROUPS.map(({ key, label, description }) => (
              <SliderWithValue
                key={key}
                id={`age-${key}`}
                label={label}
                value={config.ageDistribution[key]}
                min={0}
                max={0.5}
                step={0.01}
                onChange={(value) => handleAgeDistributionChange(key, value)}
                formatValue={(v) => formatPercent(v, 1)}
                tooltip={description}
                disabled={isDisabled}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Origin Demographics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Origin Demographics</h4>
          </div>

          <SliderWithValue
            id="uk-born-proportion"
            label="UK-Born Proportion"
            value={ukBornProportion}
            min={0.5}
            max={0.99}
            step={0.01}
            onChange={handleUkBornProportionChange}
            formatValue={(v) => formatPercent(v, 1)}
            tooltip="Proportion of population born in the UK. Non-UK-born population typically has higher TB incidence rates."
            disabled={isDisabled}
          />

          <SliderWithValue
            id="immigration-rate"
            label="Daily Imported Cases"
            value={config.importedCasesPerDay}
            min={0}
            max={50}
            step={1}
            onChange={handleImmigrationRateChange}
            formatValue={(v) => `${v} cases/day`}
            tooltip="Number of new TB cases imported through immigration per day"
            disabled={isDisabled}
          />
        </div>

        <Separator />

        {/* Healthcare Workers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Healthcare Workforce</h4>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Healthcare Workers</p>
                <p className="text-xs text-muted-foreground">
                  ~2.2% of total population (NHS and care workers)
                </p>
              </div>
              <Badge variant="outline" className="font-mono">
                {formatNumber(healthcareWorkers)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Population Breakdown Display */}
        <PopulationBreakdown
          totalPopulation={config.totalPopulation}
          ukBornProportion={ukBornProportion}
          healthcareWorkers={healthcareWorkers}
        />
      </CardContent>
    </Card>
  );
}

export default PopulationPanel;
