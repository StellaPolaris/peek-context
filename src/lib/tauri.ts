import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Tool, AppSettings, EnabledPluginsResponse } from '../types/rust-bindings';

export const api = {
  // Scanning
  scanAllTools: (projectRoots: string[]) =>
    invoke<Tool[]>('scan_all_tools', { projectRoots }),

  discoverProjects: (roots?: string[]) =>
    invoke<string[]>('discover_projects', { roots }),

  // Tool operations
  readTool: (path: string) =>
    invoke<string>('read_tool', { path }),

  saveTool: (path: string, content: string) =>
    invoke<void>('save_tool', { path, content }),

  // Settings
  getSettings: () =>
    invoke<AppSettings>('get_settings'),

  saveSettings: (settings: AppSettings) =>
    invoke<void>('save_settings', { settings }),

  // Enabled plugins
  getEnabledPlugins: (projectRoots: string[]) =>
    invoke<EnabledPluginsResponse>('get_enabled_plugins', { projectRoots }),
};

// File watcher events
export const onFileChanged = (callback: (paths: string[]) => void): Promise<UnlistenFn> => {
  return listen<string[]>('file-changed', (event) => {
    callback(event.payload);
  });
};
