// Types matching Rust structs from src-tauri/src/models/mod.rs

export type ToolType = 'command' | 'agent' | 'skill' | 'hook';
export type ToolScope = 'global' | 'project';

export interface ToolFrontmatter {
  name?: string;
  description?: string;
  argumentHint?: string;
  allowedTools?: string[];
  tools?: string;
  model?: string;
  color?: string;
  version?: string;
}

export interface Tool {
  id: string;
  name: string;
  toolType: ToolType;
  scope: ToolScope;
  path: string;
  projectRoot?: string;
  pluginName?: string;
  marketplace?: string;
  frontmatter: ToolFrontmatter;
  content: string;
  lastModified: number;
  isEditable: boolean;
  contextCharacters: number;
}

export interface ToolCounts {
  commands: number;
  agents: number;
  skills: number;
  hooks: number;
}

export interface Project {
  path: string;
  name: string;
  toolCount: ToolCounts;
}

export interface Plugin {
  name: string;
  description?: string;
  marketplace: string;
  path: string;
  toolCount: ToolCounts;
}

export interface AppSettings {
  projectRoots: string[];
  lastScanTime?: number;
}

// Plugin enabled status tracking
export type PluginEnabledScope = 'user' | 'project' | 'local';

export interface EnabledPluginInfo {
  pluginId: string;
  pluginName: string;
  marketplace: string;
  scope: PluginEnabledScope;
}

export interface ProjectEnabledPlugins {
  projectPath: string;
  enabledPlugins: EnabledPluginInfo[];
}

export interface EnabledPluginsResponse {
  userEnabled: EnabledPluginInfo[];
  projectEnabled: ProjectEnabledPlugins[];
  availablePlugins: string[];
}
