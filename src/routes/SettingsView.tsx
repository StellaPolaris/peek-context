import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { getVersion } from '@tauri-apps/api/app';
import { useSettingsStore } from '../features/settings/stores/settingsStore';
import { useToolsStore } from '../features/tools/stores/toolsStore';
import { api } from '../lib/tauri';
import { Plus, Trash2, Search, FolderOpen, Home, CheckCircle, Info, Clock, Terminal, Bot, Sparkles, Webhook, AlertCircle } from 'lucide-react';

function formatDateTime(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SettingsView() {
  const { settings, loadSettings, saveSettings, addProjectRoot, removeProjectRoot } = useSettingsStore();
  const { tools } = useToolsStore();
  const [newRoot, setNewRoot] = useState('');
  const [appVersion, setAppVersion] = useState<string>('');

  // Get status for a directory root
  const getDirectoryStatus = (root: string) => {
    const projectTools = tools.filter((t) => t.projectRoot === root);
    return {
      hasCommands: projectTools.some((t) => t.toolType === 'command'),
      hasAgents: projectTools.some((t) => t.toolType === 'agent'),
      hasSkills: projectTools.some((t) => t.toolType === 'skill'),
      hasHooks: projectTools.some((t) => t.toolType === 'hook'),
      totalCount: projectTools.length,
    };
  };
  const [discoveredProjects, setDiscoveredProjects] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [claudeRoot, setClaudeRoot] = useState<string | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<{ type: 'success' | 'none' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
    // Get the global Claude root path
    homeDir().then((home) => {
      setClaudeRoot(`${home}.claude`);
    });
    getVersion()
      .then((version) => setAppVersion(version))
      .catch((error) => {
        console.error('Failed to load app version:', error);
      });
  }, [loadSettings]);

  const handleAddRoot = async () => {
    if (newRoot.trim()) {
      await addProjectRoot(newRoot.trim());
      setNewRoot('');
    }
  };

  const handleBrowseFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Root Directory',
      });
      if (selected && typeof selected === 'string') {
        await addProjectRoot(selected);
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
    }
  };

  const handleDiscoverProjects = async () => {
    setIsDiscovering(true);
    setDiscoveryResult(null);
    try {
      const projects = await api.discoverProjects();
      // Filter out projects that are already in projectRoots
      const newProjects = projects.filter((p) => !settings.projectRoots.includes(p));
      setDiscoveredProjects(newProjects);

      // Save the scan timestamp
      await saveSettings({
        ...settings,
        lastScanTime: Math.floor(Date.now() / 1000),
      });

      if (newProjects.length > 0) {
        setDiscoveryResult({
          type: 'success',
          message: `Found ${newProjects.length} new project${newProjects.length > 1 ? 's' : ''} with .claude directories`,
        });
      } else if (projects.length > 0) {
        setDiscoveryResult({
          type: 'none',
          message: `Scanned common directories. Found ${projects.length} project${projects.length > 1 ? 's' : ''}, but all are already added.`,
        });
      } else {
        setDiscoveryResult({
          type: 'none',
          message: 'Scanned common directories (~/Projects, ~/Developer, ~/Code, etc.). No projects with .claude folders found.',
        });
      }
    } catch (error) {
      console.error('Failed to discover projects:', error);
      setDiscoveryResult({
        type: 'error',
        message: `Discovery failed: ${String(error)}`,
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddDiscovered = async (project: string) => {
    await addProjectRoot(project);
    setDiscoveredProjects((prev) => prev.filter((p) => p !== project));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

        {/* Global Claude Root */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Global Claude Directory</h2>
          <p className="text-sm text-gray-600 mb-4">
            This is the global Claude configuration directory. Plugins and global tools are loaded from here automatically.
          </p>
          <div className="flex items-center gap-3 px-4 py-3 bg-sand-100 rounded-lg border border-sand-200">
            <Home className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-mono text-gray-700">{claudeRoot ?? 'Loading...'}</span>
            <span className="ml-auto text-xs text-gray-500 bg-sand-200 px-2 py-1 rounded">Auto-detected</span>
          </div>
        </section>

        {/* Discover Projects - moved before Project Roots */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Discover Projects</h2>
          <p className="text-sm text-gray-600 mb-4">
            Search common directories for projects containing <code className="bg-sand-200 px-1 rounded">.claude</code> folders.
          </p>

          <button
            onClick={handleDiscoverProjects}
            disabled={isDiscovering}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:cursor-wait ${isDiscovering ? 'btn-loading' : ''}`}
          >
            <Search className={`w-5 h-5 ${isDiscovering ? 'animate-spin' : ''}`} />
            {isDiscovering ? 'Scanning directories...' : 'Discover Projects'}
          </button>

          {/* Last scan timestamp */}
          {settings.lastScanTime && (
            <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-3">
              <Clock className="w-3 h-3" />
              Last scanned: {formatDateTime(settings.lastScanTime)}
            </p>
          )}

          {/* Discovery result feedback */}
          {discoveryResult && (
            <div
              className={`mt-4 flex items-start gap-3 px-4 py-3 rounded-lg border animate-fade-in ${
                discoveryResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : discoveryResult.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {discoveryResult.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{discoveryResult.message}</p>
            </div>
          )}

          {/* Discovered projects */}
          {discoveredProjects.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Found {discoveredProjects.length} project(s):
              </h3>
              <ul className="space-y-2">
                {discoveredProjects.map((project) => (
                  <li
                    key={project}
                    className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-sand-200"
                  >
                    <span className="text-sm font-mono text-gray-700">{project}</span>
                    <button
                      onClick={() => handleAddDiscovered(project)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Project Roots */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Scanned Directories</h2>
          <p className="text-sm text-gray-600 mb-4">
            Directories containing projects with <code className="bg-sand-200 px-1 rounded">.claude</code> folders. Add manually or use discovery above.
          </p>

          {/* Add new root - with browse button */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="/path/to/projects"
              value={newRoot}
              onChange={(e) => setNewRoot(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRoot()}
              className="flex-1 px-3 py-2 rounded-lg border border-sand-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleBrowseFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sand-200 bg-white text-gray-700 font-medium hover:bg-sand-100 transition-colors"
              title="Browse for folder"
            >
              <FolderOpen className="w-4 h-4" />
              Browse
            </button>
            <button
              onClick={handleAddRoot}
              disabled={!newRoot.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Current roots */}
          {settings.projectRoots.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {settings.projectRoots.map((root) => {
                const status = getDirectoryStatus(root);
                return (
                  <li
                    key={root}
                    className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-sand-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-mono text-gray-700 truncate">{root}</span>
                      </div>
                      {/* Tool type indicators */}
                      <div className="flex items-center gap-1.5 mt-2 ml-8">
                        {status.totalCount > 0 ? (
                          <>
                            {status.hasCommands && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded">
                                <Terminal className="w-2.5 h-2.5" />
                                cmd
                              </span>
                            )}
                            {status.hasAgents && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-violet-50 text-violet-600 rounded">
                                <Bot className="w-2.5 h-2.5" />
                                agent
                              </span>
                            )}
                            {status.hasSkills && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 rounded">
                                <Sparkles className="w-2.5 h-2.5" />
                                skill
                              </span>
                            )}
                            {status.hasHooks && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-600 rounded">
                                <Webhook className="w-2.5 h-2.5" />
                                hook
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 italic">
                            <AlertCircle className="w-3 h-3" />
                            No tools found
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeProjectRoot(root)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0 ml-2"
                      title="Remove project root"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic mb-4">
              No directories configured. Use discovery above or add one manually.
            </p>
          )}
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
          <div className="bg-white rounded-lg border border-sand-200 p-4">
            <p className="text-sm text-gray-600">
              <strong>Claude Tools Viewer</strong> helps you discover, browse, and edit
              your Claude Code custom tools.
            </p>
            <p className="text-sm text-gray-500 mt-2">Version {appVersion || '—'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
