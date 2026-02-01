'use client';

/**
 * Landing Page
 *
 * Main landing page for the TB Infections Simulator.
 * Displays compelling statistics about UK TB risk and features of the simulator.
 *
 * @module app/page
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  MapPin,
  TrendingUp,
  Users,
  Shield,
  BarChart3,
  Settings,
  PlayCircle,
  GitCompare,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  UK_TB_DATA,
  getNationalIncidence,
  getHistoricalTrend,
  getAllRegionalData,
} from '@/lib/data/uk-tb-stats';

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 },
};

// ============================================================================
// Data Helpers
// ============================================================================

/**
 * Gets the highest incidence region (London)
 */
function getHighestIncidenceRegion(): { name: string; rate: number } {
  const regions = getAllRegionalData();
  const highest = regions[0]; // Already sorted by incidence descending
  return { name: highest.name, rate: highest.incidenceRate };
}

/**
 * Gets the trend since 2020 (COVID low point)
 */
function getTrendSince2020(): { direction: 'up' | 'down'; percentage: number } {
  const trends = getHistoricalTrend();
  const rate2020 = trends.find((t) => t.year === 2020)?.incidenceRate ?? 7.3;
  const currentRate = getNationalIncidence();
  const change = ((currentRate - rate2020) / rate2020) * 100;
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
}

// ============================================================================
// Statistic Card Component
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
}

function StatCard({ icon, value, label, sublabel, highlight = false }: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`rounded-xl border p-6 ${
        highlight
          ? 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`rounded-lg p-2 ${
            highlight ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground md:text-3xl">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-muted-foreground/70">{sublabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// ============================================================================
// Step Card Component
// ============================================================================

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <motion.div variants={fadeInUp} className="relative flex gap-4">
      {/* Step number connector */}
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </div>
        <div className="mt-2 h-full w-px bg-border" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 inline-flex rounded-lg bg-muted p-2 text-muted-foreground">
            {icon}
          </div>
          <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Trend Indicator Component
// ============================================================================

function TrendIndicator() {
  const trend = getTrendSince2020();
  const trends = getHistoricalTrend();

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Incidence Trend (2019-2024)
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            trend.direction === 'up'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-500/10 text-green-600'
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          {trend.direction === 'up' ? '+' : '-'}
          {trend.percentage.toFixed(1)}% since 2020
        </span>
      </div>

      {/* Simple trend visualization */}
      <div className="flex items-end gap-1 h-24">
        {trends.map((point, index) => {
          const maxRate = Math.max(...trends.map((t) => t.incidenceRate));
          const heightPercent = (point.incidenceRate / maxRate) * 100;
          const isLatest = index === trends.length - 1;

          return (
            <div
              key={point.year}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`w-full rounded-t ${
                  isLatest ? 'bg-destructive' : 'bg-primary/60'
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {point.year.toString().slice(2)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function HomePage() {
  const nationalStats = UK_TB_DATA.national;
  const highestRegion = getHighestIncidenceRegion();
  const currentIncidence = getNationalIncidence();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/50 to-background px-4 py-16 md:py-24">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-1/4 -top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-1/4 -left-1/4 h-96 w-96 rounded-full bg-destructive/5 blur-3xl" />
          </div>

          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center"
            >
              {/* Alert badge */}
              <motion.div
                variants={fadeInUp}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>UK at risk of losing low-incidence TB status</span>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                variants={fadeInUp}
                className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl"
              >
                Understand the Future of{' '}
                <span className="text-primary">TB in the UK</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl"
              >
                An interactive epidemiological simulator that models tuberculosis
                spread based on vaccination policies and interventions using real
                UK data.
              </motion.p>

              {/* Current rate display */}
              <motion.div
                variants={scaleIn}
                className="mb-8 inline-flex flex-col items-center rounded-2xl border border-border bg-card/50 px-8 py-6 backdrop-blur-sm"
              >
                <span className="mb-2 text-sm font-medium text-muted-foreground">
                  Current UK Incidence Rate
                </span>
                <span className="text-5xl font-bold text-foreground md:text-6xl">
                  {currentIncidence}
                </span>
                <span className="mt-1 text-sm text-muted-foreground">
                  per 100,000 population
                </span>
                <span className="mt-2 text-xs text-destructive">
                  WHO low-incidence threshold: &lt;10 per 100,000
                </span>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link
                  href="/simulator"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Launch Simulator
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/scenarios"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  View Scenarios
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Key Statistics Section */}
        <section className="border-b border-border px-4 py-16 md:py-20">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                  UK TB Statistics at a Glance
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  Real data from UKHSA reports shows concerning trends in
                  tuberculosis cases across the United Kingdom.
                </p>
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<Activity className="h-5 w-5" />}
                  value={nationalStats.notifications.toLocaleString()}
                  label="Annual TB Notifications"
                  sublabel="Cases reported in 2024"
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  value={`${currentIncidence}`}
                  label="per 100,000"
                  sublabel="National incidence rate"
                  highlight
                />
                <StatCard
                  icon={<MapPin className="h-5 w-5" />}
                  value={`${highestRegion.rate}`}
                  label={`${highestRegion.name} Rate`}
                  sublabel="Highest regional incidence"
                />
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  value={nationalStats.deaths.toLocaleString()}
                  label="TB Deaths"
                  sublabel="Annual mortality"
                />
              </div>

              {/* Trend visualization */}
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <TrendIndicator />
                <motion.div
                  variants={fadeInUp}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                    Key Risk Factors
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">
                        1
                      </span>
                      <div>
                        <span className="font-medium text-foreground">
                          Rising incidence
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Rates increasing since 2020 COVID low point
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">
                        2
                      </span>
                      <div>
                        <span className="font-medium text-foreground">
                          Regional disparities
                        </span>
                        <p className="text-sm text-muted-foreground">
                          London rate 2x national average at {highestRegion.rate}/100k
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">
                        3
                      </span>
                      <div>
                        <span className="font-medium text-foreground">
                          WHO threshold proximity
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Approaching 10/100k low-incidence cutoff
                        </p>
                      </div>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-b border-border px-4 py-16 md:py-20">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                  Powerful Simulation Features
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  Built with epidemiologically accurate models and real UK data to
                  help you understand disease dynamics.
                </p>
              </motion.div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <FeatureCard
                  icon={<Activity className="h-6 w-6" />}
                  title="SEIR Model"
                  description="Extended SEIR compartmental model specifically designed for TB with latency stages and reactivation."
                />
                <FeatureCard
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Real UK Data"
                  description="Integrated with official UKHSA statistics, regional demographics, and BCG coverage rates."
                />
                <FeatureCard
                  icon={<GitCompare className="h-6 w-6" />}
                  title="Policy Comparison"
                  description="Compare different vaccination strategies and intervention scenarios side by side."
                />
                <FeatureCard
                  icon={<MapPin className="h-6 w-6" />}
                  title="Interactive Maps"
                  description="Visualize regional differences with choropleth maps showing incidence and spread patterns."
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="border-b border-border px-4 py-16 md:py-20">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                  How It Works
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  Get started in minutes with our intuitive simulation interface.
                </p>
              </motion.div>

              <div className="space-y-0">
                <StepCard
                  number={1}
                  title="Configure Population"
                  description="Set up your simulation with UK regional data, age demographics, and population groups. Choose specific regions or simulate the entire country."
                  icon={<Users className="h-5 w-5" />}
                />
                <StepCard
                  number={2}
                  title="Set Vaccination Policy"
                  description="Configure BCG vaccination coverage for neonates, healthcare workers, and high-risk groups. Adjust coverage rates and eligibility criteria."
                  icon={<Shield className="h-5 w-5" />}
                />
                <StepCard
                  number={3}
                  title="Run Simulation"
                  description="Watch the epidemic unfold in real-time with agent-based visualization. See how disease spreads and how interventions affect outcomes."
                  icon={<PlayCircle className="h-5 w-5" />}
                />
                <StepCard
                  number={4}
                  title="Compare Outcomes"
                  description="Analyze results with detailed statistics. Compare infections prevented, deaths avoided, and cost-effectiveness of different strategies."
                  icon={<Settings className="h-5 w-5" />}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-4 py-16 md:py-24">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 text-center md:p-12"
            >
              <motion.h2
                variants={fadeInUp}
                className="mb-4 text-3xl font-bold text-foreground md:text-4xl"
              >
                Ready to Explore?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="mx-auto mb-8 max-w-xl text-muted-foreground"
              >
                Start with pre-built scenarios or create your own custom
                simulation to understand how vaccination policies can shape the
                future of TB in the UK.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link
                  href="/scenarios"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Explore Scenarios
                  <ChevronRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/simulator"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-input bg-background px-8 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Start Fresh
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
