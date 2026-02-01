# TB Infections Simulator - Implementation Plan

## Overview

This document provides a structured implementation plan with independent tasks for background agents. Each task is designed to be self-contained with minimal context requirements.

**Important**: Agents should read only the referenced sections of ARCHITECTURE.md and specific files mentioned. Avoid reading the entire codebase to prevent context rot.

---

## Phase 1: Project Foundation

### Task 1.1: Initialize Next.js Project

**Agent Type**: Bash
**Priority**: Critical
**Dependencies**: None

**Context Required**:
- ARCHITECTURE.md Section 1 (Technology Stack)

**Instructions**:
```bash
# Initialize Next.js with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core dependencies
npm install zustand @tanstack/react-query zod date-fns lodash-es framer-motion

# Install visualization libraries
npm install d3 @types/d3 pixi.js @pixi/react react-simple-maps @nivo/core @nivo/line @nivo/bar

# Install UI components
npm install class-variance-authority clsx tailwind-merge lucide-react

# Install dev dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test msw
```

**Output**: package.json with all dependencies, next.config.ts configured

---

### Task 1.2: Configure ESLint and Prettier

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 1.1

**Context Required**:
- ARCHITECTURE.md Section 1 (Testing Stack)

**Instructions**:
Create strict ESLint configuration for TypeScript React project:

1. Create `.eslintrc.json`:
```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended-type-checked"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

2. Create `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

3. Add scripts to package.json

**Output**: .eslintrc.json, .prettierrc, updated package.json

---

### Task 1.3: Configure Vitest and Playwright

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 1.1

**Context Required**:
- ARCHITECTURE.md Section 10 (Testing Strategy)

**Instructions**:

1. Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

2. Create `playwright.config.ts` for E2E tests

3. Create `tests/setup.ts` with testing library setup

**Output**: vitest.config.ts, playwright.config.ts, tests/setup.ts

---

### Task 1.4: Set Up GitHub Actions CI/CD

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 1.1, 1.2, 1.3

**Context Required**:
- ARCHITECTURE.md Section 11 (CI/CD Pipeline)
- CLAUDE.md (Deployment section)

**Instructions**:

Create three workflow files:

1. `.github/workflows/ci.yml` - Main CI pipeline with:
   - lint job
   - unit-tests job
   - integration-tests job
   - e2e-tests job
   - security job
   - build job

2. `.github/workflows/staging-deploy.yml` - Deploy to Vercel staging on push to staging branch

3. `.github/workflows/production-deploy.yml` - Deploy to Vercel production on push to master branch

4. Create `.github/dependabot.yml` for dependency updates

5. Create `.github/PULL_REQUEST_TEMPLATE.md`

**Output**: All GitHub workflow files, branch protection rules documented

---

### Task 1.5: Create Directory Structure

**Agent Type**: Bash
**Priority**: High
**Dependencies**: Task 1.1

**Context Required**:
- ARCHITECTURE.md Section 2 (Project Structure)

**Instructions**:
```bash
# Create all directories
mkdir -p src/app/{simulator,scenarios/\[scenarioId\],api/{simulation,data/{uk-stats,regions}}}
mkdir -p src/app/\(marketing\)/{about}
mkdir -p src/components/{ui,simulation,controls,dashboard,layout}
mkdir -p src/lib/{simulation,data/geojson,utils,constants}
mkdir -p src/hooks
mkdir -p src/stores
mkdir -p src/types
mkdir -p tests/{unit/{simulation,utils},integration/{components,hooks},e2e}
mkdir -p public/{data,images}

# Create placeholder files
touch src/types/{simulation,population,policy,geography}.ts
touch src/stores/{simulation-store,settings-store,ui-store}.ts
touch src/lib/constants/{simulation,scenarios}.ts
```

**Output**: Complete directory structure as per ARCHITECTURE.md

---

## Phase 2: Core Simulation Engine

### Task 2.1: Implement TypeScript Types

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 1.5

**Context Required**:
- ARCHITECTURE.md Section 4 (Data Models) - FULL SECTION

**Instructions**:

Create all type definitions in `src/types/`:

1. `simulation.ts`:
   - SimulationConfig
   - CompartmentState
   - SimulationState
   - TimeSeriesPoint
   - SimulationMetrics
   - SimulationEvent

2. `population.ts`:
   - PopulationGroupConfig
   - AgeDistribution
   - AgeGroup
   - DemographicData

3. `policy.ts`:
   - VaccinationPolicy
   - PolicyIntervention
   - PolicyType (union type)

4. `geography.ts`:
   - RegionConfig
   - RegionState
   - UKRegion

**Output**: All type files with complete definitions, exported via index.ts

---

### Task 2.2: Implement SEIR Model

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 2.1

**Context Required**:
- ARCHITECTURE.md Section 3 (Epidemiological Model) - FULL SECTION
- src/types/simulation.ts

**Instructions**:

Create `src/lib/simulation/seir-model.ts`:

1. Implement `computeDerivatives()` function with TB-specific differential equations
2. Implement `rungeKutta4()` for numerical integration
3. Implement `calculateR0()` to compute reproduction number
4. Implement `calculateEffectiveR()` for real-time R value
5. Add helper functions: `addStates()`, `scaleState()`

All functions must be pure and testable.

**Output**: seir-model.ts with full implementation and JSDoc comments

---

### Task 2.3: Implement TB Parameters

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 2.1

**Context Required**:
- ARCHITECTURE.md Section 3 (TB Parameters)

**Instructions**:

Create `src/lib/simulation/tb-parameters.ts`:

1. Define `TB_PARAMETERS` constant with all epidemiological values
2. Create parameter validation with Zod
3. Create `createDiseaseParameters()` factory function
4. Create `adjustParametersForPolicy()` function

Use research-based values from ARCHITECTURE.md.

**Output**: tb-parameters.ts with validated parameters

---

### Task 2.4: Implement Simulation Engine

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 2.2, 2.3

**Context Required**:
- ARCHITECTURE.md Section 7 (Web Worker Architecture)
- src/lib/simulation/seir-model.ts
- src/lib/simulation/tb-parameters.ts

**Instructions**:

Create `src/lib/simulation/engine.ts`:

1. `SimulationEngine` class with:
   - `initialize(config)` - Set up initial state
   - `step()` - Run one time step
   - `run(steps)` - Run multiple steps
   - `getState()` - Return current state
   - `getMetrics()` - Calculate derived metrics
   - `calculatePrevented()` - Counterfactual calculation

2. Implement counterfactual tracking (infections prevented by vaccination)

**Output**: engine.ts with full SimulationEngine class

---

### Task 2.5: Implement Web Worker

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 2.4

**Context Required**:
- ARCHITECTURE.md Section 7 (Web Worker Architecture)
- src/lib/simulation/engine.ts

**Instructions**:

Create `src/lib/simulation/worker.ts`:

1. Set up message handling for WorkerInput types
2. Instantiate SimulationEngine
3. Run simulation loop with state updates
4. Send WorkerOutput messages back to main thread
5. Handle pause/resume/stop commands

**Output**: worker.ts as Web Worker entry point

---

### Task 2.6: Write Simulation Unit Tests

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 2.2, 2.3, 2.4

**Context Required**:
- ARCHITECTURE.md Section 10 (Unit Tests)
- src/lib/simulation/*.ts

**Instructions**:

Create tests in `tests/unit/simulation/`:

1. `seir-model.test.ts`:
   - Test population conservation
   - Test infection dynamics
   - Test vaccination impact
   - Test R0 calculation

2. `tb-parameters.test.ts`:
   - Test parameter validation
   - Test boundary values

3. `engine.test.ts`:
   - Test initialization
   - Test step execution
   - Test prevented infections calculation

Target: 95% coverage

**Output**: All test files with comprehensive test cases

---

## Phase 3: UK Data Integration

### Task 3.1: Create UK TB Statistics Data

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 2.1

**Context Required**:
- ARCHITECTURE.md Section 8 (Real UK Data)

**Instructions**:

Create `src/lib/data/uk-tb-stats.ts`:

1. `UK_TB_DATA` constant with:
   - National statistics (2024)
   - Regional breakdown
   - Age group breakdown
   - Birthplace statistics
   - Historical trends (2019-2024)
   - BCG coverage rates

2. Create accessor functions:
   - `getRegionalData(regionId)`
   - `getNationalIncidence()`
   - `getHistoricalTrend()`

Use real data from UKHSA reports.

**Output**: uk-tb-stats.ts with complete UK data

---

### Task 3.2: Create UK Regions Data

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 2.1

**Context Required**:
- ARCHITECTURE.md Section 8 (Data Sources)

**Instructions**:

Create `src/lib/data/uk-regions.ts`:

1. Define all UK regions with:
   - ID, name
   - Population
   - Area, density
   - Deprivation index
   - TB incidence rate
   - BCG coverage

2. Create `src/lib/data/geojson/uk-regions.json` with simplified UK boundary data

3. Create accessor functions for regional queries

**Output**: uk-regions.ts, uk-regions.json

---

### Task 3.3: Create Demographic Data

**Agent Type**: general-purpose
**Priority**: Medium
**Dependencies**: Task 2.1

**Context Required**:
- ARCHITECTURE.md Section 4 (Population types)

**Instructions**:

Create `src/lib/data/demographic-data.ts`:

1. UK age distribution
2. Immigration statistics
3. High-risk population groups
4. Healthcare worker population
5. Contact matrices by setting

**Output**: demographic-data.ts

---

## Phase 4: State Management

### Task 4.1: Implement Simulation Store

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 2.4

**Context Required**:
- ARCHITECTURE.md Section 6 (State Management)
- src/types/simulation.ts

**Instructions**:

Create `src/stores/simulation-store.ts`:

1. Define SimulationStore interface
2. Implement all actions:
   - `setConfig()`
   - `initialize()`
   - `start()`, `pause()`, `resume()`, `reset()`
   - `setSpeed()`
   - `loadScenario()`
   - `updateState()`
3. Set up devtools middleware
4. Use subscribeWithSelector for performance

**Output**: simulation-store.ts with Zustand store

---

### Task 4.2: Implement Settings and UI Stores

**Agent Type**: general-purpose
**Priority**: Medium
**Dependencies**: Task 4.1

**Context Required**:
- ARCHITECTURE.md Section 6

**Instructions**:

Create `src/stores/settings-store.ts`:
- Theme preference
- Visualization mode
- Animation settings
- Accessibility preferences

Create `src/stores/ui-store.ts`:
- Sidebar state
- Modal state
- Selected region
- Tooltip state

**Output**: settings-store.ts, ui-store.ts

---

### Task 4.3: Implement Custom Hooks

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 4.1, 2.5

**Context Required**:
- src/stores/simulation-store.ts
- src/lib/simulation/worker.ts

**Instructions**:

Create hooks in `src/hooks/`:

1. `useSimulation.ts` - Main simulation hook
   - Connects store to components
   - Handles initialization
   - Provides control methods

2. `useSimulationWorker.ts` - Web Worker management
   - Worker lifecycle
   - Message handling
   - Error recovery

3. `useAnimationFrame.ts` - RAF loop for rendering

4. `useUKTBData.ts` - Data fetching hook

**Output**: All hook files

---

## Phase 5: UI Components

### Task 5.1: Set Up shadcn/ui Components

**Agent Type**: Bash
**Priority**: High
**Dependencies**: Task 1.1

**Context Required**:
- ARCHITECTURE.md Section 1 (Styling)

**Instructions**:
```bash
npx shadcn@latest init

# Add required components
npx shadcn@latest add button card slider checkbox select tabs tooltip badge progress sheet dialog
```

**Output**: src/components/ui/ with shadcn components

---

### Task 5.2: Create Layout Components

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 5.1

**Context Required**:
- ARCHITECTURE.md Section 5 (Component Architecture)

**Instructions**:

Create in `src/components/layout/`:

1. `Header.tsx` - App header with navigation
2. `Footer.tsx` - App footer with links
3. `SimulatorLayout.tsx` - Simulator page layout with sidebar

**Output**: All layout components

---

### Task 5.3: Create Control Panel Components

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 5.1, 4.1

**Context Required**:
- ARCHITECTURE.md Section 5 (Component Architecture)
- src/types/simulation.ts
- src/stores/simulation-store.ts

**Instructions**:

Create in `src/components/controls/`:

1. `PopulationPanel.tsx`:
   - Age group sliders
   - Immigration settings
   - Healthcare worker population

2. `VaccinationPanel.tsx`:
   - BCG coverage slider
   - Universal vs risk-based toggle
   - Healthcare worker BCG

3. `PolicyPanel.tsx`:
   - Intervention checkboxes
   - Policy parameter sliders
   - Intervention timeline

4. `ScenarioPresets.tsx`:
   - Scenario cards
   - Quick load buttons

**Output**: All control panel components with TypeScript

---

### Task 5.4: Create Dashboard Components

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 5.1, 4.1

**Context Required**:
- ARCHITECTURE.md Section 5
- src/stores/simulation-store.ts

**Instructions**:

Create in `src/components/dashboard/`:

1. `StatsOverview.tsx` - Key metrics cards grid
2. `DeathCounter.tsx` - Animated death count
3. `PreventedCounter.tsx` - Infections prevented counter
4. `InfectionChart.tsx` - Nivo line chart for time series
5. `CompartmentBreakdown.tsx` - SEIR compartment display

**Output**: All dashboard components

---

### Task 5.5: Create Simulation Visualization Components

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 5.1, 4.1

**Context Required**:
- ARCHITECTURE.md Section 5 (SimulationCanvas, UKMap)
- ARCHITECTURE.md Section 7 (Performance Targets)

**Instructions**:

Create in `src/components/simulation/`:

1. `SimulationCanvas.tsx`:
   - PixiJS WebGL setup
   - Agent rendering (colored dots)
   - Transmission event lines
   - Vaccination shield effects
   - 60fps performance target

2. `UKMap.tsx`:
   - React Simple Maps integration
   - UK regions GeoJSON
   - Choropleth coloring by metric
   - Region hover/click interactions

3. `TimelineControl.tsx`:
   - Play/pause/reset buttons
   - Speed selector
   - Timeline slider
   - Day counter

4. `TransmissionEvent.tsx` - Animated infection line
5. `VaccinationShield.tsx` - Shield animation when blocked

**Output**: All visualization components

---

### Task 5.6: Write Component Integration Tests

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 5.3, 5.4, 5.5

**Context Required**:
- ARCHITECTURE.md Section 10 (Integration Tests)
- src/components/**

**Instructions**:

Create tests in `tests/integration/components/`:

1. `PolicyPanel.test.tsx` - Policy changes update store
2. `VaccinationPanel.test.tsx` - Slider interactions
3. `SimulationCanvas.test.tsx` - Canvas rendering (mock PixiJS)
4. `StatsOverview.test.tsx` - Displays correct metrics

**Output**: Component test files

---

## Phase 6: Pages and Routing

### Task 6.1: Create Landing Page

**Agent Type**: general-purpose
**Priority**: Medium
**Dependencies**: Task 5.2

**Context Required**:
- ARCHITECTURE.md Section 2 (App Router structure)

**Instructions**:

Create `src/app/(marketing)/page.tsx`:

1. Hero section explaining TB risk to UK
2. Key statistics from real data
3. CTA to simulator
4. Feature highlights

**Output**: Landing page with responsive design

---

### Task 6.2: Create Simulator Page

**Agent Type**: general-purpose
**Priority**: Critical
**Dependencies**: Task 5.3, 5.4, 5.5, 4.1

**Context Required**:
- ARCHITECTURE.md Section 5 (Page Layout)
- All component files

**Instructions**:

Create in `src/app/simulator/`:

1. `page.tsx`:
   - Combine all components
   - Initialize simulation on mount
   - Handle responsive layout

2. `layout.tsx`:
   - Simulator-specific layout
   - Sidebar handling

3. `loading.tsx`:
   - Loading skeleton

**Output**: Complete simulator page

---

### Task 6.3: Create Scenarios Page

**Agent Type**: general-purpose
**Priority**: Medium
**Dependencies**: Task 4.1

**Context Required**:
- ARCHITECTURE.md Section 9 (Pre-built Scenarios)
- src/lib/constants/scenarios.ts

**Instructions**:

Create `src/app/scenarios/`:

1. `page.tsx` - Scenario gallery with cards
2. `[scenarioId]/page.tsx` - Launch specific scenario

**Output**: Scenarios pages

---

### Task 6.4: Create API Routes

**Agent Type**: general-purpose
**Priority**: Low
**Dependencies**: Task 3.1, 3.2

**Context Required**:
- ARCHITECTURE.md Section 2 (API routes)

**Instructions**:

Create API routes in `src/app/api/`:

1. `data/uk-stats/route.ts` - Return UK TB statistics
2. `data/regions/route.ts` - Return regional data

**Output**: API route handlers

---

## Phase 7: Scenario Presets

### Task 7.1: Implement Scenario Constants

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 2.1

**Context Required**:
- ARCHITECTURE.md Section 9 (Pre-built Scenarios)
- src/types/simulation.ts

**Instructions**:

Create `src/lib/constants/scenarios.ts`:

1. Define PRESET_SCENARIOS array with:
   - current-trajectory
   - universal-bcg
   - enhanced-screening
   - who-elimination
   - no-intervention

2. Each scenario includes full SimulationConfig

**Output**: scenarios.ts with all presets

---

### Task 7.2: Implement Default Simulation Constants

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 2.3

**Context Required**:
- ARCHITECTURE.md Sections 3-4

**Instructions**:

Create `src/lib/constants/simulation.ts`:

1. DEFAULT_CONFIG - Default simulation configuration
2. DEFAULT_VACCINATION_POLICY
3. VISUALIZATION_DEFAULTS
4. TIME_CONSTANTS

**Output**: simulation.ts constants

---

## Phase 8: E2E Testing

### Task 8.1: Write E2E Tests

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 6.2, 6.3

**Context Required**:
- ARCHITECTURE.md Section 10 (E2E Tests)

**Instructions**:

Create in `tests/e2e/`:

1. `simulation-flow.spec.ts`:
   - Configure simulation
   - Start and run
   - Verify results displayed

2. `scenario-selection.spec.ts`:
   - Load preset scenario
   - Verify configuration applied

**Output**: E2E test files

---

## Phase 9: Polish and Optimization

### Task 9.1: Implement Accessibility Features

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: All Phase 5 tasks

**Context Required**:
- ARCHITECTURE.md Section 13 (Accessibility)

**Instructions**:

1. Add ARIA labels to all interactive elements
2. Implement keyboard navigation for simulator
3. Add live regions for simulation updates
4. Create alternative data table view
5. Implement reduced motion support

**Output**: Accessibility improvements across all components

---

### Task 9.2: Performance Optimization

**Agent Type**: general-purpose
**Priority**: High
**Dependencies**: Task 5.5, 4.3

**Context Required**:
- ARCHITECTURE.md Section 12 (Performance Optimization)

**Instructions**:

1. Implement object pooling for PixiJS sprites
2. Add spatial hashing for agent collision
3. Optimize React renders with memo/useMemo
4. Implement dynamic imports for visualization libs
5. Add performance monitoring

**Output**: Optimized components and hooks

---

## Execution Order

### Critical Path (must be sequential)

```
Task 1.1 → Task 1.5 → Task 2.1 → Task 2.2 → Task 2.4 → Task 4.1 → Task 6.2
```

### Parallelizable Groups

**Group A** (can run after Task 1.1):
- Task 1.2, 1.3, 1.4

**Group B** (can run after Task 2.1):
- Task 2.3, Task 3.1, 3.2, 3.3

**Group C** (can run after Task 1.5):
- Task 5.1 → Task 5.2, 5.3, 5.4, 5.5

**Group D** (can run after Task 4.1):
- Task 4.2, 4.3

**Group E** (can run after Phase 5):
- Task 6.1, 6.3, 6.4

---

## Agent Spawning Template

When spawning a background agent for a task:

```
Task: [Task ID and Name]

CONTEXT FILES TO READ:
- ARCHITECTURE.md: Section [X]
- [Specific source files]

DO NOT READ:
- Entire codebase
- Unrelated sections

DELIVERABLES:
- [Specific files to create]
- [Tests if applicable]

CONSTRAINTS:
- TypeScript strict mode
- No any types
- Follow existing patterns
- Include JSDoc for complex logic
```

---

## Completion Checklist

- [ ] Phase 1: Project Foundation
- [ ] Phase 2: Core Simulation Engine
- [ ] Phase 3: UK Data Integration
- [ ] Phase 4: State Management
- [ ] Phase 5: UI Components
- [ ] Phase 6: Pages and Routing
- [ ] Phase 7: Scenario Presets
- [ ] Phase 8: E2E Testing
- [ ] Phase 9: Polish and Optimization

---

## Notes for Agents

1. **Context Management**: Only read files explicitly listed in task context
2. **Type Safety**: All code must pass TypeScript strict mode
3. **Testing**: Write tests alongside implementation for simulation logic
4. **Dependencies**: Check task dependencies before starting
5. **Output Verification**: Ensure all deliverables are created
6. **No Assumptions**: If unclear, reference ARCHITECTURE.md
