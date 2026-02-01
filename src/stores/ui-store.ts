/**
 * UI Store - Zustand State Management for UI State
 *
 * This store manages ephemeral UI state including:
 * - Theme (light/dark mode)
 * - Sidebar visibility and active tab
 * - Mobile menu and drawer states
 * - Region selection and hover states
 * - Modal dialogs
 * - Tooltip positioning and content
 *
 * @module stores/ui-store
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Available sidebar tabs for configuration panels
 */
export type SidebarTab = 'scenarios' | 'population' | 'vaccination' | 'policy';

/**
 * Available modal content types
 */
export type ModalContent = 'info' | 'export' | 'share' | null;

/**
 * Position coordinates for tooltip placement
 */
export interface TooltipPosition {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
}

/**
 * UI store interface defining state and actions
 */
export interface UIStore {
  // ============ STATE ============

  /** Current theme setting */
  theme: Theme;

  /** Whether the sidebar is open */
  sidebarOpen: boolean;

  /** Currently active sidebar tab */
  sidebarTab: SidebarTab;

  /** Whether the mobile navigation menu is open */
  mobileMenuOpen: boolean;

  /** Whether the mobile sidebar drawer is open */
  mobileSidebarOpen: boolean;

  /** Whether the bottom panel (timeline) is expanded */
  bottomPanelExpanded: boolean;

  /** ID of the currently selected region (for map interactions) */
  selectedRegion: string | null;

  /** ID of the currently hovered region (for map interactions) */
  hoveredRegion: string | null;

  /** Whether a modal dialog is currently open */
  modalOpen: boolean;

  /** Type of content displayed in the modal */
  modalContent: ModalContent;

  /** Current tooltip text content */
  tooltipContent: string | null;

  /** Current tooltip position */
  tooltipPosition: TooltipPosition | null;

  // ============ ACTIONS ============

  /**
   * Set the theme
   * @param theme - Theme to set
   */
  setTheme: (theme: Theme) => void;

  /**
   * Toggle between light and dark themes
   */
  toggleTheme: () => void;

  /**
   * Toggle the sidebar open/closed state
   */
  toggleSidebar: () => void;

  /**
   * Set the sidebar open state explicitly
   * @param open - Whether the sidebar should be open
   */
  setSidebarOpen: (open: boolean) => void;

  /**
   * Set the active sidebar tab
   * @param tab - The tab to activate
   */
  setSidebarTab: (tab: SidebarTab) => void;

  /**
   * Set mobile navigation menu state
   * @param open - Whether the mobile menu should be open
   */
  setMobileMenuOpen: (open: boolean) => void;

  /**
   * Toggle mobile navigation menu
   */
  toggleMobileMenu: () => void;

  /**
   * Set mobile sidebar drawer state
   * @param open - Whether the mobile sidebar should be open
   */
  setMobileSidebarOpen: (open: boolean) => void;

  /**
   * Toggle mobile sidebar drawer
   */
  toggleMobileSidebar: () => void;

  /**
   * Set bottom panel expanded state
   * @param expanded - Whether the bottom panel should be expanded
   */
  setBottomPanelExpanded: (expanded: boolean) => void;

  /**
   * Toggle bottom panel expanded state
   */
  toggleBottomPanel: () => void;

  /**
   * Select a region on the map
   * @param regionId - The ID of the region to select, or null to deselect
   */
  selectRegion: (regionId: string | null) => void;

  /**
   * Set the hovered region on the map
   * @param regionId - The ID of the region being hovered, or null when not hovering
   */
  hoverRegion: (regionId: string | null) => void;

  /**
   * Open a modal with specified content
   * @param content - The type of content to display in the modal
   */
  openModal: (content: ModalContent) => void;

  /**
   * Close the currently open modal
   */
  closeModal: () => void;

  /**
   * Show a tooltip at specified position with content
   * @param content - The text content to display in the tooltip
   * @param position - The x/y coordinates for tooltip placement
   */
  showTooltip: (content: string, position: TooltipPosition) => void;

  /**
   * Hide the currently visible tooltip
   */
  hideTooltip: () => void;
}

/**
 * Apply theme to the document
 * @param theme - Theme to apply
 */
function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

/**
 * Default UI state values
 */
const DEFAULT_UI_STATE = {
  theme: 'system' as Theme,
  sidebarOpen: true,
  sidebarTab: 'scenarios' as SidebarTab,
  mobileMenuOpen: false,
  mobileSidebarOpen: false,
  bottomPanelExpanded: true,
  selectedRegion: null,
  hoveredRegion: null,
  modalOpen: false,
  modalContent: null as ModalContent,
  tooltipContent: null,
  tooltipPosition: null,
};

/**
 * Zustand store for UI state management
 *
 * Uses devtools middleware for debugging and subscribeWithSelector
 * for optimized component subscriptions.
 *
 * Note: This store does NOT use persist middleware as UI state
 * should reset on page refresh for better UX.
 *
 * @example
 * ```tsx
 * import { useUIStore } from '@/stores/ui-store';
 *
 * function Sidebar() {
 *   const { sidebarOpen, sidebarTab, setSidebarTab, toggleSidebar } = useUIStore();
 *
 *   if (!sidebarOpen) {
 *     return <button onClick={toggleSidebar}>Open Sidebar</button>;
 *   }
 *
 *   return (
 *     <aside>
 *       <button onClick={toggleSidebar}>Close</button>
 *       <nav>
 *         <button onClick={() => setSidebarTab('scenarios')}>Scenarios</button>
 *         <button onClick={() => setSidebarTab('population')}>Population</button>
 *         <button onClick={() => setSidebarTab('vaccination')}>Vaccination</button>
 *         <button onClick={() => setSidebarTab('policy')}>Policy</button>
 *       </nav>
 *       <div>Active tab: {sidebarTab}</div>
 *     </aside>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Map region interactions
 * function RegionInfo() {
 *   const selectedRegion = useUIStore((state) => state.selectedRegion);
 *   const hoveredRegion = useUIStore((state) => state.hoveredRegion);
 *
 *   const activeRegion = selectedRegion || hoveredRegion;
 *   if (!activeRegion) return null;
 *
 *   return <div>Viewing: {activeRegion}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Modal usage
 * function ExportButton() {
 *   const openModal = useUIStore((state) => state.openModal);
 *
 *   return (
 *     <button onClick={() => openModal('export')}>
 *       Export Results
 *     </button>
 *   );
 * }
 *
 * function ModalContainer() {
 *   const { modalOpen, modalContent, closeModal } = useUIStore();
 *
 *   if (!modalOpen) return null;
 *
 *   return (
 *     <div className="modal-overlay" onClick={closeModal}>
 *       <div className="modal-content">
 *         {modalContent === 'export' && <ExportDialog />}
 *         {modalContent === 'share' && <ShareDialog />}
 *         {modalContent === 'info' && <InfoDialog />}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // ============ INITIAL STATE ============

        theme: DEFAULT_UI_STATE.theme,
        sidebarOpen: DEFAULT_UI_STATE.sidebarOpen,
        sidebarTab: DEFAULT_UI_STATE.sidebarTab,
        mobileMenuOpen: DEFAULT_UI_STATE.mobileMenuOpen,
        mobileSidebarOpen: DEFAULT_UI_STATE.mobileSidebarOpen,
        bottomPanelExpanded: DEFAULT_UI_STATE.bottomPanelExpanded,
        selectedRegion: DEFAULT_UI_STATE.selectedRegion,
        hoveredRegion: DEFAULT_UI_STATE.hoveredRegion,
        modalOpen: DEFAULT_UI_STATE.modalOpen,
        modalContent: DEFAULT_UI_STATE.modalContent,
        tooltipContent: DEFAULT_UI_STATE.tooltipContent,
        tooltipPosition: DEFAULT_UI_STATE.tooltipPosition,

        // ============ ACTIONS ============

        setTheme: (theme) => {
          applyTheme(theme);
          set({ theme }, false, 'setTheme');
        },

        toggleTheme: () => {
          const { theme } = get();
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          applyTheme(newTheme);
          set({ theme: newTheme }, false, 'toggleTheme');
        },

        toggleSidebar: () => {
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'toggleSidebar'
          );
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open }, false, 'setSidebarOpen');
        },

        setSidebarTab: (sidebarTab) => {
          set({ sidebarTab }, false, 'setSidebarTab');
        },

        setMobileMenuOpen: (open) => {
          set({ mobileMenuOpen: open }, false, 'setMobileMenuOpen');
        },

        toggleMobileMenu: () => {
          set(
            (state) => ({ mobileMenuOpen: !state.mobileMenuOpen }),
            false,
            'toggleMobileMenu'
          );
        },

        setMobileSidebarOpen: (open) => {
          set({ mobileSidebarOpen: open }, false, 'setMobileSidebarOpen');
        },

        toggleMobileSidebar: () => {
          set(
            (state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }),
            false,
            'toggleMobileSidebar'
          );
        },

        setBottomPanelExpanded: (expanded) => {
          set({ bottomPanelExpanded: expanded }, false, 'setBottomPanelExpanded');
        },

        toggleBottomPanel: () => {
          set(
            (state) => ({ bottomPanelExpanded: !state.bottomPanelExpanded }),
            false,
            'toggleBottomPanel'
          );
        },

        selectRegion: (regionId) => {
          set({ selectedRegion: regionId }, false, 'selectRegion');
        },

        hoverRegion: (regionId) => {
          set({ hoveredRegion: regionId }, false, 'hoverRegion');
        },

        openModal: (content) => {
          set(
            { modalOpen: true, modalContent: content },
            false,
            'openModal'
          );
        },

        closeModal: () => {
          set(
            { modalOpen: false, modalContent: null },
            false,
            'closeModal'
          );
        },

        showTooltip: (content, position) => {
          set(
            { tooltipContent: content, tooltipPosition: position },
            false,
            'showTooltip'
          );
        },

        hideTooltip: () => {
          set(
            { tooltipContent: null, tooltipPosition: null },
            false,
            'hideTooltip'
          );
        },
      })),
      {
        name: 'tb-simulator-ui',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          bottomPanelExpanded: state.bottomPanelExpanded,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme on rehydration
          if (state?.theme) {
            applyTheme(state.theme);
          }
        },
      }
    ),
    {
      name: 'ui-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============ SELECTORS ============

/**
 * Selector for sidebar state
 */
export const selectSidebarState = (store: UIStore) => ({
  open: store.sidebarOpen,
  tab: store.sidebarTab,
});

/**
 * Selector for sidebar open state
 */
export const selectSidebarOpen = (store: UIStore) => store.sidebarOpen;

/**
 * Selector for active sidebar tab
 */
export const selectSidebarTab = (store: UIStore) => store.sidebarTab;

/**
 * Selector for region selection state
 */
export const selectRegionState = (store: UIStore) => ({
  selected: store.selectedRegion,
  hovered: store.hoveredRegion,
});

/**
 * Selector for selected region
 */
export const selectSelectedRegion = (store: UIStore) => store.selectedRegion;

/**
 * Selector for hovered region
 */
export const selectHoveredRegion = (store: UIStore) => store.hoveredRegion;

/**
 * Selector for active region (selected takes precedence over hovered)
 */
export const selectActiveRegion = (store: UIStore) =>
  store.selectedRegion ?? store.hoveredRegion;

/**
 * Selector for modal state
 */
export const selectModalState = (store: UIStore) => ({
  open: store.modalOpen,
  content: store.modalContent,
});

/**
 * Selector for modal open state
 */
export const selectModalOpen = (store: UIStore) => store.modalOpen;

/**
 * Selector for modal content type
 */
export const selectModalContent = (store: UIStore) => store.modalContent;

/**
 * Selector for tooltip state
 */
export const selectTooltipState = (store: UIStore) => ({
  content: store.tooltipContent,
  position: store.tooltipPosition,
});

/**
 * Selector for whether tooltip is visible
 */
export const selectTooltipVisible = (store: UIStore) =>
  store.tooltipContent !== null && store.tooltipPosition !== null;

/**
 * Selector for theme
 */
export const selectTheme = (store: UIStore) => store.theme;

/**
 * Selector for mobile menu state
 */
export const selectMobileMenuOpen = (store: UIStore) => store.mobileMenuOpen;

/**
 * Selector for mobile sidebar state
 */
export const selectMobileSidebarOpen = (store: UIStore) => store.mobileSidebarOpen;

/**
 * Selector for bottom panel expanded state
 */
export const selectBottomPanelExpanded = (store: UIStore) => store.bottomPanelExpanded;

// ============ EXPORTS ============

export { DEFAULT_UI_STATE };
