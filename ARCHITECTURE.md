# TB Infections Simulator - Architecture Document

## Executive Summary

This document defines the complete technical architecture for the UK TB Vaccination Simulator, an interactive web application that models tuberculosis spread based on vaccination rates and policy interventions. The simulator uses epidemiologically accurate SEIR compartmental modeling with real UK TB statistics.

**Target Users**: Public health officials, policymakers, educators, and the general public interested in understanding TB vaccination impact.

**Key Objective**: Demonstrate the UK's risk of losing WHO low-incidence TB status and visualize how vaccination policies can prevent disease spread.

---

## 1. Technology Stack

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router, SSR/SSG |
| React | 19.x | UI component library |
| TypeScript | 5.x | Type safety and developer experience |

**Justification**: Next.js provides optimal Vercel integration, server components for data loading, and API routes for simulation endpoints.

### Visualization Libraries

| Library | Purpose | Performance Target |
|---------|---------|-------------------|
| PixiJS | Agent-based WebGL visualization | 60fps @ 5000 agents |
| D3.js | Mathematical calculations, force layouts | N/A |
| React Simple Maps | UK choropleth map | 30fps interactions |
| Nivo | Statistical charts (line, bar) | Canvas rendering |
| Framer Motion | UI animations | 60fps |

### State Management

| Library | Purpose |
|---------|---------|
| Zustand | Simulation state, UI state |
| TanStack Query | Server state, data fetching |

### Styling

| Library | Purpose |
|---------|---------|
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component primitives |
| class-variance-authority | Component variants |

### Testing Stack

| Tool | Purpose | Coverage Target |
|------|---------|-----------------|
| Vitest | Unit tests | 95% (simulation) |
| React Testing Library | Integration tests | 80% |
| Playwright | E2E tests | 100% critical paths |
| MSW | API mocking | - |

### Additional Dependencies

| Library | Purpose |
|---------|---------|
| Zod | Runtime type validation |
| date-fns | Date manipulation |
| lodash-es | Utility functions |

---

## 2. Project Structure

```
tbinfections/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Main CI pipeline
│   │   ├── staging-deploy.yml        # Staging deployment
│   │   └── production-deploy.yml     # Production deployment
│   ├── dependabot.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Landing pages
│   │   │   ├── page.tsx              # Home
│   │   │   └── about/page.tsx
│   │   │
│   │   ├── simulator/                # Main simulator
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── scenarios/                # Pre-built scenarios
│   │   │   ├── page.tsx
│   │   │   └── [scenarioId]/page.tsx
│   │   │
│   │   ├── api/                      # API routes
│   │   │   ├── simulation/route.ts
│   │   │   └── data/
│   │   │       ├── uk-stats/route.ts
│   │   │       └── regions/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── simulation/               # Visualization
│   │   │   ├── SimulationCanvas.tsx
│   │   │   ├── UKMap.tsx
│   │   │   ├── AgentVisualization.tsx
│   │   │   ├── TransmissionEvent.tsx
│   │   │   ├── VaccinationShield.tsx
│   │   │   └── TimelineControl.tsx
│   │   │
│   │   ├── controls/                 # Configuration
│   │   │   ├── PopulationPanel.tsx
│   │   │   ├── VaccinationPanel.tsx
│   │   │   ├── PolicyPanel.tsx
│   │   │   └── ScenarioPresets.tsx
│   │   │
│   │   ├── dashboard/                # Statistics
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── InfectionChart.tsx
│   │   │   ├── DeathCounter.tsx
│   │   │   ├── PreventedCounter.tsx
│   │   │   └── CompartmentBreakdown.tsx
│   │   │
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── SimulatorLayout.tsx
│   │
│   ├── lib/
│   │   ├── simulation/               # Core engine
│   │   │   ├── engine.ts
│   │   │   ├── seir-model.ts
│   │   │   ├── tb-parameters.ts
│   │   │   ├── population.ts
│   │   │   ├── vaccination.ts
│   │   │   ├── policies.ts
│   │   │   └── worker.ts
│   │   │
│   │   ├── data/
│   │   │   ├── uk-regions.ts
│   │   │   ├── uk-tb-stats.ts
│   │   │   ├── demographic-data.ts
│   │   │   └── geojson/
│   │   │       └── uk-regions.json
│   │   │
│   │   ├── utils/
│   │   │   ├── math.ts
│   │   │   ├── random.ts
│   │   │   └── formatters.ts
│   │   │
│   │   └── constants/
│   │       ├── simulation.ts
│   │       └── scenarios.ts
│   │
│   ├── hooks/
│   │   ├── useSimulation.ts
│   │   ├── useSimulationWorker.ts
│   │   ├── useAnimationFrame.ts
│   │   └── useUKTBData.ts
│   │
│   ├── stores/
│   │   ├── simulation-store.ts
│   │   ├── settings-store.ts
│   │   └── ui-store.ts
│   │
│   └── types/
│       ├── simulation.ts
│       ├── population.ts
│       ├── policy.ts
│       └── geography.ts
│
├── public/
│   ├── data/
│   │   └── uk-tb-historical.json
│   └── images/
│
├── tests/
│   ├── unit/
│   │   ├── simulation/
│   │   │   ├── seir-model.test.ts
│   │   │   ├── engine.test.ts
│   │   │   └── vaccination.test.ts
│   │   └── utils/
│   │       └── math.test.ts
│   │
│   ├── integration/
│   │   ├── components/
│   │   │   ├── SimulationCanvas.test.tsx
│   │   │   └── PolicyPanel.test.tsx
│   │   └── hooks/
│   │       └── useSimulation.test.ts
│   │
│   └── e2e/
│       ├── simulation-flow.spec.ts
│       └── scenario-selection.spec.ts
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── CLAUDE.md
├── ARCHITECTURE.md
└── PLAN.md
```

---

## 3. Epidemiological Model

### Extended SEIR for TB

TB requires modifications to the standard SEIR model due to:
- Long latency periods (years to decades)
- Two-stage latency (high-risk vs stable)
- Reactivation from latent state
- Partial vaccine protection

```
                    ┌─────────────────────────────────────────────┐
                    │              EXTENDED TB-SEIR               │
                    └─────────────────────────────────────────────┘

                                      Vaccination (ρ)
                                           │
                                           ▼
┌───────────┐    Infection (β)    ┌───────────┐
│     S     │─────────────────────▶│    E_H    │  High-risk Latent
│Susceptible│                      │  Exposed   │  (Recent infection)
└───────────┘                      └───────────┘
      │                                   │
      │                                   │ Fast progression (ε)
      │                            ┌──────┴──────┐
      │                            ▼             │
      │                      ┌───────────┐       │
      │                      │     I     │       │ Slow progression (κ)
      │                      │ Infectious│       │
      │                      │  (Active) │       │
      │                      └───────────┘       │
      │                            │             │
      │         Treatment (γ)      │             ▼
      │                            │       ┌───────────┐
      │                            │       │    E_L    │  Low-risk Latent
      │                            │       │  (Stable) │
      │                            │       └───────────┘
      │                            │             │
      │                            ▼             │ Reactivation (ω)
      │                      ┌───────────┐       │
      │                      │     R     │◀──────┘
      │                      │ Recovered │
      │                      │/Treated   │
      │                      └───────────┘
      │                            │
      │    Reinfection (σβ)        │
      │◀───────────────────────────┘
      │
      ▼
┌───────────┐
│     V     │
│Vaccinated │ (Partial protection)
└───────────┘
```

### Compartment Definitions

| Compartment | Description |
|-------------|-------------|
| **S** | Susceptible - never infected, unvaccinated |
| **V** | Vaccinated - BCG vaccinated with partial protection |
| **E_H** | Exposed High-risk - recently infected, higher progression risk |
| **E_L** | Exposed Low-risk - latent TB, stable state |
| **I** | Infectious - active TB disease, can transmit |
| **R** | Recovered - treated or self-cured (can be reinfected) |
| **D** | Deceased - cumulative TB deaths |

### Differential Equations

```typescript
// Force of infection
λ = β × I / N

// Compartment derivatives
dS/dt = -λS - ρS + μN - μS + σλR
dV/dt = ρS - (1-ε_v)λV - μV
dE_H/dt = λS + (1-ε_v)λV - (ε + κ + μ)E_H
dE_L/dt = κE_H - (ω + μ)E_L
dI/dt = εE_H + ωE_L - (γ + μ + μ_TB)I
dR/dt = γI - σλR - μR
dD/dt = μ_TB × I
```

### TB Parameters (Research-Based)

```typescript
export const TB_PARAMETERS = {
  // Basic reproduction number
  R0: { min: 1.3, max: 2.2, default: 1.7 },

  // Transmission
  transmissionRate: {
    baseline: 0.0001,      // Per contact per day
    household: 0.001,      // Close contacts
  },

  // Latency progression
  latency: {
    fastProgressionRate: 0.0014,  // ~5% progress in 2 years
    stabilizationRate: 0.001,      // Move to low-risk
    reactivationRate: 0.0001,      // Lifetime ~5-10%
  },

  // Disease duration (days)
  infectiousPeriod: {
    untreated: 730,   // ~2 years
    treated: 180,     // ~6 months
  },

  // Treatment
  treatmentRate: 0.85,           // 85% success
  naturalRecoveryRate: 0.15,

  // Mortality
  caseFatalityRate: {
    untreated: 0.45,   // 45%
    treated: 0.04,     // 4%
  },

  // BCG efficacy
  bcgEfficacy: {
    neonatal: 0.86,    // Against severe TB
    childhood: 0.70,   // Pulmonary TB
    adult: 0.50,       // Lower in adults
    waning: 0.02,      // Annual waning
    duration: 15,      // Years protection
  },

  // Contact rates (daily)
  contactRates: {
    general: 10,
    household: 4,
    workplace: 6,
    healthcare: 15,
  },

  // UK-specific
  ukSpecific: {
    preEntryScreeningEfficacy: 0.70,
    activeCaseFinding: 0.65,
    treatmentDelay: 70,  // Days
  },
};
```

---

## 4. Data Models

### SimulationConfig

```typescript
interface SimulationConfig {
  id: string;
  name: string;
  description: string;

  // Time settings
  duration: number;           // Days to simulate
  timeStep: number;           // Integration step (days)
  displayInterval: number;    // UI update frequency (ms)

  // Population
  totalPopulation: number;
  populationGroups: PopulationGroupConfig[];
  ageDistribution: AgeDistribution;

  // Geographic
  regions: RegionConfig[];
  interRegionMixing: number;

  // Disease
  diseaseParams: DiseaseParameters;

  // Vaccination
  vaccinationPolicy: VaccinationPolicy;

  // Interventions
  activeInterventions: PolicyIntervention[];

  // Initial conditions
  initialInfected: number;
  initialLatent: number;
  importedCasesPerDay: number;

  // Visualization
  visualizationMode: 'aggregate' | 'agent-based' | 'map';
  showTransmissionEvents: boolean;
}
```

### CompartmentState

```typescript
interface CompartmentState {
  S: number;    // Susceptible
  V: number;    // Vaccinated
  E_H: number;  // Exposed High-risk
  E_L: number;  // Exposed Low-risk
  I: number;    // Infectious
  R: number;    // Recovered
  D: number;    // Deceased
}
```

### SimulationState

```typescript
interface SimulationState {
  currentDay: number;
  currentTime: Date;
  compartments: CompartmentState;
  regionStates: Map<string, RegionState>;
  groupStates: Map<string, CompartmentState>;
  history: TimeSeriesPoint[];
  events: SimulationEvent[];
  metrics: SimulationMetrics;
  status: 'idle' | 'running' | 'paused' | 'completed';
  speed: number;
}
```

### SimulationMetrics

```typescript
interface SimulationMetrics {
  // Cumulative
  totalInfections: number;
  totalDeaths: number;
  totalRecovered: number;
  totalVaccinated: number;

  // Prevented (counterfactual)
  infectionsPrevented: number;
  deathsPrevented: number;

  // Rates
  currentIncidenceRate: number;   // per 100,000
  currentPrevalence: number;
  effectiveR: number;

  // WHO targets
  whoTargetProgress: number;
  lowIncidenceStatus: boolean;    // Below 10/100,000
}
```

### VaccinationPolicy

```typescript
interface VaccinationPolicy {
  neonatalBCG: {
    enabled: boolean;
    coverageTarget: number;
    eligibilityCriteria: 'universal' | 'risk-based' | 'none';
    riskBasedThreshold: number;
  };
  healthcareWorkerBCG: {
    enabled: boolean;
    coverageTarget: number;
  };
  immigrantScreening: {
    enabled: boolean;
    screeningCountryThreshold: number;
    efficacy: number;
  };
  catchUpVaccination: {
    enabled: boolean;
    targetAgeGroup: [number, number];
    coverageTarget: number;
  };
}
```

### PolicyIntervention

```typescript
interface PolicyIntervention {
  id: string;
  type: PolicyType;
  name: string;
  description: string;
  startDay: number;
  endDay?: number;
  parameters: Record<string, number | boolean | string>;
  effectOnR0: number;  // Multiplier
}

type PolicyType =
  | 'pre_entry_screening'
  | 'active_case_finding'
  | 'contact_tracing'
  | 'directly_observed_therapy'
  | 'latent_tb_treatment'
  | 'universal_bcg'
  | 'healthcare_worker_bcg'
  | 'border_health_checks'
  | 'public_awareness_campaign';
```

### Agent (for visualization)

```typescript
interface Agent {
  id: string;
  age: number;
  ageGroup: string;
  populationGroup: string;
  region: string;

  // Position
  x: number;
  y: number;
  vx: number;
  vy: number;

  // State
  compartment: keyof CompartmentState;
  dayInCompartment: number;

  // Vaccination
  vaccinated: boolean;
  vaccinatedDay?: number;
  vaccineEfficacy: number;

  // History
  infectedBy?: string;
  infectionDay?: number;

  // Visual
  color: string;
  radius: number;
  highlighted: boolean;
}
```

---

## 5. Component Architecture

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SimulatorPage                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────────────────────────────────────┐  │
│  │  ControlsSidebar │  │              MainVisualization              │  │
│  │                  │  │                                             │  │
│  │ ┌──────────────┐ │  │  ┌─────────────────────────────────────┐   │  │
│  │ │ScenarioPreset│ │  │  │         SimulationCanvas            │   │  │
│  │ └──────────────┘ │  │  │  (PixiJS WebGL)                     │   │  │
│  │                  │  │  │                                     │   │  │
│  │ ┌──────────────┐ │  │  │   - Agent dots                      │   │  │
│  │ │PopulationPane│ │  │  │   - Transmission lines              │   │  │
│  │ └──────────────┘ │  │  │   - Vaccination shields             │   │  │
│  │                  │  │  │                                     │   │  │
│  │ ┌──────────────┐ │  │  └─────────────────────────────────────┘   │  │
│  │ │VaccinationPan│ │  │                                             │  │
│  │ └──────────────┘ │  │  ┌──────────────────┐ ┌──────────────────┐  │  │
│  │                  │  │  │     UKMap        │ │  StatsPanel      │  │  │
│  │ ┌──────────────┐ │  │  │ (Choropleth)     │ │  - Deaths        │  │  │
│  │ │ PolicyPanel  │ │  │  │                  │ │  - Infections    │  │  │
│  │ └──────────────┘ │  │  │                  │ │  - Prevented     │  │  │
│  │                  │  │  └──────────────────┘ └──────────────────┘  │  │
│  │ ┌──────────────┐ │  │                                             │  │
│  │ │[RUN SCENARIO]│ │  │  ┌─────────────────────────────────────┐   │  │
│  │ └──────────────┘ │  │  │         TimelineControl             │   │  │
│  └──────────────────┘  │  └─────────────────────────────────────┘   │  │
│                        └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `SimulatorLayout` | Page structure, responsive layout |
| `ControlsSidebar` | Configuration panels container |
| `ScenarioPresets` | Quick scenario selection |
| `PopulationPanel` | Age groups, demographics config |
| `VaccinationPanel` | BCG rates, coverage settings |
| `PolicyPanel` | Intervention toggles and parameters |
| `SimulationCanvas` | WebGL agent visualization |
| `UKMap` | Regional choropleth map |
| `StatsPanel` | Real-time statistics |
| `TimelineControl` | Play/pause, speed, timeline scrubbing |
| `InfectionChart` | Time series visualization |

---

## 6. State Management

### Zustand Store Structure

```typescript
// simulation-store.ts
interface SimulationStore {
  // Config
  config: SimulationConfig;
  setConfig: (config: Partial<SimulationConfig>) => void;

  // State
  state: SimulationState;

  // Actions
  initialize: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  step: () => void;
  setSpeed: (speed: number) => void;

  // Scenarios
  loadScenario: (scenarioId: string) => void;

  // Updates
  updateState: (newState: Partial<SimulationState>) => void;

  // Comparison
  comparisonEnabled: boolean;
  baselineState: SimulationState | null;
}
```

### Data Flow

```
User Input → Config Update → Store Update → Worker Message
                                                    ↓
UI Update ← State Update ← Store Update ← Worker Result
```

---

## 7. Web Worker Architecture

### Worker Communication Protocol

```typescript
// Main thread → Worker
interface WorkerInput {
  type: 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'SET_SPEED' | 'UPDATE_CONFIG';
  config?: SimulationConfig;
  state?: SimulationState;
  speed?: number;
}

// Worker → Main thread
interface WorkerOutput {
  type: 'STATE_UPDATE' | 'EVENT' | 'COMPLETE' | 'ERROR';
  state?: Partial<SimulationState>;
  event?: SimulationEvent;
  error?: string;
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60 fps |
| Agent count | 5000+ |
| State update latency | <16ms |
| Memory usage | <200MB |

---

## 8. Real UK Data

### Data Sources

| Source | Data | Update |
|--------|------|--------|
| UKHSA TB Reports | Incidence, demographics | Annual |
| ONS Population | Regional population | Annual |
| NHS Digital | BCG coverage | Quarterly |
| WHO TB Database | Global incidence | Annual |
| ONS Geoportal | UK GeoJSON | Static |

### UK TB Statistics (2024)

```typescript
const UK_TB_DATA = {
  national: {
    notifications: 5480,
    incidenceRate: 9.5,  // per 100,000
    ukBornProportion: 0.181,
    nonUkBornProportion: 0.819,
    deaths: 340,
  },

  byRegion: {
    london: { rate: 20.6, population: 9_000_000 },
    west_midlands: { rate: 8.5, population: 5_950_000 },
    // ...
  },

  byBirthplace: {
    ukBorn: { rate: 2.1 },
    nonUkBorn: { rate: 46.9 },
  },

  trends: [
    { year: 2019, rate: 8.6 },
    { year: 2020, rate: 7.3 },
    { year: 2021, rate: 7.8 },
    { year: 2022, rate: 8.0 },
    { year: 2023, rate: 8.5 },
    { year: 2024, rate: 9.5 },
  ],

  bcgCoverage: {
    neonatal: 0.89,
    healthcareWorkers: 0.95,
  },
};
```

---

## 9. Pre-built Scenarios

| ID | Name | Description |
|----|------|-------------|
| `current-trajectory` | Current Trajectory | Unchanged policies |
| `universal-bcg` | Universal BCG | All newborns vaccinated |
| `enhanced-screening` | Enhanced Screening | Mandatory visa screening |
| `who-elimination` | WHO Elimination | All interventions |
| `no-intervention` | No Intervention | Worst case |

---

## 10. Testing Strategy

### Unit Tests (Vitest)

**Coverage Targets**:
- Simulation logic: 95%
- Utilities: 90%
- Types/validators: 85%

**Key Test Files**:
- `seir-model.test.ts` - Differential equations
- `tb-parameters.test.ts` - Parameter validation
- `vaccination.test.ts` - BCG efficacy calculations
- `engine.test.ts` - Simulation loop

### Integration Tests

**Coverage Target**: 80%

**Key Test Files**:
- `useSimulation.test.ts` - Hook behavior
- `SimulationCanvas.test.tsx` - Canvas rendering
- `PolicyPanel.test.tsx` - User interactions

### E2E Tests (Playwright)

**Coverage**: 100% critical paths

**Key Flows**:
1. Complete simulation workflow
2. Scenario selection and execution
3. Policy configuration changes
4. Export/share functionality

---

## 11. CI/CD Pipeline

### Stages

1. **Lint & Type Check**
   - ESLint
   - TypeScript compiler

2. **Unit Tests**
   - Vitest with coverage
   - Upload to Codecov

3. **Integration Tests**
   - React Testing Library

4. **E2E Tests**
   - Playwright
   - Artifact upload on failure

5. **Security**
   - npm audit
   - Snyk scan

6. **Build**
   - Next.js production build

7. **Deploy**
   - Vercel staging/production

### Branch Strategy

```
master (protected)
  └── Production deployments
  └── PR required with approvals

staging
  └── Staging deployments
  └── Integration testing

feature/*
  └── Development branches
  └── PR to staging
```

---

## 12. Performance Optimization

### Simulation

- Web Workers for calculations
- Batch state updates (16ms intervals)
- Runge-Kutta 4th order integration
- Spatial hashing for collision detection

### Rendering

- PixiJS WebGL for agents
- Canvas rendering for charts
- Object pooling for particles
- Sprite batching

### Data Loading

- Static generation for scenarios
- Incremental static regeneration
- Dynamic imports for visualization libs
- Edge caching on Vercel

---

## 13. Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support (live regions)
- Color-blind friendly palette
- Reduced motion support
- Alternative data tables

---

## 14. Security

- Input validation with Zod
- CSP headers
- No sensitive data storage
- HTTPS only
- Dependency scanning
- No user authentication required

---

## References

- UKHSA Tuberculosis in England 2025 Report
- WHO Global TB Report
- SEIR Model Documentation (IDM)
- BCG Vaccine Efficacy Studies
- ONS Population Statistics
