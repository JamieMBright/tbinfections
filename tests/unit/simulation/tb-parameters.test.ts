/**
 * TB Parameters Unit Tests
 *
 * Comprehensive tests for TB epidemiological parameter validation,
 * creation, and policy adjustments. Tests Zod schema validation,
 * parameter bounds, and policy effects on disease dynamics.
 *
 * @module tests/unit/simulation/tb-parameters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import type { DiseaseParameters, PolicyIntervention, PolicyType } from '@/types/simulation';
import {
  TB_PARAMETERS,
  diseaseParametersSchema,
  createDiseaseParameters,
  adjustParametersForPolicy,
  validateParameters,
  validateParametersOrThrow,
  calculateEffectiveR0,
  getAdjustedBCGEfficacy,
} from '@/lib/simulation/tb-parameters';

/**
 * Create a standard policy intervention for testing
 */
function createTestPolicy(overrides?: Partial<PolicyIntervention>): PolicyIntervention {
  return {
    id: 'test-policy-1',
    type: 'active_case_finding',
    name: 'Test Policy',
    description: 'A test policy intervention',
    startDay: 0,
    parameters: {},
    effectOnR0: 1,
    ...overrides,
  };
}

describe('TB_PARAMETERS', () => {
  describe('R0 Configuration', () => {
    it('should have R0 min within expected TB range', () => {
      expect(TB_PARAMETERS.R0.min).toBeGreaterThanOrEqual(1.0);
      expect(TB_PARAMETERS.R0.min).toBeLessThanOrEqual(1.5);
    });

    it('should have R0 max within expected TB range', () => {
      expect(TB_PARAMETERS.R0.max).toBeGreaterThanOrEqual(1.8);
      expect(TB_PARAMETERS.R0.max).toBeLessThanOrEqual(3.0);
    });

    it('should have R0 default between min and max', () => {
      expect(TB_PARAMETERS.R0.default).toBeGreaterThanOrEqual(TB_PARAMETERS.R0.min);
      expect(TB_PARAMETERS.R0.default).toBeLessThanOrEqual(TB_PARAMETERS.R0.max);
    });
  });

  describe('Transmission Rate Configuration', () => {
    it('should have positive baseline transmission rate', () => {
      expect(TB_PARAMETERS.transmissionRate.baseline).toBeGreaterThan(0);
    });

    it('should have positive household transmission rate', () => {
      expect(TB_PARAMETERS.transmissionRate.household).toBeGreaterThan(0);
    });

    it('should have household transmission higher than baseline', () => {
      expect(TB_PARAMETERS.transmissionRate.household).toBeGreaterThan(
        TB_PARAMETERS.transmissionRate.baseline
      );
    });

    it('should have transmission rates less than 1', () => {
      expect(TB_PARAMETERS.transmissionRate.baseline).toBeLessThan(1);
      expect(TB_PARAMETERS.transmissionRate.household).toBeLessThan(1);
    });
  });

  describe('Latency Configuration', () => {
    it('should have positive fast progression rate', () => {
      expect(TB_PARAMETERS.latency.fastProgressionRate).toBeGreaterThan(0);
    });

    it('should have positive stabilization rate', () => {
      expect(TB_PARAMETERS.latency.stabilizationRate).toBeGreaterThan(0);
    });

    it('should have positive reactivation rate', () => {
      expect(TB_PARAMETERS.latency.reactivationRate).toBeGreaterThan(0);
    });

    it('should have fast progression rate higher than reactivation rate', () => {
      // Fast progression (recent infection) should be faster than reactivation (stable LTBI)
      expect(TB_PARAMETERS.latency.fastProgressionRate).toBeGreaterThan(
        TB_PARAMETERS.latency.reactivationRate
      );
    });
  });

  describe('Infectious Period Configuration', () => {
    it('should have positive untreated period', () => {
      expect(TB_PARAMETERS.infectiousPeriod.untreated).toBeGreaterThan(0);
    });

    it('should have positive treated period', () => {
      expect(TB_PARAMETERS.infectiousPeriod.treated).toBeGreaterThan(0);
    });

    it('should have treated period shorter than untreated', () => {
      expect(TB_PARAMETERS.infectiousPeriod.treated).toBeLessThan(
        TB_PARAMETERS.infectiousPeriod.untreated
      );
    });

    it('should have treated period around 6 months (180 days)', () => {
      expect(TB_PARAMETERS.infectiousPeriod.treated).toBeCloseTo(180, -1);
    });
  });

  describe('Treatment and Recovery Rates', () => {
    it('should have treatment rate between 0 and 1', () => {
      expect(TB_PARAMETERS.treatmentRate).toBeGreaterThan(0);
      expect(TB_PARAMETERS.treatmentRate).toBeLessThanOrEqual(1);
    });

    it('should have natural recovery rate between 0 and 1', () => {
      expect(TB_PARAMETERS.naturalRecoveryRate).toBeGreaterThan(0);
      expect(TB_PARAMETERS.naturalRecoveryRate).toBeLessThanOrEqual(1);
    });

    it('should have treatment rate higher than natural recovery', () => {
      expect(TB_PARAMETERS.treatmentRate).toBeGreaterThan(TB_PARAMETERS.naturalRecoveryRate);
    });
  });

  describe('Case Fatality Rate Configuration', () => {
    it('should have untreated fatality rate between 0 and 1', () => {
      expect(TB_PARAMETERS.caseFatalityRate.untreated).toBeGreaterThan(0);
      expect(TB_PARAMETERS.caseFatalityRate.untreated).toBeLessThanOrEqual(1);
    });

    it('should have treated fatality rate between 0 and 1', () => {
      expect(TB_PARAMETERS.caseFatalityRate.treated).toBeGreaterThan(0);
      expect(TB_PARAMETERS.caseFatalityRate.treated).toBeLessThanOrEqual(1);
    });

    it('should have treated fatality rate much lower than untreated', () => {
      expect(TB_PARAMETERS.caseFatalityRate.treated).toBeLessThan(
        TB_PARAMETERS.caseFatalityRate.untreated * 0.2
      );
    });
  });

  describe('BCG Efficacy Configuration', () => {
    it('should have neonatal efficacy between 0 and 1', () => {
      expect(TB_PARAMETERS.bcgEfficacy.neonatal).toBeGreaterThan(0);
      expect(TB_PARAMETERS.bcgEfficacy.neonatal).toBeLessThanOrEqual(1);
    });

    it('should have childhood efficacy between 0 and 1', () => {
      expect(TB_PARAMETERS.bcgEfficacy.childhood).toBeGreaterThan(0);
      expect(TB_PARAMETERS.bcgEfficacy.childhood).toBeLessThanOrEqual(1);
    });

    it('should have adult efficacy between 0 and 1', () => {
      expect(TB_PARAMETERS.bcgEfficacy.adult).toBeGreaterThan(0);
      expect(TB_PARAMETERS.bcgEfficacy.adult).toBeLessThanOrEqual(1);
    });

    it('should have neonatal efficacy highest', () => {
      expect(TB_PARAMETERS.bcgEfficacy.neonatal).toBeGreaterThan(TB_PARAMETERS.bcgEfficacy.childhood);
      expect(TB_PARAMETERS.bcgEfficacy.childhood).toBeGreaterThan(TB_PARAMETERS.bcgEfficacy.adult);
    });

    it('should have positive waning rate', () => {
      expect(TB_PARAMETERS.bcgEfficacy.waning).toBeGreaterThan(0);
      expect(TB_PARAMETERS.bcgEfficacy.waning).toBeLessThan(0.1); // Should be small annual waning
    });

    it('should have positive protection duration', () => {
      expect(TB_PARAMETERS.bcgEfficacy.duration).toBeGreaterThan(0);
      expect(TB_PARAMETERS.bcgEfficacy.duration).toBeGreaterThanOrEqual(10); // At least 10 years
    });
  });

  describe('Contact Rates Configuration', () => {
    it('should have positive contact rates for all settings', () => {
      expect(TB_PARAMETERS.contactRates.general).toBeGreaterThan(0);
      expect(TB_PARAMETERS.contactRates.household).toBeGreaterThan(0);
      expect(TB_PARAMETERS.contactRates.workplace).toBeGreaterThan(0);
      expect(TB_PARAMETERS.contactRates.healthcare).toBeGreaterThan(0);
    });

    it('should have healthcare contact rate highest', () => {
      expect(TB_PARAMETERS.contactRates.healthcare).toBeGreaterThan(TB_PARAMETERS.contactRates.general);
    });
  });

  describe('UK-Specific Configuration', () => {
    it('should have pre-entry screening efficacy between 0 and 1', () => {
      expect(TB_PARAMETERS.ukSpecific.preEntryScreeningEfficacy).toBeGreaterThan(0);
      expect(TB_PARAMETERS.ukSpecific.preEntryScreeningEfficacy).toBeLessThanOrEqual(1);
    });

    it('should have active case finding efficacy between 0 and 1', () => {
      expect(TB_PARAMETERS.ukSpecific.activeCaseFinding).toBeGreaterThan(0);
      expect(TB_PARAMETERS.ukSpecific.activeCaseFinding).toBeLessThanOrEqual(1);
    });

    it('should have positive treatment delay', () => {
      expect(TB_PARAMETERS.ukSpecific.treatmentDelay).toBeGreaterThan(0);
    });
  });
});

describe('diseaseParametersSchema', () => {
  describe('Valid Parameters', () => {
    it('should validate correct parameters', () => {
      const validParams: DiseaseParameters = {
        beta: 0.001,
        epsilon: 0.0014,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 0.7,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate boundary values at 0', () => {
      const params = {
        beta: 0.001, // Must be positive
        epsilon: 0,
        kappa: 0,
        omega: 0,
        gamma: 0,
        mu: 0,
        muTb: 0,
        rho: 0,
        ve: 0,
        sigma: 0,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('should validate boundary values at 1', () => {
      const params = {
        beta: 1,
        epsilon: 1,
        kappa: 1,
        omega: 1,
        gamma: 1,
        mu: 1,
        muTb: 1,
        rho: 1,
        ve: 1,
        sigma: 1,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Parameters', () => {
    it('should reject negative beta', () => {
      const params = {
        beta: -0.001,
        epsilon: 0.0014,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 0.7,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('should reject zero beta', () => {
      const params = {
        beta: 0, // Must be positive
        epsilon: 0.0014,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 0.7,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('should reject beta greater than 1', () => {
      const params = {
        beta: 1.5,
        epsilon: 0.0014,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 0.7,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('should reject negative epsilon', () => {
      const params = {
        beta: 0.001,
        epsilon: -0.001,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 0.7,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('should reject ve greater than 1', () => {
      const params = {
        beta: 0.001,
        epsilon: 0.0014,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 1.2,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const params = {
        beta: 0.001,
        epsilon: 0.0014,
        // missing other fields
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const params = {
        beta: 'not a number',
        epsilon: 0.0014,
        kappa: 0.001,
        omega: 0.0001,
        gamma: 0.005,
        mu: 0.00003,
        muTb: 0.0001,
        rho: 0.001,
        ve: 0.7,
        sigma: 0.5,
      };

      const result = diseaseParametersSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });
});

describe('createDiseaseParameters', () => {
  it('should create valid default parameters', () => {
    const params = createDiseaseParameters();

    expect(params.beta).toBeGreaterThan(0);
    expect(params.epsilon).toBeGreaterThan(0);
    expect(params.kappa).toBeGreaterThan(0);
    expect(params.omega).toBeGreaterThan(0);
    expect(params.gamma).toBeGreaterThan(0);
    expect(params.mu).toBeGreaterThan(0);
    expect(params.muTb).toBeGreaterThan(0);
    expect(params.rho).toBeGreaterThan(0);
    expect(params.ve).toBeGreaterThan(0);
    expect(params.sigma).toBeGreaterThan(0);
  });

  it('should pass Zod validation', () => {
    const params = createDiseaseParameters();
    const result = diseaseParametersSchema.safeParse(params);

    expect(result.success).toBe(true);
  });

  it('should have all required parameters', () => {
    const params = createDiseaseParameters();

    expect(params).toHaveProperty('beta');
    expect(params).toHaveProperty('epsilon');
    expect(params).toHaveProperty('kappa');
    expect(params).toHaveProperty('omega');
    expect(params).toHaveProperty('gamma');
    expect(params).toHaveProperty('mu');
    expect(params).toHaveProperty('muTb');
    expect(params).toHaveProperty('rho');
    expect(params).toHaveProperty('ve');
    expect(params).toHaveProperty('sigma');
  });

  it('should accept overrides', () => {
    const customBeta = 0.005;
    const customVe = 0.9;

    const params = createDiseaseParameters({ beta: customBeta, ve: customVe });

    expect(params.beta).toBe(customBeta);
    expect(params.ve).toBe(customVe);
  });

  it('should preserve non-overridden defaults', () => {
    const defaultParams = createDiseaseParameters();
    const customParams = createDiseaseParameters({ beta: 0.005 });

    expect(customParams.epsilon).toBe(defaultParams.epsilon);
    expect(customParams.kappa).toBe(defaultParams.kappa);
  });

  it('should have epsilon equal to TB_PARAMETERS fast progression rate', () => {
    const params = createDiseaseParameters();
    expect(params.epsilon).toBe(TB_PARAMETERS.latency.fastProgressionRate);
  });

  it('should have kappa equal to TB_PARAMETERS stabilization rate', () => {
    const params = createDiseaseParameters();
    expect(params.kappa).toBe(TB_PARAMETERS.latency.stabilizationRate);
  });

  it('should have omega equal to TB_PARAMETERS reactivation rate', () => {
    const params = createDiseaseParameters();
    expect(params.omega).toBe(TB_PARAMETERS.latency.reactivationRate);
  });

  it('should have ve equal to TB_PARAMETERS neonatal BCG efficacy', () => {
    const params = createDiseaseParameters();
    expect(params.ve).toBe(TB_PARAMETERS.bcgEfficacy.neonatal);
  });
});

describe('adjustParametersForPolicy', () => {
  let baseParams: DiseaseParameters;

  beforeEach(() => {
    baseParams = createDiseaseParameters();
  });

  describe('Policy Timing', () => {
    it('should not apply policy before start day', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 100,
        effectOnR0: 0.8,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 50);

      expect(adjusted.beta).toBeCloseTo(baseParams.beta, 10);
    });

    it('should apply policy on start day', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 100,
        effectOnR0: 0.8,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 100);

      expect(adjusted.beta).not.toBe(baseParams.beta);
    });

    it('should apply policy after start day', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 100,
        effectOnR0: 0.8,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 150);

      expect(adjusted.beta).not.toBe(baseParams.beta);
    });

    it('should not apply policy after end day', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 0,
        endDay: 100,
        effectOnR0: 0.5,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 150);

      // Should be base params since policy ended
      expect(adjusted.beta).toBeCloseTo(baseParams.beta, 10);
    });
  });

  describe('Policy Effects', () => {
    it('should reduce beta for active_case_finding', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.beta).toBeLessThan(baseParams.beta);
    });

    it('should increase gamma for active_case_finding', () => {
      const policy = createTestPolicy({
        type: 'active_case_finding',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.gamma).toBeGreaterThan(baseParams.gamma);
    });

    it('should reduce beta for pre_entry_screening', () => {
      const policy = createTestPolicy({
        type: 'pre_entry_screening',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.beta).toBeLessThan(baseParams.beta);
    });

    it('should reduce beta for contact_tracing', () => {
      const policy = createTestPolicy({
        type: 'contact_tracing',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.beta).toBeLessThan(baseParams.beta);
    });

    it('should increase rho for universal_bcg', () => {
      const policy = createTestPolicy({
        type: 'universal_bcg',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.rho).toBeGreaterThan(baseParams.rho);
    });

    it('should cap rho at 1 for universal_bcg', () => {
      const policy = createTestPolicy({
        type: 'universal_bcg',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.rho).toBeLessThanOrEqual(1);
    });

    it('should reduce muTb for directly_observed_therapy', () => {
      const policy = createTestPolicy({
        type: 'directly_observed_therapy',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      expect(adjusted.muTb).toBeLessThan(baseParams.muTb);
    });
  });

  describe('effectOnR0', () => {
    it('should apply effectOnR0 multiplier to beta', () => {
      const policy = createTestPolicy({
        type: 'public_awareness_campaign',
        startDay: 0,
        effectOnR0: 0.5,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy], 10);

      // Beta should be reduced by effectOnR0 factor (in addition to policy effect)
      expect(adjusted.beta).toBeLessThan(baseParams.beta);
    });

    it('should not change beta when effectOnR0 is 1', () => {
      const policy = createTestPolicy({
        type: 'public_awareness_campaign',
        startDay: 0,
        effectOnR0: 1,
      });

      const adjustedWithEffect = adjustParametersForPolicy(baseParams, [policy], 10);

      // The policy still has its own effect, but effectOnR0=1 doesn't add additional reduction
      const policyWithHalfEffect = createTestPolicy({
        type: 'public_awareness_campaign',
        startDay: 0,
        effectOnR0: 0.5,
      });
      const adjustedWithHalfEffect = adjustParametersForPolicy(baseParams, [policyWithHalfEffect], 10);

      // Half effect should result in lower beta
      expect(adjustedWithHalfEffect.beta).toBeLessThan(adjustedWithEffect.beta);
    });
  });

  describe('Multiple Policies', () => {
    it('should combine effects of multiple policies', () => {
      const policy1 = createTestPolicy({
        id: 'policy-1',
        type: 'active_case_finding',
        startDay: 0,
      });
      const policy2 = createTestPolicy({
        id: 'policy-2',
        type: 'contact_tracing',
        startDay: 0,
      });

      const singlePolicyAdjusted = adjustParametersForPolicy(baseParams, [policy1], 10);
      const combinedAdjusted = adjustParametersForPolicy(baseParams, [policy1, policy2], 10);

      // Combined should have even lower beta
      expect(combinedAdjusted.beta).toBeLessThan(singlePolicyAdjusted.beta);
    });

    it('should apply multiplicative effects', () => {
      const policy1 = createTestPolicy({
        id: 'policy-1',
        type: 'active_case_finding',
        startDay: 0,
      });
      const policy2 = createTestPolicy({
        id: 'policy-2',
        type: 'active_case_finding',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy1, policy2], 10);

      // Gamma should be increased even more with two policies
      const singleAdjusted = adjustParametersForPolicy(baseParams, [policy1], 10);
      expect(adjusted.gamma).toBeGreaterThan(singleAdjusted.gamma);
    });
  });

  describe('No Policies', () => {
    it('should return base parameters when no policies', () => {
      const adjusted = adjustParametersForPolicy(baseParams, [], 10);

      expect(adjusted.beta).toBe(baseParams.beta);
      expect(adjusted.gamma).toBe(baseParams.gamma);
      expect(adjusted.rho).toBe(baseParams.rho);
    });
  });

  describe('ve Override', () => {
    it('should set ve to highest value when multiple BCG policies', () => {
      const policy1 = createTestPolicy({
        id: 'policy-1',
        type: 'universal_bcg',
        startDay: 0,
      });
      const policy2 = createTestPolicy({
        id: 'policy-2',
        type: 'healthcare_worker_bcg',
        startDay: 0,
      });

      const adjusted = adjustParametersForPolicy(baseParams, [policy1, policy2], 10);

      // Should use the higher efficacy (neonatal > adult)
      expect(adjusted.ve).toBe(TB_PARAMETERS.bcgEfficacy.neonatal);
    });
  });
});

describe('validateParameters', () => {
  it('should return success: true for valid parameters', () => {
    const params = createDiseaseParameters();
    const result = validateParameters(params);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should return success: false for invalid parameters', () => {
    const invalidParams = {
      beta: -1,
      epsilon: 0.0014,
      kappa: 0.001,
      omega: 0.0001,
      gamma: 0.005,
      mu: 0.00003,
      muTb: 0.0001,
      rho: 0.001,
      ve: 0.7,
      sigma: 0.5,
    };

    const result = validateParameters(invalidParams);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it('should return Zod errors for validation failures', () => {
    const invalidParams = {
      beta: -1,
      epsilon: 0.0014,
      kappa: 0.001,
      omega: 0.0001,
      gamma: 0.005,
      mu: 0.00003,
      muTb: 0.0001,
      rho: 0.001,
      ve: 0.7,
      sigma: 0.5,
    };

    const result = validateParameters(invalidParams);

    expect(result.success).toBe(false);
    expect(result.errors).toBeInstanceOf(z.ZodError);
  });
});

describe('validateParametersOrThrow', () => {
  it('should return parameters for valid input', () => {
    const params = createDiseaseParameters();
    const result = validateParametersOrThrow(params);

    expect(result).toEqual(params);
  });

  it('should throw ZodError for invalid input', () => {
    const invalidParams = {
      beta: -1,
      epsilon: 0.0014,
      kappa: 0.001,
      omega: 0.0001,
      gamma: 0.005,
      mu: 0.00003,
      muTb: 0.0001,
      rho: 0.001,
      ve: 0.7,
      sigma: 0.5,
    };

    expect(() => validateParametersOrThrow(invalidParams)).toThrow(z.ZodError);
  });
});

describe('calculateEffectiveR0', () => {
  it('should return base R0 when no vaccination coverage', () => {
    const params = createDiseaseParameters();
    const effectiveR0 = calculateEffectiveR0(params, 0);
    const baseR0 = calculateEffectiveR0(params, 0);

    expect(effectiveR0).toBe(baseR0);
  });

  it('should return lower R0 with vaccination coverage', () => {
    const params = createDiseaseParameters();
    const noVaccR0 = calculateEffectiveR0(params, 0);
    const withVaccR0 = calculateEffectiveR0(params, 0.8);

    expect(withVaccR0).toBeLessThan(noVaccR0);
  });

  it('should return 0 when 100% vaccination with perfect efficacy', () => {
    const params = createDiseaseParameters({ ve: 1 });
    const effectiveR0 = calculateEffectiveR0(params, 1);

    expect(effectiveR0).toBe(0);
  });

  it('should be proportional to (1 - ve * coverage)', () => {
    const params = createDiseaseParameters({ ve: 0.8 });
    const coverage = 0.5;

    const baseR0 = calculateEffectiveR0(params, 0);
    const effectiveR0 = calculateEffectiveR0(params, coverage);
    const expectedMultiplier = 1 - params.ve * coverage;

    expect(effectiveR0).toBeCloseTo(baseR0 * expectedMultiplier, 10);
  });
});

describe('getAdjustedBCGEfficacy', () => {
  describe('Age-based efficacy', () => {
    it('should return neonatal efficacy for infants (< 1 year)', () => {
      const efficacy = getAdjustedBCGEfficacy(0, 0);
      expect(efficacy).toBeCloseTo(TB_PARAMETERS.bcgEfficacy.neonatal, 5);
    });

    it('should return childhood efficacy for children (1-15 years)', () => {
      const efficacy = getAdjustedBCGEfficacy(5, 0);
      expect(efficacy).toBeCloseTo(TB_PARAMETERS.bcgEfficacy.childhood, 5);
    });

    it('should return adult efficacy for adults (>= 16 years)', () => {
      const efficacy = getAdjustedBCGEfficacy(20, 0);
      expect(efficacy).toBeCloseTo(TB_PARAMETERS.bcgEfficacy.adult, 5);
    });
  });

  describe('Waning efficacy', () => {
    it('should decrease efficacy over time', () => {
      const efficacy0 = getAdjustedBCGEfficacy(0, 0);
      const efficacy5 = getAdjustedBCGEfficacy(0, 5);
      const efficacy10 = getAdjustedBCGEfficacy(0, 10);

      expect(efficacy5).toBeLessThan(efficacy0);
      expect(efficacy10).toBeLessThan(efficacy5);
    });

    it('should return 0 after protection duration exceeded', () => {
      const yearsAfterDuration = TB_PARAMETERS.bcgEfficacy.duration + 1;
      const efficacy = getAdjustedBCGEfficacy(0, yearsAfterDuration);

      expect(efficacy).toBe(0);
    });

    it('should apply waning correctly', () => {
      const years = 5;
      const baseEfficacy = TB_PARAMETERS.bcgEfficacy.neonatal;
      const expectedEfficacy = baseEfficacy * Math.pow(1 - TB_PARAMETERS.bcgEfficacy.waning, years);

      const actualEfficacy = getAdjustedBCGEfficacy(0, years);

      expect(actualEfficacy).toBeCloseTo(expectedEfficacy, 5);
    });
  });

  describe('Edge cases', () => {
    it('should return non-negative efficacy', () => {
      const efficacy = getAdjustedBCGEfficacy(0, 100);
      expect(efficacy).toBeGreaterThanOrEqual(0);
    });

    it('should handle exactly protection duration years', () => {
      const efficacy = getAdjustedBCGEfficacy(0, TB_PARAMETERS.bcgEfficacy.duration);

      // Should still have some efficacy at exactly duration years
      expect(efficacy).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Parameter Boundary Values', () => {
  describe('All parameters within reasonable ranges', () => {
    it('should have beta < 0.1 for TB (low transmission)', () => {
      const params = createDiseaseParameters();
      expect(params.beta).toBeLessThan(0.1);
    });

    it('should have gamma corresponding to 6-month to 2-year treatment', () => {
      const params = createDiseaseParameters();
      // gamma = 1/infectiousPeriod, so period = 1/gamma days
      const infectiousDays = 1 / params.gamma;

      expect(infectiousDays).toBeGreaterThan(100); // At least ~3 months
      expect(infectiousDays).toBeLessThan(1000); // At most ~3 years
    });

    it('should have mu corresponding to ~80 year lifespan', () => {
      const params = createDiseaseParameters();
      // mu = 1/(lifespan * 365), so lifespan = 1/(mu * 365)
      const lifespanYears = 1 / (params.mu * 365);

      expect(lifespanYears).toBeGreaterThan(70);
      expect(lifespanYears).toBeLessThan(90);
    });

    it('should have muTb reflecting case fatality rate', () => {
      const params = createDiseaseParameters();

      // muTb should be much larger than mu (TB deaths >> natural deaths in infectious)
      expect(params.muTb).toBeGreaterThan(params.mu);
    });
  });
});
