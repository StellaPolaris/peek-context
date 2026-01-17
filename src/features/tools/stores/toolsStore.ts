import { create } from 'zustand';
import type { Tool, ToolType, ToolScope, EnabledPluginsResponse } from '../../../types/rust-bindings';
import { api } from '../../../lib/tauri';

interface ToolsState {
  tools: Tool[];
  filteredTools: Tool[];
  selectedTool: Tool | null;
  dirtyTools: Set<string>;
  originalContent: Map<string, string>; // Track original content for discard

  // Enabled plugins data
  enabledPlugins: EnabledPluginsResponse | null;

  // Filters - multi-select arrays
  typeFilters: ToolType[];
  scopeFilters: ToolScope[];
  projectFilter: string | 'all';
  searchQuery: string;

  // Loading states
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;

  // Actions
  loadTools: (projectRoots: string[]) => Promise<void>;
  loadEnabledPlugins: (projectRoots: string[]) => Promise<void>;
  selectTool: (tool: Tool | null) => void;
  updateToolContent: (toolId: string, content: string) => void;
  saveTool: (toolId: string) => Promise<void>;
  setTypeFilters: (types: ToolType[]) => void;
  toggleTypeFilter: (type: ToolType) => void;
  setScopeFilters: (scopes: ToolScope[]) => void;
  toggleScopeFilter: (scope: ToolScope) => void;
  setProjectFilter: (project: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  clearDirty: (toolId: string) => void;
  discardChanges: (toolId: string) => void;
}

// All tool types and scopes for reference
const ALL_TYPES: ToolType[] = ['command', 'agent', 'skill', 'hook'];
const ALL_SCOPES: ToolScope[] = ['global', 'project'];

const applyFilters = (
  tools: Tool[],
  typeFilters: ToolType[],
  scopeFilters: ToolScope[],
  projectFilter: string | 'all',
  searchQuery: string
): Tool[] => {
  let filtered = [...tools];

  // Type filter - include if type is in the array (empty array or all types = show all)
  if (typeFilters.length > 0 && typeFilters.length < ALL_TYPES.length) {
    filtered = filtered.filter((t) => typeFilters.includes(t.toolType));
  }

  // Scope filter - include if scope is in the array (empty array or all scopes = show all)
  if (scopeFilters.length > 0 && scopeFilters.length < ALL_SCOPES.length) {
    filtered = filtered.filter((t) => scopeFilters.includes(t.scope));
  }

  if (projectFilter !== 'all') {
    // Show tools available in project context: global + this project's tools
    filtered = filtered.filter(
      (t) => t.scope === 'global' || t.projectRoot === projectFilter
    );
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.frontmatter.description?.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export const useToolsStore = create<ToolsState>((set, get) => ({
  tools: [],
  filteredTools: [],
  selectedTool: null,
  dirtyTools: new Set(),
  originalContent: new Map(),

  enabledPlugins: null,

  // Default: all types checked, only project + global scopes (plugin unchecked)
  typeFilters: ['command', 'agent', 'skill', 'hook'],
  scopeFilters: ['project', 'global'],
  projectFilter: 'all',
  searchQuery: '',

  isLoading: false,
  isScanning: false,
  error: null,

  loadTools: async (projectRoots) => {
    set({ isScanning: true, error: null });
    try {
      // Load tools and enabled plugins in parallel
      const [tools, enabledPlugins] = await Promise.all([
        api.scanAllTools(projectRoots),
        api.getEnabledPlugins(projectRoots),
      ]);
      const { typeFilters, scopeFilters, projectFilter, searchQuery } = get();
      const filteredTools = applyFilters(tools, typeFilters, scopeFilters, projectFilter, searchQuery);
      set({ tools, filteredTools, enabledPlugins, isScanning: false });
    } catch (error) {
      console.error('Failed to load tools:', error);
      set({ isScanning: false, error: String(error) });
    }
  },

  loadEnabledPlugins: async (projectRoots) => {
    try {
      const enabledPlugins = await api.getEnabledPlugins(projectRoots);
      set({ enabledPlugins });
    } catch (error) {
      console.error('Failed to load enabled plugins:', error);
    }
  },

  selectTool: (tool) => set({ selectedTool: tool }),

  updateToolContent: (toolId, content) => {
    set((state) => {
      const newDirty = new Set(state.dirtyTools);
      const newOriginal = new Map(state.originalContent);

      // Store original content on first edit
      if (!newOriginal.has(toolId)) {
        const tool = state.tools.find((t) => t.id === toolId);
        if (tool) {
          newOriginal.set(toolId, tool.content);
        }
      }

      newDirty.add(toolId);
      return {
        tools: state.tools.map((t) =>
          t.id === toolId ? { ...t, content } : t
        ),
        selectedTool:
          state.selectedTool?.id === toolId
            ? { ...state.selectedTool, content }
            : state.selectedTool,
        dirtyTools: newDirty,
        originalContent: newOriginal,
      };
    });
  },

  saveTool: async (toolId) => {
    const tool = get().tools.find((t) => t.id === toolId);
    if (!tool || !tool.isEditable) return;

    try {
      await api.saveTool(tool.path, tool.content);
      get().clearDirty(toolId);
    } catch (error) {
      console.error('Failed to save tool:', error);
      set({ error: String(error) });
    }
  },

  setTypeFilters: (types) => {
    set({ typeFilters: types });
    const { tools, scopeFilters, projectFilter, searchQuery } = get();
    set({ filteredTools: applyFilters(tools, types, scopeFilters, projectFilter, searchQuery) });
  },

  toggleTypeFilter: (type) => {
    const { typeFilters } = get();
    const newFilters = typeFilters.includes(type)
      ? typeFilters.filter((t) => t !== type)
      : [...typeFilters, type];
    get().setTypeFilters(newFilters);
  },

  setScopeFilters: (scopes) => {
    set({ scopeFilters: scopes });
    const { tools, typeFilters, projectFilter, searchQuery } = get();
    set({ filteredTools: applyFilters(tools, typeFilters, scopes, projectFilter, searchQuery) });
  },

  toggleScopeFilter: (scope) => {
    const { scopeFilters } = get();
    const newFilters = scopeFilters.includes(scope)
      ? scopeFilters.filter((s) => s !== scope)
      : [...scopeFilters, scope];
    get().setScopeFilters(newFilters);
  },

  setProjectFilter: (project) => {
    set({ projectFilter: project });
    const { tools, typeFilters, scopeFilters, searchQuery } = get();
    set({ filteredTools: applyFilters(tools, typeFilters, scopeFilters, project, searchQuery) });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    const { tools, typeFilters, scopeFilters, projectFilter } = get();
    set({ filteredTools: applyFilters(tools, typeFilters, scopeFilters, projectFilter, query) });
  },

  clearDirty: (toolId) => {
    set((state) => {
      const newDirty = new Set(state.dirtyTools);
      const newOriginal = new Map(state.originalContent);
      newDirty.delete(toolId);
      newOriginal.delete(toolId);
      return { dirtyTools: newDirty, originalContent: newOriginal };
    });
  },

  discardChanges: (toolId) => {
    const original = get().originalContent.get(toolId);
    if (!original) return;

    set((state) => {
      const newDirty = new Set(state.dirtyTools);
      const newOriginal = new Map(state.originalContent);
      newDirty.delete(toolId);
      newOriginal.delete(toolId);

      return {
        tools: state.tools.map((t) =>
          t.id === toolId ? { ...t, content: original } : t
        ),
        selectedTool:
          state.selectedTool?.id === toolId
            ? { ...state.selectedTool, content: original }
            : state.selectedTool,
        dirtyTools: newDirty,
        originalContent: newOriginal,
      };
    });
  },
}));
