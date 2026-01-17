import { create } from 'zustand';
import type { AppSettings } from '../../../types/rust-bindings';
import { api } from '../../../lib/tauri';

export type ViewMode = 'split' | 'editor' | 'preview';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // View mode (persisted to localStorage)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // TypeSection expand/collapse states (persisted to localStorage)
  typeSectionStates: Record<string, boolean>;
  setTypeSectionState: (section: string, expanded: boolean) => void;

  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  addProjectRoot: (root: string) => Promise<void>;
  removeProjectRoot: (root: string) => Promise<void>;
}

const defaultSettings: AppSettings = {
  projectRoots: [],
  lastScanTime: undefined,
};

// Load viewMode from localStorage
const getInitialViewMode = (): ViewMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tool-viewer-view-mode');
    if (saved === 'split' || saved === 'editor' || saved === 'preview') {
      return saved;
    }
  }
  return 'split';
};

// Load TypeSection states from localStorage
const getInitialTypeSectionStates = (): Record<string, boolean> => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tool-viewer-type-section-states');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }
  // Default: all sections expanded
  return { commands: true, agents: true, skills: true, hooks: true };
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  viewMode: getInitialViewMode(),
  setViewMode: (mode) => {
    localStorage.setItem('tool-viewer-view-mode', mode);
    set({ viewMode: mode });
  },

  typeSectionStates: getInitialTypeSectionStates(),
  setTypeSectionState: (section, expanded) => {
    const newStates = { ...get().typeSectionStates, [section]: expanded };
    localStorage.setItem('tool-viewer-type-section-states', JSON.stringify(newStates));
    set({ typeSectionStates: newStates });
  },

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await api.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false, error: String(error) });
    }
  },

  saveSettings: async (settings) => {
    try {
      await api.saveSettings(settings);
      set({ settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      set({ error: String(error) });
    }
  },

  addProjectRoot: async (root) => {
    const { settings, saveSettings } = get();
    if (!settings.projectRoots.includes(root)) {
      const newSettings = {
        ...settings,
        projectRoots: [...settings.projectRoots, root],
      };
      await saveSettings(newSettings);
    }
  },

  removeProjectRoot: async (root) => {
    const { settings, saveSettings } = get();
    const newSettings = {
      ...settings,
      projectRoots: settings.projectRoots.filter((r) => r !== root),
    };
    await saveSettings(newSettings);
  },
}));
