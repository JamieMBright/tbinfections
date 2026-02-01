'use client';

/**
 * SimulatorLayout Component
 *
 * Main layout component for the simulator page with:
 * - Collapsible sidebar for controls
 * - Main content area for visualization
 * - Bottom panel for timeline controls
 * - Responsive design with mobile drawer
 *
 * @module components/layout/SimulatorLayout
 */

import { useCallback, useEffect, type ReactNode } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

/**
 * SimulatorLayout component props
 */
export interface SimulatorLayoutProps {
  /** Main content to render in the visualization area */
  children: ReactNode;
  /** Sidebar content (control panels) */
  sidebar?: ReactNode;
  /** Bottom panel content (timeline controls) */
  bottomPanel?: ReactNode;
  /** Additional CSS classes for the layout container */
  className?: string;
}

/**
 * Sidebar width constants
 */
const SIDEBAR_WIDTH = {
  expanded: 320, // px
  collapsed: 0, // px
} as const;

/**
 * Bottom panel height constants
 */
const BOTTOM_PANEL_HEIGHT = {
  expanded: 120, // px
  collapsed: 48, // px for the toggle bar
} as const;

/**
 * SimulatorLayout - Main layout component for the simulator interface
 *
 * Provides a responsive three-panel layout:
 * - Left sidebar: Configuration controls (collapsible)
 * - Main area: Visualization canvas
 * - Bottom panel: Timeline controls (collapsible)
 *
 * On mobile devices, the sidebar transforms into a slide-out drawer.
 *
 * @example
 * ```tsx
 * import { SimulatorLayout } from '@/components/layout/SimulatorLayout';
 *
 * function SimulatorPage() {
 *   return (
 *     <SimulatorLayout
 *       sidebar={<ControlsSidebar />}
 *       bottomPanel={<TimelineControl />}
 *     >
 *       <SimulationCanvas />
 *     </SimulatorLayout>
 *   );
 * }
 * ```
 */
export function SimulatorLayout({
  children,
  sidebar,
  bottomPanel,
  className = '',
}: SimulatorLayoutProps) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);
  const bottomPanelExpanded = useUIStore((state) => state.bottomPanelExpanded);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setMobileSidebarOpen = useUIStore((state) => state.setMobileSidebarOpen);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);

  /**
   * Handle escape key to close mobile sidebar
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileSidebarOpen, setMobileSidebarOpen]);

  /**
   * Prevent body scroll when mobile sidebar is open
   */
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  /**
   * Handle sidebar toggle keyboard interaction
   */
  const handleSidebarToggleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSidebar();
      }
    },
    [toggleSidebar]
  );

  /**
   * Handle bottom panel toggle keyboard interaction
   */
  const handleBottomPanelToggleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleBottomPanel();
      }
    },
    [toggleBottomPanel]
  );

  /**
   * Handle mobile sidebar close
   */
  const handleCloseMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, [setMobileSidebarOpen]);

  /**
   * Handle overlay click to close mobile sidebar
   */
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        setMobileSidebarOpen(false);
      }
    },
    [setMobileSidebarOpen]
  );

  return (
    <div
      className={`relative flex h-[calc(100vh-4rem)] overflow-hidden bg-background ${className}`}
    >
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-80' : 'w-0'
        }`}
        style={{
          width: sidebarOpen ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed,
        }}
        role="complementary"
        aria-label="Simulation controls sidebar"
        aria-hidden={!sidebarOpen}
      >
        {sidebarOpen && (
          <div className="flex h-full flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <h2 className="text-sm font-semibold text-sidebar-foreground">
                Controls
              </h2>
              <button
                type="button"
                onClick={toggleSidebar}
                onKeyDown={handleSidebarToggleKeyDown}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2"
                aria-label="Collapse sidebar"
                aria-expanded={sidebarOpen}
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              {sidebar}
            </div>
          </div>
        )}
      </aside>

      {/* Sidebar Toggle Button (when collapsed) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          onKeyDown={handleSidebarToggleKeyDown}
          className="hidden md:flex absolute left-0 top-4 z-10 h-10 w-10 items-center justify-center rounded-r-md border border-l-0 border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Expand sidebar"
          aria-expanded={sidebarOpen}
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Simulation controls"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] border-r border-border bg-sidebar shadow-lg"
            role="complementary"
            aria-label="Simulation controls sidebar"
          >
            <div className="flex h-full flex-col overflow-hidden">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                <h2 className="text-sm font-semibold text-sidebar-foreground">
                  Controls
                </h2>
                <button
                  type="button"
                  onClick={handleCloseMobileSidebar}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                {sidebar}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <div className="flex items-center border-b border-border px-4 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Open controls sidebar"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            <span>Controls</span>
          </button>
        </div>

        {/* Visualization Area */}
        <main
          className="flex-1 overflow-auto"
          role="main"
          aria-label="Simulation visualization"
        >
          {children}
        </main>

        {/* Bottom Panel */}
        {bottomPanel && (
          <div
            className={`border-t border-border bg-background transition-all duration-300 ease-in-out ${
              bottomPanelExpanded ? 'h-30' : 'h-12'
            }`}
            style={{
              height: bottomPanelExpanded
                ? BOTTOM_PANEL_HEIGHT.expanded
                : BOTTOM_PANEL_HEIGHT.collapsed,
            }}
            role="region"
            aria-label="Timeline controls"
          >
            {/* Toggle Bar */}
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-medium text-foreground">
                Timeline
              </span>
              <button
                type="button"
                onClick={toggleBottomPanel}
                onKeyDown={handleBottomPanelToggleKeyDown}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={
                  bottomPanelExpanded
                    ? 'Collapse timeline panel'
                    : 'Expand timeline panel'
                }
                aria-expanded={bottomPanelExpanded}
              >
                {bottomPanelExpanded ? (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Panel Content */}
            {bottomPanelExpanded && (
              <div className="h-[calc(100%-3rem)] overflow-auto px-4 py-2">
                {bottomPanel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SimulatorLayout;
