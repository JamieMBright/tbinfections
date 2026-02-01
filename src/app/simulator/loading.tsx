/**
 * Simulator Loading State
 *
 * Displays a skeleton loader while the simulator page is loading.
 * Shows loading spinner and initialization message.
 *
 * @module app/simulator/loading
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading spinner SVG component
 */
function LoadingSpinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * SimulatorSkeleton Component
 *
 * Skeleton placeholder matching the simulator layout structure.
 */
function SimulatorSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-80 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {/* Scenario Presets Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Population Panel Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 rounded-lg" />
          </div>

          {/* Vaccination Panel Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-32 rounded-lg" />
          </div>

          {/* Policy Panel Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header Skeleton */}
        <div className="flex items-center border-b border-border px-4 py-2 md:hidden">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Visualization Area Skeleton */}
        <main className="flex-1 p-4">
          <div className="h-full space-y-4">
            {/* Canvas/Map Area */}
            <Skeleton className="h-[60%] w-full rounded-lg" />

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        </main>

        {/* Timeline Panel Skeleton */}
        <div className="h-30 border-t border-border bg-background">
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <div className="flex items-center gap-4 px-4 py-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SimulatorLoading Component
 *
 * Displays while the simulator page is loading.
 * Shows skeleton UI with loading indicator.
 */
export default function SimulatorLoading() {
  return (
    <div className="relative">
      {/* Skeleton Layout */}
      <SimulatorSkeleton />

      {/* Centered Loading Indicator */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Initializing simulation...
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Loading epidemiological model and UK data
        </p>
      </div>
    </div>
  );
}
