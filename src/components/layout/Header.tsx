'use client';

/**
 * Header Component
 *
 * Main navigation header for the TB Infections Simulator application.
 * Features:
 * - App logo and title
 * - Navigation links (Home, Simulator, Scenarios, About)
 * - Theme toggle button (light/dark mode)
 * - Responsive hamburger menu for mobile devices
 *
 * @module components/layout/Header
 */

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sun,
  Moon,
  Activity,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

/**
 * Navigation link configuration
 */
interface NavLink {
  /** Display label for the link */
  label: string;
  /** URL path for the link */
  href: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * Navigation links configuration
 */
const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/', ariaLabel: 'Go to home page' },
  { label: 'Simulator', href: '/simulator', ariaLabel: 'Open the TB simulator' },
  { label: 'Scenarios', href: '/scenarios', ariaLabel: 'View pre-built scenarios' },
  { label: 'About', href: '/about', ariaLabel: 'Learn about this project' },
];

/**
 * Header component props
 */
export interface HeaderProps {
  /** Additional CSS classes for the header */
  className?: string;
}

/**
 * Header component with navigation, theme toggle, and mobile menu
 *
 * @example
 * ```tsx
 * import { Header } from '@/components/layout/Header';
 *
 * function App() {
 *   return (
 *     <>
 *       <Header />
 *       <main>Content</main>
 *     </>
 *   );
 * }
 * ```
 */
export function Header({ className = '' }: HeaderProps) {
  const pathname = usePathname();
  const theme = useUIStore((state) => state.theme);
  const mobileMenuOpen = useUIStore((state) => state.mobileMenuOpen);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const setMobileMenuOpen = useUIStore((state) => state.setMobileMenuOpen);

  /**
   * Handle keyboard navigation for mobile menu toggle
   */
  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setMobileMenuOpen(!mobileMenuOpen);
      }
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    },
    [mobileMenuOpen, setMobileMenuOpen]
  );

  /**
   * Handle keyboard navigation for theme toggle
   */
  const handleThemeKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleTheme();
      }
    },
    [toggleTheme]
  );

  /**
   * Close mobile menu when a navigation link is clicked
   */
  const handleNavLinkClick = useCallback(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen, setMobileMenuOpen]);

  /**
   * Check if a link is currently active
   */
  const isActiveLink = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  /**
   * Get the effective theme (resolves 'system' to actual theme)
   */
  const effectiveTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    : theme;

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
      role="banner"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
          aria-label="TB Infections Simulator - Go to home page"
        >
          <Activity className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="font-semibold text-lg hidden sm:inline">
            TB Infections Simulator
          </span>
          <span className="font-semibold text-lg sm:hidden">
            TB Simulator
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6"
          role="navigation"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 py-1 ${
                isActiveLink(link.href)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
              aria-label={link.ariaLabel}
              aria-current={isActiveLink(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            onKeyDown={handleThemeKeyDown}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={effectiveTheme === 'dark'}
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onKeyDown={handleMenuKeyDown}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-border transition-all duration-200 ease-in-out ${
          mobileMenuOpen
            ? 'max-h-64 opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="container mx-auto px-4 py-4">
          <ul className="flex flex-col gap-2" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={handleNavLinkClick}
                  className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    isActiveLink(link.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                  aria-label={link.ariaLabel}
                  aria-current={isActiveLink(link.href) ? 'page' : undefined}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
