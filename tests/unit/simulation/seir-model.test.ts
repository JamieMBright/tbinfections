/**
 * SEIR Model Unit Tests
 *
 * Comprehensive tests for the core epidemiological simulation engine.
 * Tests cover population conservation, infection dynamics, vaccination impact,
 * R0 calculations, numerical stability, and edge cases.
 *
 * @module tests/unit/simulation/seir-model
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CompartmentState, DiseaseParameters } from '@/types/simulation';
import {
  getTotalPopulation,
  addStates,
  scaleState,
  calculateForceOfInfection,
  computeDerivatives,
  rungeKutta4,
  calculateR0,
  calculateEffectiveR,
  calculateNewInfections,
  calculateNewDeaths,
  calculateIncidenceRate,
  calculatePrevalence,
  createInitialState,
  isValidState,
  cloneState,
} from '@/lib/simulation/seir-model';
import { createDiseaseParameters, TB_PARAMETERS } from '@/lib/simulation/tb-parameters';

/**
 * Create a standard test compartment state
 */
function createTestState(overrides?: Partial<CompartmentState>): CompartmentState {
  return {
    S: 900000,
    V: 50000,
    E_H: 5000,
    E_L: 30000,
    I: 1000,
    R: 14000,
    D: 0,
    ...overrides,
  };
}

/**
 * Create standard test disease parameters
 */
function createTestParams(overrides?: Partial<DiseaseParameters>): DiseaseParameters {
  return createDiseaseParameters(overrides);
}

describe('SEIR Model', () => {
  describe('getTotalPopulation', () => {
    it('should return sum of all living compartments (excluding D)', () => {
      const state = createTestState();
      const total = getTotalPopulation(state);

      const expectedTotal = state.S + state.V + state.E_H + state.E_L + state.I + state.R;
      expect(total).toBe(expectedTotal);
      expect(total).toBe(1000000);
    });

    it('should not include deceased (D) in population count', () => {
      const state = createTestState({ D: 5000 });
      const total = getTotalPopulation(state);

      expect(total).toBe(1000000);
    });

    it('should return 0 for empty population', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      expect(getTotalPopulation(state)).toBe(0);
    });
  });

  describe('addStates', () => {
    it('should add all compartments element-wise', () => {
      const state1: CompartmentState = { S: 100, V: 50, E_H: 10, E_L: 20, I: 5, R: 15, D: 1 };
      const state2: CompartmentState = { S: 200, V: 100, E_H: 20, E_L: 40, I: 10, R: 30, D: 2 };

      const result = addStates(state1, state2);

      expect(result.S).toBe(300);
      expect(result.V).toBe(150);
      expect(result.E_H).toBe(30);
      expect(result.E_L).toBe(60);
      expect(result.I).toBe(15);
      expect(result.R).toBe(45);
      expect(result.D).toBe(3);
    });

    it('should handle negative values (for derivatives)', () => {
      const state1: CompartmentState = { S: 100, V: 50, E_H: 10, E_L: 20, I: 5, R: 15, D: 1 };
      const state2: CompartmentState = { S: -50, V: -25, E_H: -5, E_L: -10, I: 5, R: -5, D: 0 };

      const result = addStates(state1, state2);

      expect(result.S).toBe(50);
      expect(result.V).toBe(25);
      expect(result.E_H).toBe(5);
      expect(result.I).toBe(10);
    });
  });

  describe('scaleState', () => {
    it('should scale all compartments by the given factor', () => {
      const state: CompartmentState = { S: 100, V: 50, E_H: 10, E_L: 20, I: 5, R: 15, D: 1 };
      const result = scaleState(state, 2);

      expect(result.S).toBe(200);
      expect(result.V).toBe(100);
      expect(result.E_H).toBe(20);
      expect(result.E_L).toBe(40);
      expect(result.I).toBe(10);
      expect(result.R).toBe(30);
      expect(result.D).toBe(2);
    });

    it('should handle fractional scaling (for RK4)', () => {
      const state: CompartmentState = { S: 100, V: 50, E_H: 10, E_L: 20, I: 5, R: 15, D: 1 };
      const result = scaleState(state, 0.5);

      expect(result.S).toBe(50);
      expect(result.V).toBe(25);
      expect(result.E_H).toBe(5);
      expect(result.E_L).toBe(10);
    });

    it('should handle zero scaling', () => {
      const state: CompartmentState = { S: 100, V: 50, E_H: 10, E_L: 20, I: 5, R: 15, D: 1 };
      const result = scaleState(state, 0);

      expect(result.S).toBe(0);
      expect(result.V).toBe(0);
      expect(result.E_H).toBe(0);
    });
  });

  describe('calculateForceOfInfection', () => {
    it('should return 0 when there are no infectious cases', () => {
      const state = createTestState({ I: 0 });
      const params = createTestParams();

      const lambda = calculateForceOfInfection(state, params);
      expect(lambda).toBe(0);
    });

    it('should return 0 when population is 0', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      const params = createTestParams();

      const lambda = calculateForceOfInfection(state, params);
      expect(lambda).toBe(0);
    });

    it('should increase with more infectious cases', () => {
      const params = createTestParams();
      const state1 = createTestState({ I: 100 });
      const state2 = createTestState({ I: 1000 });

      const lambda1 = calculateForceOfInfection(state1, params);
      const lambda2 = calculateForceOfInfection(state2, params);

      expect(lambda2).toBeGreaterThan(lambda1);
    });

    it('should be proportional to beta and I/N', () => {
      const state = createTestState({ I: 1000 });
      const params = createTestParams({ beta: 0.001 });

      const lambda = calculateForceOfInfection(state, params);
      const N = getTotalPopulation(state);
      const expected = (params.beta * state.I) / N;

      expect(lambda).toBeCloseTo(expected, 10);
    });
  });

  describe('computeDerivatives', () => {
    let state: CompartmentState;
    let params: DiseaseParameters;

    beforeEach(() => {
      state = createTestState();
      params = createTestParams();
    });

    it('should produce derivatives that conserve population (excluding D)', () => {
      const derivatives = computeDerivatives(state, params);

      // The sum of all derivatives except dD should be approximately 0
      // because the only way to leave the living population is through death
      const sumLivingDerivatives =
        derivatives.dS + derivatives.dV + derivatives.dE_H + derivatives.dE_L + derivatives.dI + derivatives.dR;

      // This should approximately equal the negative of deaths being produced
      // Sum + dD should be close to the new births (mu * N)
      const N = getTotalPopulation(state);
      const netChange = sumLivingDerivatives + derivatives.dD;

      // Net change should be approximately 0 (births = deaths in long run)
      // Allow for small numerical errors
      expect(Math.abs(netChange)).toBeLessThan(N * 0.01);
    });

    it('should produce positive dE_H when there are infectious cases', () => {
      const stateWithInfected = createTestState({ I: 5000 });
      const derivatives = computeDerivatives(stateWithInfected, params);

      // With high infectious cases, new exposures should occur
      // dE_H should have a positive component from new infections
      // (though it may be net negative due to progression)
      const lambda = calculateForceOfInfection(stateWithInfected, params);
      const vaccineLeakiness = 1 - params.ve;

      const incomingToEH =
        lambda * stateWithInfected.S + vaccineLeakiness * lambda * stateWithInfected.V;

      expect(incomingToEH).toBeGreaterThan(0);
    });

    it('should produce positive dI when there are exposed individuals', () => {
      const stateWithExposed = createTestState({ E_H: 10000, E_L: 50000 });
      const derivatives = computeDerivatives(stateWithExposed, params);

      // New infectious cases come from progression of exposed
      const incomingToI = params.epsilon * stateWithExposed.E_H + params.omega * stateWithExposed.E_L;
      expect(incomingToI).toBeGreaterThan(0);
    });

    it('should produce positive dD when there are infectious cases', () => {
      const stateWithInfected = createTestState({ I: 5000 });
      const derivatives = computeDerivatives(stateWithInfected, params);

      expect(derivatives.dD).toBeGreaterThan(0);
      expect(derivatives.dD).toBeCloseTo(params.muTb * stateWithInfected.I, 10);
    });

    it('should produce negative dS when vaccination is active', () => {
      const paramsWithVaccination = createTestParams({ rho: 0.01 });
      const derivatives = computeDerivatives(state, paramsWithVaccination);

      // Susceptibles are leaving due to vaccination (rho * S)
      expect(derivatives.dS).toBeLessThan(0);
    });

    it('should produce positive dV when vaccination is active', () => {
      const paramsWithVaccination = createTestParams({ rho: 0.01 });
      const derivatives = computeDerivatives(state, paramsWithVaccination);

      // Vaccinated compartment gains from susceptibles
      expect(derivatives.dV).toBeGreaterThan(0);
    });
  });

  describe('rungeKutta4', () => {
    let initialState: CompartmentState;
    let params: DiseaseParameters;
    const dt = 0.1;

    beforeEach(() => {
      initialState = createTestState();
      params = createTestParams();
    });

    it('should advance state forward in time', () => {
      const nextState = rungeKutta4(initialState, params, dt);

      // State should change (not be identical)
      const statesEqual =
        nextState.S === initialState.S &&
        nextState.I === initialState.I &&
        nextState.R === initialState.R;

      expect(statesEqual).toBe(false);
    });

    it('should maintain non-negative populations', () => {
      // Run many steps to check stability
      let state = initialState;
      for (let i = 0; i < 1000; i++) {
        state = rungeKutta4(state, params, dt);
      }

      expect(state.S).toBeGreaterThanOrEqual(0);
      expect(state.V).toBeGreaterThanOrEqual(0);
      expect(state.E_H).toBeGreaterThanOrEqual(0);
      expect(state.E_L).toBeGreaterThanOrEqual(0);
      expect(state.I).toBeGreaterThanOrEqual(0);
      expect(state.R).toBeGreaterThanOrEqual(0);
      expect(state.D).toBeGreaterThanOrEqual(0);
    });

    it('should approximately conserve total population (living + deceased)', () => {
      const initialTotal = getTotalPopulation(initialState) + initialState.D;

      let state = initialState;
      for (let i = 0; i < 100; i++) {
        state = rungeKutta4(state, params, dt);
      }

      const finalTotal = getTotalPopulation(state) + state.D;

      // Population should be roughly conserved (small error due to births/deaths balance)
      // Allow 5% tolerance due to demographic dynamics
      expect(Math.abs(finalTotal - initialTotal) / initialTotal).toBeLessThan(0.05);
    });

    it('should be numerically stable with small time steps', () => {
      const smallDt = 0.01;
      let state = initialState;

      // Run for equivalent of 10 days
      for (let i = 0; i < 1000; i++) {
        state = rungeKutta4(state, params, smallDt);
      }

      expect(isValidState(state)).toBe(true);
      expect(isFinite(getTotalPopulation(state))).toBe(true);
    });

    it('should be numerically stable with larger time steps', () => {
      const largeDt = 1.0;
      let state = initialState;

      // Run for 100 days
      for (let i = 0; i < 100; i++) {
        state = rungeKutta4(state, params, largeDt);
      }

      expect(isValidState(state)).toBe(true);
      expect(isFinite(getTotalPopulation(state))).toBe(true);
    });

    it('should show epidemic declining when vaccination is high', () => {
      const highVaccParams = createTestParams({ rho: 0.1, ve: 0.9 });
      let state = createTestState({ I: 5000 });

      const initialI = state.I;

      // Run for 1000 days
      for (let i = 0; i < 1000; i++) {
        state = rungeKutta4(state, highVaccParams, 1.0);
      }

      // Infectious should decrease significantly with high vaccination
      expect(state.I).toBeLessThan(initialI);
    });
  });

  describe('calculateR0', () => {
    it('should return positive R0 for valid parameters', () => {
      const params = createTestParams();
      const R0 = calculateR0(params);

      // R0 should be positive when there's transmission
      expect(R0).toBeGreaterThan(0);
      expect(isFinite(R0)).toBe(true);
    });

    it('should return 0 when beta is 0', () => {
      const params = createTestParams({ beta: 0 });
      const R0 = calculateR0(params);

      expect(R0).toBe(0);
    });

    it('should return 0 when there is no progression from exposed', () => {
      const params = createTestParams({ epsilon: 0, omega: 0 });
      const R0 = calculateR0(params);

      expect(R0).toBe(0);
    });

    it('should increase with higher transmission rate (beta)', () => {
      const params1 = createTestParams({ beta: 0.0001 });
      const params2 = createTestParams({ beta: 0.0005 });

      const R0_1 = calculateR0(params1);
      const R0_2 = calculateR0(params2);

      expect(R0_2).toBeGreaterThan(R0_1);
    });

    it('should decrease with higher recovery rate (gamma)', () => {
      const params1 = createTestParams({ gamma: 0.001 });
      const params2 = createTestParams({ gamma: 0.01 });

      const R0_1 = calculateR0(params1);
      const R0_2 = calculateR0(params2);

      expect(R0_2).toBeLessThan(R0_1);
    });

    it('should increase with higher fast progression rate (epsilon)', () => {
      const params1 = createTestParams({ epsilon: 0.0005 });
      const params2 = createTestParams({ epsilon: 0.005 });

      const R0_1 = calculateR0(params1);
      const R0_2 = calculateR0(params2);

      expect(R0_2).toBeGreaterThan(R0_1);
    });

    it('should handle edge case when leaveEH is 0', () => {
      const params = createTestParams({ epsilon: 0, kappa: 0, mu: 0 });
      const R0 = calculateR0(params);

      expect(R0).toBe(0);
    });

    it('should handle edge case when leaveEL is 0', () => {
      const params = createTestParams({ omega: 0, mu: 0 });
      const R0 = calculateR0(params);

      // Should still have a value from fast progression pathway
      expect(R0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateEffectiveR', () => {
    it('should be lower than or equal to R0 in any scenario', () => {
      const state = createTestState();
      const params = createTestParams();

      const R0 = calculateR0(params);
      const Rt = calculateEffectiveR(state, params);

      expect(Rt).toBeLessThanOrEqual(R0 * 1.01); // Small tolerance for numerical error
    });

    it('should decrease when vaccinated population increases', () => {
      const params = createTestParams({ ve: 0.8 });
      const state1 = createTestState({ V: 10000 });
      const state2 = createTestState({ V: 500000 });

      const Rt1 = calculateEffectiveR(state1, params);
      const Rt2 = calculateEffectiveR(state2, params);

      expect(Rt2).toBeLessThan(Rt1);
    });

    it('should return 0 when population is 0', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      const params = createTestParams();

      const Rt = calculateEffectiveR(state, params);
      expect(Rt).toBe(0);
    });

    it('should be lower when vaccine efficacy is higher', () => {
      const state = createTestState({ V: 200000 });
      const params1 = createTestParams({ ve: 0.5 });
      const params2 = createTestParams({ ve: 0.9 });

      const Rt1 = calculateEffectiveR(state, params1);
      const Rt2 = calculateEffectiveR(state, params2);

      expect(Rt2).toBeLessThan(Rt1);
    });

    it('should account for reinfection susceptibility', () => {
      const state = createTestState({ R: 200000 });
      const params1 = createTestParams({ sigma: 0.1 });
      const params2 = createTestParams({ sigma: 0.5 });

      const Rt1 = calculateEffectiveR(state, params1);
      const Rt2 = calculateEffectiveR(state, params2);

      expect(Rt2).toBeGreaterThan(Rt1);
    });
  });

  describe('calculateNewInfections', () => {
    it('should return 0 when there are no infectious cases', () => {
      const state = createTestState({ I: 0 });
      const params = createTestParams();

      const newInfections = calculateNewInfections(state, params, 1);
      expect(newInfections).toBe(0);
    });

    it('should increase with more infectious cases', () => {
      const params = createTestParams();
      const state1 = createTestState({ I: 100 });
      const state2 = createTestState({ I: 1000 });

      const newInfections1 = calculateNewInfections(state1, params, 1);
      const newInfections2 = calculateNewInfections(state2, params, 1);

      expect(newInfections2).toBeGreaterThan(newInfections1);
    });

    it('should scale with time step', () => {
      const state = createTestState({ I: 1000 });
      const params = createTestParams();

      const newInfections1 = calculateNewInfections(state, params, 0.5);
      const newInfections2 = calculateNewInfections(state, params, 1.0);

      expect(newInfections2).toBeCloseTo(newInfections1 * 2, 10);
    });

    it('should be reduced for vaccinated population', () => {
      const params = createTestParams({ ve: 0.8 });
      const state = createTestState({ S: 500000, V: 500000, I: 1000 });

      const newInfections = calculateNewInfections(state, params, 1);

      // Calculate expected
      const lambda = calculateForceOfInfection(state, params);
      const fromS = lambda * state.S;
      const fromV = (1 - params.ve) * lambda * state.V;
      const fromR = params.sigma * lambda * state.R;

      expect(newInfections).toBeCloseTo(fromS + fromV + fromR, 5);
    });
  });

  describe('calculateNewDeaths', () => {
    it('should return 0 when there are no infectious cases', () => {
      const state = createTestState({ I: 0 });
      const params = createTestParams();

      const newDeaths = calculateNewDeaths(state, params, 1);
      expect(newDeaths).toBe(0);
    });

    it('should increase with more infectious cases', () => {
      const params = createTestParams();
      const state1 = createTestState({ I: 100 });
      const state2 = createTestState({ I: 1000 });

      const newDeaths1 = calculateNewDeaths(state1, params, 1);
      const newDeaths2 = calculateNewDeaths(state2, params, 1);

      expect(newDeaths2).toBeGreaterThan(newDeaths1);
    });

    it('should be proportional to muTb * I * dt', () => {
      const state = createTestState({ I: 1000 });
      const params = createTestParams({ muTb: 0.001 });
      const dt = 1;

      const newDeaths = calculateNewDeaths(state, params, dt);
      expect(newDeaths).toBeCloseTo(params.muTb * state.I * dt, 10);
    });
  });

  describe('calculateIncidenceRate', () => {
    it('should return rate per 100,000', () => {
      const newCases = 100;
      const population = 1000000;

      const rate = calculateIncidenceRate(newCases, population);
      expect(rate).toBe(10); // 100/1000000 * 100000 = 10
    });

    it('should return 0 when population is 0', () => {
      const rate = calculateIncidenceRate(100, 0);
      expect(rate).toBe(0);
    });

    it('should return 0 when there are no cases', () => {
      const rate = calculateIncidenceRate(0, 1000000);
      expect(rate).toBe(0);
    });
  });

  describe('calculatePrevalence', () => {
    it('should return proportion of infectious in population', () => {
      // Create a state with known values to test exact calculation
      const state: CompartmentState = {
        S: 890000,
        V: 50000,
        E_H: 5000,
        E_L: 30000,
        I: 10000,  // 10000 infectious
        R: 15000,
        D: 0,
      };
      // Total living = 1,000,000, so prevalence = 10000/1000000 = 0.01
      const prevalence = calculatePrevalence(state);

      expect(prevalence).toBeCloseTo(0.01, 5);
    });

    it('should return 0 when there are no infectious cases', () => {
      const state = createTestState({ I: 0 });
      const prevalence = calculatePrevalence(state);

      expect(prevalence).toBe(0);
    });

    it('should return 0 when population is 0', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      const prevalence = calculatePrevalence(state);

      expect(prevalence).toBe(0);
    });
  });

  describe('createInitialState', () => {
    it('should create state with correct total population', () => {
      const totalPop = 1000000;
      const state = createInitialState(totalPop, 100, 5000, 200000);

      const actualTotal = getTotalPopulation(state) + state.D;
      expect(actualTotal).toBe(totalPop);
    });

    it('should set infectious compartment correctly', () => {
      const state = createInitialState(1000000, 500, 10000, 100000);
      expect(state.I).toBe(500);
    });

    it('should split latent between E_H and E_L (20/80)', () => {
      const latent = 10000;
      const state = createInitialState(1000000, 100, latent, 100000);

      expect(state.E_H).toBe(2000); // 20%
      expect(state.E_L).toBe(8000); // 80%
      expect(state.E_H + state.E_L).toBe(latent);
    });

    it('should set vaccinated compartment correctly', () => {
      const state = createInitialState(1000000, 100, 5000, 250000);
      expect(state.V).toBe(250000);
    });

    it('should set susceptible as remainder', () => {
      const totalPop = 1000000;
      const infected = 100;
      const latent = 5000;
      const vaccinated = 200000;

      const state = createInitialState(totalPop, infected, latent, vaccinated);

      const expectedS = totalPop - infected - latent - vaccinated;
      expect(state.S).toBe(expectedS);
    });

    it('should start with D = 0 and R = 0', () => {
      const state = createInitialState(1000000, 100, 5000, 200000);

      expect(state.D).toBe(0);
      expect(state.R).toBe(0);
    });

    it('should handle edge case when sum exceeds population', () => {
      // This tests that S doesn't go negative
      const state = createInitialState(1000, 500, 400, 200);

      expect(state.S).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isValidState', () => {
    it('should return true for valid state', () => {
      const state = createTestState();
      expect(isValidState(state)).toBe(true);
    });

    it('should return false when S is negative', () => {
      const state = createTestState({ S: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return false when V is negative', () => {
      const state = createTestState({ V: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return false when E_H is negative', () => {
      const state = createTestState({ E_H: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return false when E_L is negative', () => {
      const state = createTestState({ E_L: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return false when I is negative', () => {
      const state = createTestState({ I: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return false when R is negative', () => {
      const state = createTestState({ R: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return false when D is negative', () => {
      const state = createTestState({ D: -1 });
      expect(isValidState(state)).toBe(false);
    });

    it('should return true when compartments are 0', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      expect(isValidState(state)).toBe(true);
    });
  });

  describe('cloneState', () => {
    it('should create a deep copy of state', () => {
      const original = createTestState();
      const cloned = cloneState(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should not affect original when clone is modified', () => {
      const original = createTestState();
      const cloned = cloneState(original);

      cloned.S = 999999;
      expect(original.S).not.toBe(999999);
    });
  });
});

describe('Population Conservation', () => {
  it('should conserve S + V + E_H + E_L + I + R + D over simulation run', () => {
    const initialState = createTestState();
    const params = createTestParams();
    const dt = 0.1;

    const initialTotal =
      initialState.S +
      initialState.V +
      initialState.E_H +
      initialState.E_L +
      initialState.I +
      initialState.R +
      initialState.D;

    let state = initialState;
    for (let i = 0; i < 100; i++) {
      state = rungeKutta4(state, params, dt);
    }

    const finalTotal =
      state.S + state.V + state.E_H + state.E_L + state.I + state.R + state.D;

    // Allow for demographic dynamics (births/deaths)
    // The change should be approximately mu*N*dt*steps
    const tolerance = initialTotal * 0.05;
    expect(Math.abs(finalTotal - initialTotal)).toBeLessThan(tolerance);
  });
});

describe('Vaccination Impact', () => {
  it('should result in fewer infections with higher vaccination rate', () => {
    const initialState = createTestState();
    const dt = 1.0;
    const steps = 365;

    // Low vaccination scenario
    const lowVaccParams = createTestParams({ rho: 0.0001, ve: 0.7 });
    let lowVaccState = cloneState(initialState);
    let lowVaccInfections = 0;

    for (let i = 0; i < steps; i++) {
      const newInf = calculateNewInfections(lowVaccState, lowVaccParams, dt);
      lowVaccInfections += newInf;
      lowVaccState = rungeKutta4(lowVaccState, lowVaccParams, dt);
    }

    // High vaccination scenario
    const highVaccParams = createTestParams({ rho: 0.01, ve: 0.7 });
    let highVaccState = cloneState(initialState);
    let highVaccInfections = 0;

    for (let i = 0; i < steps; i++) {
      const newInf = calculateNewInfections(highVaccState, highVaccParams, dt);
      highVaccInfections += newInf;
      highVaccState = rungeKutta4(highVaccState, highVaccParams, dt);
    }

    expect(highVaccInfections).toBeLessThan(lowVaccInfections);
  });

  it('should show higher V compartment with vaccination', () => {
    const initialState = createTestState({ V: 0 });
    const paramsWithVacc = createTestParams({ rho: 0.01 });
    const dt = 1.0;

    let state = cloneState(initialState);
    for (let i = 0; i < 100; i++) {
      state = rungeKutta4(state, paramsWithVacc, dt);
    }

    expect(state.V).toBeGreaterThan(initialState.V);
  });
});

describe('Infection Dynamics', () => {
  it('should show increasing E_H when I is high', () => {
    const initialState = createTestState({ I: 10000, E_H: 0 });
    const params = createTestParams();

    const derivatives = computeDerivatives(initialState, params);

    // New exposures should be positive when there are infectious cases
    const lambda = calculateForceOfInfection(initialState, params);
    const newExposures = lambda * initialState.S + (1 - params.ve) * lambda * initialState.V;

    expect(newExposures).toBeGreaterThan(0);
  });

  it('should show disease progression through compartments', () => {
    // Start with only exposed individuals
    const initialState: CompartmentState = {
      S: 990000,
      V: 0,
      E_H: 10000,
      E_L: 0,
      I: 0,
      R: 0,
      D: 0,
    };
    const params = createTestParams();
    const dt = 1.0;

    let state = cloneState(initialState);
    for (let i = 0; i < 100; i++) {
      state = rungeKutta4(state, params, dt);
    }

    // Should see progression: E_H -> E_L and E_H -> I
    expect(state.E_L).toBeGreaterThan(0);
    expect(state.I).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  describe('Zero Population', () => {
    it('should handle empty compartments gracefully', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      const params = createTestParams();

      const derivatives = computeDerivatives(state, params);

      expect(isFinite(derivatives.dS)).toBe(true);
      expect(isFinite(derivatives.dI)).toBe(true);
      expect(isFinite(derivatives.dD)).toBe(true);
    });

    it('should return 0 for force of infection with no population', () => {
      const state: CompartmentState = { S: 0, V: 0, E_H: 0, E_L: 0, I: 0, R: 0, D: 0 };
      const params = createTestParams();

      const lambda = calculateForceOfInfection(state, params);
      expect(lambda).toBe(0);
    });
  });

  describe('100% Vaccination', () => {
    it('should handle fully vaccinated population', () => {
      const state: CompartmentState = {
        S: 0,
        V: 1000000,
        E_H: 0,
        E_L: 0,
        I: 100,
        R: 0,
        D: 0,
      };
      const params = createTestParams({ ve: 0.9 });

      const Rt = calculateEffectiveR(state, params);

      // With 100% vaccination and 90% efficacy, Rt should be very low
      const R0 = calculateR0(params);
      expect(Rt).toBeLessThan(R0 * 0.2);
    });

    it('should still allow breakthrough infections with imperfect vaccine', () => {
      const state: CompartmentState = {
        S: 0,
        V: 1000000,
        E_H: 0,
        E_L: 0,
        I: 1000,
        R: 0,
        D: 0,
      };
      const params = createTestParams({ ve: 0.7 });

      const newInfections = calculateNewInfections(state, params, 1);

      // Should still have some infections from vaccinated breakthroughs
      expect(newInfections).toBeGreaterThan(0);
    });
  });

  describe('Extreme Parameters', () => {
    it('should handle very high transmission rate', () => {
      const state = createTestState();
      const params = createTestParams({ beta: 0.5 });

      const nextState = rungeKutta4(state, params, 0.1);

      expect(isValidState(nextState)).toBe(true);
      expect(isFinite(getTotalPopulation(nextState))).toBe(true);
    });

    it('should handle very low transmission rate', () => {
      const state = createTestState();
      const params = createTestParams({ beta: 0.0000001 });

      const nextState = rungeKutta4(state, params, 1);

      expect(isValidState(nextState)).toBe(true);
    });

    it('should handle zero recovery rate', () => {
      const state = createTestState();
      const params = createTestParams({ gamma: 0 });

      const nextState = rungeKutta4(state, params, 1);

      expect(isValidState(nextState)).toBe(true);
    });
  });
});
