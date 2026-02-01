'use client';

/**
 * Footer Component
 *
 * Application footer with copyright notice, navigation links, and attributions.
 * Features:
 * - Copyright notice with dynamic year
 * - Navigation links (About, Data Sources, Privacy, GitHub)
 * - UKHSA and WHO attribution
 * - Responsive grid layout
 *
 * @module components/layout/Footer
 */

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

/**
 * Footer link configuration
 */
interface FooterLink {
  /** Display label for the link */
  label: string;
  /** URL path for the link */
  href: string;
  /** Whether the link is external */
  external?: boolean;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * Footer section configuration
 */
interface FooterSection {
  /** Section title */
  title: string;
  /** Links in this section */
  links: FooterLink[];
}

/**
 * Footer sections configuration
 */
const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Navigation',
    links: [
      { label: 'Home', href: '/', ariaLabel: 'Go to home page' },
      { label: 'Simulator', href: '/simulator', ariaLabel: 'Open the TB simulator' },
      { label: 'Scenarios', href: '/scenarios', ariaLabel: 'View pre-built scenarios' },
      { label: 'About', href: '/about', ariaLabel: 'Learn about this project' },
    ],
  },
  {
    title: 'Resources',
    links: [
      {
        label: 'Data Sources',
        href: '/about#data-sources',
        ariaLabel: 'View data sources used in the simulator',
      },
      {
        label: 'Privacy Policy',
        href: '/privacy',
        ariaLabel: 'Read our privacy policy',
      },
      {
        label: 'GitHub',
        href: 'https://github.com/JamieMBright/tbinfections',
        external: true,
        ariaLabel: 'View source code on GitHub',
      },
    ],
  },
  {
    title: 'Data Partners',
    links: [
      {
        label: 'UKHSA TB Reports',
        href: 'https://www.gov.uk/government/publications/tuberculosis-in-england-2025-report',
        external: true,
        ariaLabel: 'View UKHSA TB reports',
      },
      {
        label: 'WHO TB Programme',
        href: 'https://www.who.int/teams/global-tuberculosis-programme',
        external: true,
        ariaLabel: 'Visit WHO Global Tuberculosis Programme',
      },
      {
        label: 'NHS Digital',
        href: 'https://digital.nhs.uk/',
        external: true,
        ariaLabel: 'Visit NHS Digital',
      },
    ],
  },
];

/**
 * Footer component props
 */
export interface FooterProps {
  /** Additional CSS classes for the footer */
  className?: string;
}

/**
 * Footer component with copyright, links, and attributions
 *
 * @example
 * ```tsx
 * import { Footer } from '@/components/layout/Footer';
 *
 * function App() {
 *   return (
 *     <>
 *       <main>Content</main>
 *       <Footer />
 *     </>
 *   );
 * }
 * ```
 */
export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-border bg-muted/50 ${className}`}
      role="contentinfo"
    >
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand and Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-semibold text-foreground">
              TB Infections Simulator
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An interactive tuberculosis vaccination simulator for the UK,
              visualizing the impact of vaccination policies on disease spread
              using epidemiologically accurate SEIR modeling.
            </p>
          </div>

          {/* Footer Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                        aria-label={link.ariaLabel}
                      >
                        {link.label}
                        <ExternalLink
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                        aria-label={link.ariaLabel}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Attribution Section */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            {/* Data Attribution */}
            <div className="text-xs text-muted-foreground">
              <p>
                Epidemiological data sourced from{' '}
                <a
                  href="https://www.gov.uk/government/organisations/uk-health-security-agency"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                >
                  UK Health Security Agency (UKHSA)
                </a>{' '}
                and{' '}
                <a
                  href="https://www.who.int/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                >
                  World Health Organization (WHO)
                </a>
                .
              </p>
            </div>

            {/* Copyright */}
            <div className="text-xs text-muted-foreground">
              <p>
                &copy; {currentYear} TB Infections Simulator. For educational
                and research purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground/70">
            This simulator is for educational purposes only and should not be
            used as a substitute for professional medical advice or public
            health guidance.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
