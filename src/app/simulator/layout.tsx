import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Simulator Page Metadata
 *
 * Provides SEO and social sharing metadata specific to the simulator.
 */
export const metadata: Metadata = {
  title: 'Simulator | TB Infections Simulator',
  description:
    'Interactive TB vaccination simulator using SEIR epidemiological modeling. ' +
    'Explore different vaccination scenarios and policy interventions for UK tuberculosis control.',
  keywords: [
    'TB simulator',
    'SEIR model',
    'vaccination simulator',
    'tuberculosis modeling',
    'epidemiology',
    'BCG vaccine',
    'UK public health',
  ],
  openGraph: {
    title: 'TB Vaccination Simulator',
    description:
      'Visualize the impact of vaccination policies on tuberculosis spread in the UK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TB Vaccination Simulator',
    description:
      'Interactive epidemiological simulation of TB vaccination policies in the UK',
  },
};

/**
 * SimulatorLayout
 *
 * Layout wrapper for the simulator page.
 * Provides context providers and page structure specific to the simulation.
 *
 * @param children - Page content to render
 */
export default function SimulatorPageLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
