/**
 * SEIR Model Implementation for TB Simulation
 *
 * This module implements the extended SEIR compartmental model for tuberculosis,
 * including two-stage latency (high-risk and low-risk), vaccination effects,
 * and reinfection dynamics specific to TB epidemiology.
 *
 * Compartments:
 * - S: Susceptible (unvaccinated, never infected)
 * - V: Vaccinated (BCG with partial protection)
 * - E_H: Exposed High-risk (recent infection, higher progression risk)
 * - E_L: Exposed Low-risk (stable latent TB)
 * - I: Infectious (active TB disease)
 * - R: Recovered (treated or self-cured)
 * - D: Deceased (cumulative TB deaths)
 */

import type { CompartmentState, DiseaseParameters } from '@/types/simulation';

/**
 * Represents the rate of change for each compartment
 */
export interface CompartmentDerivatives {
  /** Rate of change for Susceptible compartment */
  dS: number;
  /** Rate of change for Vaccinated compartment */
  dV: number;
  /** Rate of change for Exposed High-risk compartment */
  dE_H: number;
  /** Rate of change for Exposed Low-risk compartment */
  dE_L: number;
  /** Rate of change for Infectious compartment */
  dI: number;
  /** Rate of change for Recovered compartment */
  dR: number;
  /** Rate of change for Deceased compartment */
  dD: number;
}

/**
 * Calculates the total living population from compartment state.
 * Excludes deceased individuals from the count.
 *
 * @param state - Current compartment state
 * @returns Total living population (N = S + V + E_H + E_L + I + R)
 *
 * @example
 * ```ts
 * const state: CompartmentState = { S: 1000, V: 500, E_H: 10, E_L: 50, I: 5, R: 100, D: 2 };
 * const N = getTotalPopulation(state); // Returns 1665
 * ```
 */
export function getTotalPopulation(state: CompartmentState): number {
  return state.S + state.V + state.E_H + state.E_L + state.I + state.R;
}

/**
 * Adds two compartment states element-wise.
 * Useful for combining derivatives or state increments.
 *
 * @param a - First compartment state
 * @param b - Second compartment state
 * @returns New compartment state with summed values
 *
 * @example
 * ```ts
 * const state1: CompartmentState = { S: 100, V: 50, E_H: 5, E_L: 20, I: 3, R: 10, D: 1 };
 * const state2: CompartmentState = { S: 10, V: 5, E_H: 1, E_L: 2, I: 0, R: 1, D: 0 };
 * const combined = addStates(state1, state2);
 * // Returns { S: 110, V: 55, E_H: 6, E_L: 22, I: 3, R: 11, D: 1 }
 * ```
 */
export function addStates(
  a: CompartmentState,
  b: CompartmentState
): CompartmentState {
  return {
    S: a.S + b.S,
    V: a.V + b.V,
    E_H: a.E_H + b.E_H,
    E_L: a.E_L + b.E_L,
    I: a.I + b.I,
    R: a.R + b.R,
    D: a.D + b.D,
  };
}

/**
 * Scales a compartment state by a scalar factor.
 * Useful for Runge-Kutta intermediate steps.
 *
 * @param state - Compartment state to scale
 * @param factor - Scalar multiplier
 * @returns New compartment state with scaled values
 *
 * @example
 * ```ts
 * const state: CompartmentState = { S: 100, V: 50, E_H: 10, E_L: 20, I: 5, R: 10, D: 2 };
 * const scaled = scaleState(state, 0.5);
 * // Returns { S: 50, V: 25, E_H: 5, E_L: 10, I: 2.5, R: 5, D: 1 }
 * ```
 */
export function scaleState(
  state: CompartmentState,
  factor: number
): CompartmentState {
  return {
    S: state.S * factor,
    V: state.V * factor,
    E_H: state.E_H * factor,
    E_L: state.E_L * factor,
    I: state.I * factor,
    R: state.R * factor,
    D: state.D * factor,
  };
}

/**
 * Calculates the force of infection (lambda).
 * Represents the per-capita rate at which susceptible individuals become infected.
 *
 * @param state - Current compartment state
 * @param params - Disease parameters containing transmission rate (beta)
 * @returns Force of infection value (lambda = beta * I / N)
 *
 * @example
 * ```ts
 * const lambda = calculateForceOfInfection(state, params);
 * ```
 */
export function calculateForceOfInfection(
  state: CompartmentState,
  params: DiseaseParameters
): number {
  const N = getTotalPopulation(state);
  if (N === 0) return 0;
  return (params.beta * state.I) / N;
}

/**
 * Computes the derivatives (rates of change) for all compartments.
 *
 * Implements the TB-specific SEIR differential equations:
 * - dS/dt = -λS - ρS + μN - μS + σλR
 * - dV/dt = ρS - (1-ε_v)λV - μV
 * - dE_H/dt = λS + (1-ε_v)λV - (ε + κ + μ)E_H
 * - dE_L/dt = κE_H - (ω + μ)E_L
 * - dI/dt = εE_H + ωE_L - (γ + μ + μ_TB)I
 * - dR/dt = γI - σλR - μR
 * - dD/dt = μ_TB × I
 *
 * Where:
 * - λ (lambda) = force of infection = β × I / N
 * - β (beta) = transmission rate
 * - ρ (rho) = vaccination rate
 * - ε (epsilon) = fast progression rate (E_H to I)
 * - κ (kappa) = stabilization rate (E_H to E_L)
 * - ω (omega) = reactivation rate (E_L to I)
 * - γ (gamma) = recovery rate
 * - μ (mu) = natural mortality rate
 * - μ_TB (muTb) = TB-specific mortality rate
 * - ε_v (ve) = vaccine efficacy
 * - σ (sigma) = reinfection susceptibility
 *
 * @param state - Current compartment state
 * @param params - Disease parameters
 * @returns Derivatives for all compartments
 *
 * @example
 * ```ts
 * const derivatives = computeDerivatives(currentState, diseaseParams);
 * // Use derivatives for numerical integration
 * ```
 */
export function computeDerivatives(
  state: CompartmentState,
  params: DiseaseParameters
): CompartmentDerivatives {
  const N = getTotalPopulation(state);
  const lambda = calculateForceOfInfection(state, params);

  const { S, V, E_H, E_L, I, R } = state;
  const { epsilon, kappa, omega, gamma, mu, muTb, rho, ve, sigma } = params;

  // Vaccine leakiness factor (1 - efficacy)
  const vaccineLeakiness = 1 - ve;

  // dS/dt = -λS - ρS + μN - μS + σλR
  // New births enter susceptible (μN), susceptibles leave via infection (λS),
  // vaccination (ρS), natural death (μS), and recovered can be reinfected (σλR)
  const dS = -lambda * S - rho * S + mu * N - mu * S + sigma * lambda * R;

  // dV/dt = ρS - (1-ε_v)λV - μV
  // Vaccinated individuals enter from susceptibles, leave via breakthrough
  // infection (reduced by vaccine efficacy) and natural death
  const dV = rho * S - vaccineLeakiness * lambda * V - mu * V;

  // dE_H/dt = λS + (1-ε_v)λV - (ε + κ + μ)E_H
  // High-risk exposed enter from new infections (susceptible and vaccinated),
  // leave via fast progression to active TB (ε), stabilization to low-risk (κ),
  // and natural death (μ)
  const dE_H =
    lambda * S +
    vaccineLeakiness * lambda * V -
    (epsilon + kappa + mu) * E_H;

  // dE_L/dt = κE_H - (ω + μ)E_L
  // Low-risk exposed enter from stabilization of high-risk,
  // leave via reactivation (ω) and natural death (μ)
  const dE_L = kappa * E_H - (omega + mu) * E_L;

  // dI/dt = εE_H + ωE_L - (γ + μ + μ_TB)I
  // Infectious cases enter from progression of both exposed compartments,
  // leave via recovery (γ), natural death (μ), and TB death (μ_TB)
  const dI = epsilon * E_H + omega * E_L - (gamma + mu + muTb) * I;

  // dR/dt = γI - σλR - μR
  // Recovered enter from treatment/recovery of infectious cases,
  // leave via reinfection (σλR) and natural death (μR)
  const dR = gamma * I - sigma * lambda * R - mu * R;

  // dD/dt = μ_TB × I
  // Deaths accumulate from TB-specific mortality of infectious cases
  const dD = muTb * I;

  return { dS, dV, dE_H, dE_L, dI, dR, dD };
}

/**
 * Converts derivatives to a compartment state format for numerical integration.
 *
 * @param derivatives - Computed derivatives
 * @returns Compartment state representation of derivatives
 */
function derivativesToState(derivatives: CompartmentDerivatives): CompartmentState {
  return {
    S: derivatives.dS,
    V: derivatives.dV,
    E_H: derivatives.dE_H,
    E_L: derivatives.dE_L,
    I: derivatives.dI,
    R: derivatives.dR,
    D: derivatives.dD,
  };
}


/**
 * Performs one step of 4th-order Runge-Kutta numerical integration.
 *
 * The RK4 method provides accurate numerical integration with error O(dt^5).
 * It computes four intermediate slopes (k1, k2, k3, k4) and combines them
 * using weighted average for the final state update.
 *
 * Algorithm:
 * 1. k1 = f(t, y)
 * 2. k2 = f(t + dt/2, y + dt*k1/2)
 * 3. k3 = f(t + dt/2, y + dt*k2/2)
 * 4. k4 = f(t + dt, y + dt*k3)
 * 5. y(t + dt) = y(t) + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
 *
 * @param state - Current compartment state at time t
 * @param params - Disease parameters
 * @param dt - Time step size (in days)
 * @returns Updated compartment state at time t + dt
 *
 * @example
 * ```ts
 * const currentState: CompartmentState = { S: 1000, V: 100, E_H: 10, E_L: 50, I: 5, R: 20, D: 0 };
 * const params: DiseaseParameters = { ... };
 * const dt = 0.1; // 0.1 day time step
 *
 * const nextState = rungeKutta4(currentState, params, dt);
 * ```
 */
export function rungeKutta4(
  state: CompartmentState,
  params: DiseaseParameters,
  dt: number
): CompartmentState {
  // k1 = f(t, y) - derivatives at current state
  const k1Deriv = computeDerivatives(state, params);
  const k1 = derivativesToState(k1Deriv);

  // k2 = f(t + dt/2, y + dt*k1/2) - derivatives at midpoint using k1
  const midState1 = addStates(state, scaleState(k1, dt / 2));
  const k2Deriv = computeDerivatives(midState1, params);
  const k2 = derivativesToState(k2Deriv);

  // k3 = f(t + dt/2, y + dt*k2/2) - derivatives at midpoint using k2
  const midState2 = addStates(state, scaleState(k2, dt / 2));
  const k3Deriv = computeDerivatives(midState2, params);
  const k3 = derivativesToState(k3Deriv);

  // k4 = f(t + dt, y + dt*k3) - derivatives at end using k3
  const endState = addStates(state, scaleState(k3, dt));
  const k4Deriv = computeDerivatives(endState, params);
  const k4 = derivativesToState(k4Deriv);

  // Combine: y(t + dt) = y(t) + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
  const weightedSum = addStates(
    addStates(k1, scaleState(k2, 2)),
    addStates(scaleState(k3, 2), k4)
  );

  const increment = scaleState(weightedSum, dt / 6);
  const newState = addStates(state, increment);

  // Ensure non-negative populations (numerical stability)
  return ensureNonNegative(newState);
}

/**
 * Ensures all compartment values are non-negative.
 * Small negative values can occur due to numerical precision issues.
 *
 * @param state - Compartment state to validate
 * @returns Compartment state with all values >= 0
 */
function ensureNonNegative(state: CompartmentState): CompartmentState {
  return {
    S: Math.max(0, state.S),
    V: Math.max(0, state.V),
    E_H: Math.max(0, state.E_H),
    E_L: Math.max(0, state.E_L),
    I: Math.max(0, state.I),
    R: Math.max(0, state.R),
    D: Math.max(0, state.D),
  };
}

/**
 * Calculates the basic reproduction number (R0) for TB.
 *
 * R0 represents the average number of secondary infections caused by
 * a single infectious individual in a completely susceptible population.
 *
 * For the extended SEIR model with two-stage latency:
 * R0 = β × [ε/(ε + κ + μ) + κ/(ε + κ + μ) × ω/(ω + μ)] / (γ + μ + μ_TB)
 *
 * This accounts for:
 * - Direct fast progression from E_H to I (probability ε/(ε + κ + μ))
 * - Indirect slow progression via E_L (probability κ/(ε + κ + μ) × ω/(ω + μ))
 * - Duration of infectiousness (1/(γ + μ + μ_TB))
 *
 * @param params - Disease parameters
 * @returns Basic reproduction number R0
 *
 * @example
 * ```ts
 * const R0 = calculateR0(params);
 * console.log(`Basic reproduction number: ${R0.toFixed(2)}`);
 * // For TB, typically R0 is between 1.3 and 2.2
 * ```
 */
export function calculateR0(params: DiseaseParameters): number {
  const { beta, epsilon, kappa, omega, gamma, mu, muTb } = params;

  // Rate of leaving E_H compartment
  const leaveEH = epsilon + kappa + mu;
  if (leaveEH === 0) return 0;

  // Probability of fast progression to I from E_H
  const probFastProgression = epsilon / leaveEH;

  // Rate of leaving E_L compartment
  const leaveEL = omega + mu;
  if (leaveEL === 0) return 0;

  // Probability of slow progression: first stabilize (κ/leaveEH), then reactivate (ω/leaveEL)
  const probSlowProgression = (kappa / leaveEH) * (omega / leaveEL);

  // Total probability of eventually becoming infectious
  const probInfectious = probFastProgression + probSlowProgression;

  // Average duration of infectiousness
  const infectiousPeriod = 1 / (gamma + mu + muTb);
  if (infectiousPeriod === 0) return 0;

  // R0 = transmission rate × probability of becoming infectious × duration of infectiousness
  return beta * probInfectious * infectiousPeriod;
}

/**
 * Calculates the effective reproduction number (Rt) at current state.
 *
 * Rt represents the average number of secondary infections at the current
 * time point, accounting for:
 * - Depletion of susceptible population
 * - Vaccination coverage and efficacy
 * - Reinfection of recovered individuals
 *
 * Rt = R0 × (S + (1 - ve) × V + σ × R) / N
 *
 * When Rt < 1, the epidemic is declining.
 * When Rt > 1, the epidemic is growing.
 *
 * @param state - Current compartment state
 * @param params - Disease parameters
 * @returns Effective reproduction number Rt
 *
 * @example
 * ```ts
 * const Rt = calculateEffectiveR(currentState, params);
 * if (Rt < 1) {
 *   console.log('Epidemic is declining');
 * } else {
 *   console.log('Epidemic is growing');
 * }
 * ```
 */
export function calculateEffectiveR(
  state: CompartmentState,
  params: DiseaseParameters
): number {
  const N = getTotalPopulation(state);
  if (N === 0) return 0;

  const R0 = calculateR0(params);

  // Effective susceptible fraction:
  // - Full susceptibles (S)
  // - Partially protected vaccinated ((1 - ve) × V)
  // - Partially susceptible recovered (σ × R)
  const effectiveSusceptible =
    state.S + (1 - params.ve) * state.V + params.sigma * state.R;

  return R0 * (effectiveSusceptible / N);
}

/**
 * Calculates the number of new infections per time step.
 * Useful for tracking daily new cases in simulation metrics.
 *
 * @param state - Current compartment state
 * @param params - Disease parameters
 * @param dt - Time step size (in days)
 * @returns Number of new infections during this time step
 */
export function calculateNewInfections(
  state: CompartmentState,
  params: DiseaseParameters,
  dt: number
): number {
  const lambda = calculateForceOfInfection(state, params);
  const vaccineLeakiness = 1 - params.ve;

  // New infections from susceptible and vaccinated compartments
  const newFromS = lambda * state.S * dt;
  const newFromV = vaccineLeakiness * lambda * state.V * dt;
  const newFromR = params.sigma * lambda * state.R * dt;

  return newFromS + newFromV + newFromR;
}

/**
 * Calculates the number of new deaths per time step.
 * Useful for tracking daily new deaths in simulation metrics.
 *
 * @param state - Current compartment state
 * @param params - Disease parameters
 * @param dt - Time step size (in days)
 * @returns Number of new TB deaths during this time step
 */
export function calculateNewDeaths(
  state: CompartmentState,
  params: DiseaseParameters,
  dt: number
): number {
  return params.muTb * state.I * dt;
}

/**
 * Calculates the incidence rate per 100,000 population.
 * This is the standard epidemiological measure for comparing across populations.
 *
 * @param newCases - Number of new cases in the time period
 * @param population - Total population
 * @returns Incidence rate per 100,000
 */
export function calculateIncidenceRate(
  newCases: number,
  population: number
): number {
  if (population === 0) return 0;
  return (newCases / population) * 100000;
}

/**
 * Calculates the prevalence (proportion of population currently infectious).
 *
 * @param state - Current compartment state
 * @returns Prevalence as a decimal (0-1)
 */
export function calculatePrevalence(state: CompartmentState): number {
  const N = getTotalPopulation(state);
  if (N === 0) return 0;
  return state.I / N;
}

/**
 * Creates an initial compartment state for simulation.
 *
 * @param totalPopulation - Total population size
 * @param initialInfected - Initial number of infectious cases
 * @param initialLatent - Initial number of latent (exposed) cases
 * @param initialVaccinated - Initial number of vaccinated individuals
 * @returns Initial compartment state
 *
 * @example
 * ```ts
 * const initialState = createInitialState(1000000, 100, 5000, 200000);
 * ```
 */
export function createInitialState(
  totalPopulation: number,
  initialInfected: number,
  initialLatent: number,
  initialVaccinated: number
): CompartmentState {
  // Split latent cases between high-risk (recent) and low-risk (stable)
  // Assume 20% are in high-risk (recent) phase
  const latentHighRisk = Math.round(initialLatent * 0.2);
  const latentLowRisk = initialLatent - latentHighRisk;

  const susceptible =
    totalPopulation - initialInfected - initialLatent - initialVaccinated;

  return {
    S: Math.max(0, susceptible),
    V: initialVaccinated,
    E_H: latentHighRisk,
    E_L: latentLowRisk,
    I: initialInfected,
    R: 0,
    D: 0,
  };
}

/**
 * Validates that a compartment state is consistent (all non-negative).
 *
 * @param state - Compartment state to validate
 * @returns True if valid, false otherwise
 */
export function isValidState(state: CompartmentState): boolean {
  return (
    state.S >= 0 &&
    state.V >= 0 &&
    state.E_H >= 0 &&
    state.E_L >= 0 &&
    state.I >= 0 &&
    state.R >= 0 &&
    state.D >= 0
  );
}

/**
 * Clones a compartment state to avoid mutation.
 *
 * @param state - Compartment state to clone
 * @returns Deep copy of the state
 */
export function cloneState(state: CompartmentState): CompartmentState {
  return {
    S: state.S,
    V: state.V,
    E_H: state.E_H,
    E_L: state.E_L,
    I: state.I,
    R: state.R,
    D: state.D,
  };
}
