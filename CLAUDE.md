# TB Infections Simulator - Claude Code Guide

## Project Overview

This is an interactive TB (Tuberculosis) vaccination simulator for the UK, designed to visualize the impact of vaccination policies on disease spread. The application uses epidemiologically accurate SEIR compartmental modeling with real UK TB statistics.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture Summary

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Visualization**: D3.js, React Simple Maps, PixiJS, Nivo
- **Testing**: Vitest (unit), React Testing Library (integration), Playwright (E2E)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical specification.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── simulator/       # Main simulation interface
│   ├── scenarios/       # Pre-built scenarios
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── simulation/      # Visualization components
│   ├── controls/        # Configuration panels
│   └── dashboard/       # Statistics display
├── lib/
│   ├── simulation/      # Core SEIR simulation engine
│   ├── data/            # UK TB statistics and GeoJSON
│   ├── utils/           # Helper functions
│   └── constants/       # App constants and scenarios
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
└── types/               # TypeScript type definitions
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode - no `any` types
- Follow ESLint and Prettier configurations
- Use named exports for components
- Keep components focused and composable
- Document complex simulation logic with JSDoc

### Testing Requirements

All PRs must pass:
1. **Unit Tests**: `npm run test:unit` - 95% coverage for simulation logic
2. **Integration Tests**: `npm run test:integration` - Component interactions
3. **E2E Tests**: `npm run test:e2e` - Critical user journeys
4. **Security Scan**: `npm audit --audit-level=high`

### Commit Messages

Follow conventional commits:
```
feat: add vaccination rate slider component
fix: correct SEIR differential equation calculation
test: add unit tests for R0 computation
docs: update deployment instructions
```

## Deployment

### Environments

| Environment | Branch   | URL                                    |
|-------------|----------|----------------------------------------|
| Production  | `master` | https://tbinfections.vercel.app        |
| Staging     | `staging`| https://staging-tbinfections.vercel.app|

### Vercel Configuration

The project is deployed on Vercel with automatic deployments:

- **Production**: Triggered by pushes to `master`
- **Staging**: Triggered by pushes to `staging`
- **Preview**: Triggered by pull requests

### Required Secrets

Configure these in GitHub repository settings:

```
VERCEL_TOKEN          # Vercel API token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
CODECOV_TOKEN         # Codecov upload token (optional)
SNYK_TOKEN            # Snyk security scanning (optional)
```

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

## CI/CD Pipeline

GitHub Actions runs on all pushes and PRs to `master` and `staging`:

### Pipeline Stages

1. **Lint & Type Check** (`ci.yml`)
   - ESLint validation
   - TypeScript compilation check

2. **Unit Tests** (`ci.yml`)
   - Vitest with coverage reporting
   - Uploads to Codecov

3. **Integration Tests** (`ci.yml`)
   - React Testing Library tests

4. **E2E Tests** (`ci.yml`)
   - Playwright browser tests
   - Artifacts uploaded on failure

5. **Security** (`ci.yml`)
   - npm audit
   - Snyk vulnerability scan

6. **Build** (`ci.yml`)
   - Next.js production build
   - Build artifacts cached

7. **Deploy** (`staging-deploy.yml` / `production-deploy.yml`)
   - Vercel deployment
   - Environment-specific configuration

### Branch Protection Rules

`master` branch requires:
- All CI checks passing
- At least 1 PR approval
- Up-to-date with target branch

`staging` branch requires:
- All CI checks passing

## Key Commands

```bash
# Development
npm run dev              # Start dev server on :3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript check

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Generate coverage report

# Utilities
npm run format           # Prettier format
npm run clean            # Clear build artifacts
```

## Simulation Engine

### SEIR Model

The simulation uses an extended SEIR model for TB:

- **S** - Susceptible
- **V** - Vaccinated (BCG)
- **E_H** - Exposed High-risk (recent infection)
- **E_L** - Exposed Low-risk (stable latent)
- **I** - Infectious (active TB)
- **R** - Recovered/Treated
- **D** - Deceased

Key files:
- `src/lib/simulation/seir-model.ts` - Differential equations
- `src/lib/simulation/tb-parameters.ts` - Epidemiological parameters
- `src/lib/simulation/engine.ts` - Simulation loop

### Web Worker

Heavy calculations run in a Web Worker to prevent UI blocking:
- `src/lib/simulation/worker.ts`

### Real Data Sources

UK TB statistics from:
- UKHSA TB Reports
- ONS Population Data
- NHS Digital BCG Coverage
- WHO TB Database

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Test Failures

```bash
# Run specific test file
npm run test:unit -- src/lib/simulation/seir-model.test.ts

# Update snapshots
npm run test:unit -- -u

# Debug Playwright
npm run test:e2e -- --debug
```

### Vercel Deployment Issues

1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Ensure `next.config.ts` is valid
4. Check for unsupported Node.js APIs

## Background Agent Tasks

For complex multi-file changes, spawn background agents using the task definitions in [PLAN.md](./PLAN.md). Each agent receives minimal context to avoid context rot.

Example agent spawn:
```
Task: Implement vaccination panel component
Context: Read ARCHITECTURE.md sections 4-5, src/types/simulation.ts
Output: src/components/controls/VaccinationPanel.tsx with tests
```

## Contact & Resources

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Implementation Plan**: [PLAN.md](./PLAN.md)
- **UKHSA TB Data**: https://www.gov.uk/government/publications/tuberculosis-in-england-2025-report
- **WHO TB Guidelines**: https://www.who.int/teams/global-tuberculosis-programme
