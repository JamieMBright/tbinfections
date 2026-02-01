/**
 * Settings Store - Zustand State Management for Application Settings
 *
 * This store manages application-wide settings including:
 * - Theme preferences (light, dark, system)
 * - Visualization mode selection
 * - Animation and display settings
 * - Accessibility options
 *
 * @module stores/settings-store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Theme options for the application
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Visualization mode options for displaying simulation data
 */
export type VisualizationMode = 'aggregate' | 'agent-based' | 'map';

/**
 * Settings store interface defining state and actions
 */
export interface SettingsStore {
  // ============ STATE ============

  /** Current theme setting */
  theme: Theme;

  /** Current visualization mode for simulation display */
  visualizationMode: VisualizationMode;

  /** Animation speed multiplier (1-10, where 1 is slowest, 10 is fastest) */
  animationSpeed: number;

  /** Whether to show transmission event visualizations */
  showTransmissionEvents: boolean;

  /** Whether to show vaccination effect visualizations */
  showVaccinationEffects: boolean;

  /** Whether to use reduced motion for accessibility */
  reducedMotion: boolean;

  /** Whether to use color-blind friendly palette */
  colorBlindMode: boolean;

  // ============ ACTIONS ============

  /**
   * Set the application theme
   * @param theme - The theme to set ('light', 'dark', or 'system')
   */
  setTheme: (theme: Theme) => void;

  /**
   * Set the visualization mode for simulation display
   * @param mode - The visualization mode to set
   */
  setVisualizationMode: (mode: VisualizationMode) => void;

  /**
   * Set the animation speed
   * @param speed - Speed value from 1 (slowest) to 10 (fastest)
   */
  setAnimationSpeed: (speed: number) => void;

  /**
   * Toggle visibility of transmission event visualizations
   */
  toggleTransmissionEvents: () => void;

  /**
   * Toggle visibility of vaccination effect visualizations
   */
  toggleVaccinationEffects: () => void;

  /**
   * Toggle reduced motion mode for accessibility
   */
  toggleReducedMotion: () => void;

  /**
   * Toggle color-blind friendly mode
   */
  toggleColorBlindMode: () => void;
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS = {
  theme: 'system' as Theme,
  visualizationMode: 'aggregate' as VisualizationMode,
  animationSpeed: 5,
  showTransmissionEvents: true,
  showVaccinationEffects: true,
  reducedMotion: false,
  colorBlindMode: false,
};

/**
 * Zustand store for application settings management
 *
 * Uses devtools middleware for debugging and persist middleware
 * for localStorage persistence across sessions.
 *
 * @example
 * ```tsx
 * import { useSettingsStore } from '@/stores/settings-store';
 *
 * function SettingsPanel() {
 *   const { theme, setTheme, animationSpeed, setAnimationSpeed } = useSettingsStore();
 *
 *   return (
 *     <div>
 *       <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *         <option value="system">System</option>
 *       </select>
 *       <input
 *         type="range"
 *         min={1}
 *         max={10}
 *         value={animationSpeed}
 *         onChange={(e) => setAnimationSpeed(Number(e.target.value))}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Subscribe to specific settings for performance
 * const theme = useSettingsStore((state) => state.theme);
 * const reducedMotion = useSettingsStore((state) => state.reducedMotion);
 * ```
 */
export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        // ============ INITIAL STATE ============

        theme: DEFAULT_SETTINGS.theme,
        visualizationMode: DEFAULT_SETTINGS.visualizationMode,
        animationSpeed: DEFAULT_SETTINGS.animationSpeed,
        showTransmissionEvents: DEFAULT_SETTINGS.showTransmissionEvents,
        showVaccinationEffects: DEFAULT_SETTINGS.showVaccinationEffects,
        reducedMotion: DEFAULT_SETTINGS.reducedMotion,
        colorBlindMode: DEFAULT_SETTINGS.colorBlindMode,

        // ============ ACTIONS ============

        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
        },

        setVisualizationMode: (visualizationMode) => {
          set({ visualizationMode }, false, 'setVisualizationMode');
        },

        setAnimationSpeed: (speed) => {
          // Clamp speed between 1 and 10
          const clampedSpeed = Math.max(1, Math.min(10, speed));
          set({ animationSpeed: clampedSpeed }, false, 'setAnimationSpeed');
        },

        toggleTransmissionEvents: () => {
          set(
            (state) => ({ showTransmissionEvents: !state.showTransmissionEvents }),
            false,
            'toggleTransmissionEvents'
          );
        },

        toggleVaccinationEffects: () => {
          set(
            (state) => ({ showVaccinationEffects: !state.showVaccinationEffects }),
            false,
            'toggleVaccinationEffects'
          );
        },

        toggleReducedMotion: () => {
          set(
            (state) => ({ reducedMotion: !state.reducedMotion }),
            false,
            'toggleReducedMotion'
          );
        },

        toggleColorBlindMode: () => {
          set(
            (state) => ({ colorBlindMode: !state.colorBlindMode }),
            false,
            'toggleColorBlindMode'
          );
        },
      }),
      {
        name: 'tb-simulator-settings',
        // Only persist specific settings to localStorage
        partialize: (state) => ({
          theme: state.theme,
          visualizationMode: state.visualizationMode,
          animationSpeed: state.animationSpeed,
          showTransmissionEvents: state.showTransmissionEvents,
          showVaccinationEffects: state.showVaccinationEffects,
          reducedMotion: state.reducedMotion,
          colorBlindMode: state.colorBlindMode,
        }),
      }
    ),
    {
      name: 'settings-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============ SELECTORS ============

/**
 * Selector for current theme
 */
export const selectTheme = (store: SettingsStore) => store.theme;

/**
 * Selector for visualization mode
 */
export const selectVisualizationMode = (store: SettingsStore) =>
  store.visualizationMode;

/**
 * Selector for animation speed
 */
export const selectAnimationSpeed = (store: SettingsStore) =>
  store.animationSpeed;

/**
 * Selector for transmission events visibility
 */
export const selectShowTransmissionEvents = (store: SettingsStore) =>
  store.showTransmissionEvents;

/**
 * Selector for vaccination effects visibility
 */
export const selectShowVaccinationEffects = (store: SettingsStore) =>
  store.showVaccinationEffects;

/**
 * Selector for reduced motion preference
 */
export const selectReducedMotion = (store: SettingsStore) => store.reducedMotion;

/**
 * Selector for color-blind mode
 */
export const selectColorBlindMode = (store: SettingsStore) => store.colorBlindMode;

/**
 * Selector for all accessibility settings
 */
export const selectAccessibilitySettings = (store: SettingsStore) => ({
  reducedMotion: store.reducedMotion,
  colorBlindMode: store.colorBlindMode,
});

/**
 * Selector for all visualization settings
 */
export const selectVisualizationSettings = (store: SettingsStore) => ({
  mode: store.visualizationMode,
  animationSpeed: store.animationSpeed,
  showTransmissionEvents: store.showTransmissionEvents,
  showVaccinationEffects: store.showVaccinationEffects,
});

// ============ EXPORTS ============

export { DEFAULT_SETTINGS };
