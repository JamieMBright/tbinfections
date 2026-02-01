# TB Infections Simulator

An interactive web application for simulating and visualizing tuberculosis (TB) spread in the UK based on vaccination rates and policy interventions.

## Overview

This simulator uses epidemiologically accurate SEIR (Susceptible-Exposed-Infectious-Recovered) compartmental modeling to demonstrate the impact of vaccination policies on TB spread. It's designed to help policymakers, public health officials, and the general public understand the UK's risk of losing its WHO low-incidence TB status.

## Features

- Interactive simulation with configurable vaccination rates
- Policy intervention scenarios (pre-entry screening, universal BCG, etc.)
- Real-time visualization of disease spread
- UK regional map with incidence data
- Historical UK TB statistics
- Prevented infections counter showing vaccination impact
- Pre-built scenario presets

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Visualization**: PixiJS, D3.js, React Simple Maps, Nivo
- **Testing**: Vitest, React Testing Library, Playwright

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tbinfections.git
cd tbinfections

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide and deployment instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture specification
- [PLAN.md](./PLAN.md) - Implementation plan and task breakdown

## Deployment

The application is deployed on Vercel with automatic deployments:

- **Production**: Pushes to `master` branch
- **Staging**: Pushes to `staging` branch

See [CLAUDE.md](./CLAUDE.md) for detailed deployment instructions.

## Data Sources

- [UKHSA TB Reports](https://www.gov.uk/government/publications/tuberculosis-in-england-2025-report)
- [WHO Global TB Report](https://www.who.int/teams/global-tuberculosis-programme)
- [ONS Population Statistics](https://www.ons.gov.uk/)
- [NHS Digital BCG Coverage Data](https://digital.nhs.uk/)

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the `staging` branch.
