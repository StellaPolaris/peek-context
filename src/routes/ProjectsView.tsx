import { useEffect, useState, useMemo, useCallback } from 'react';
import { Panel, Group, Separator, useDefaultLayout } from 'react-resizable-panels';
import { useToolsStore } from '../features/tools/stores/toolsStore';
import { useSettingsStore } from '../features/settings/stores/settingsStore';
import {
  FolderGit2,
  Terminal,
  Bot,
  Sparkles,
  Webhook,
  Globe,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';
import type { Tool } from '../types/rust-bindings';
import { EffectiveToolRow } from '../components/tools/EffectiveToolRow';
import { SplitView } from '../components/editor/SplitView';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ContextBar } from '../components/ui/ContextBar';
import { formatCharCount, type ContextByScope } from '../lib/format';

interface ProjectSummary {
  path: string;
  name: string;
  // Project-specific tool counts
  commands: number;
  agents: number;
  skills: number;
  hooks: number;
  // Effective counts (inherited + local)
  effectiveTotal: number;
  localCount: number;
  globalCount: number;
  // Context character counts
  context: ContextByScope;
}

interface TypeSectionProps {
  label: string;
  sectionKey: string; // 'commands' | 'agents' | 'skills' | 'hooks'
  icon: React.ReactNode;
  tools: Tool[];
  selectedToolId: string | null;
  onToolClick: (tool: Tool) => void;
}

function TypeSection({ label, sectionKey, icon, tools, selectedToolId, onToolClick }: TypeSectionProps) {
  const { typeSectionStates, setTypeSectionState } = useSettingsStore();
  const isExpanded = typeSectionStates[sectionKey] ?? true;

  if (tools.length === 0) return null;

  return (
    <div className={`border-b border-sand-200 last:border-b-0 ${isExpanded ? 'bg-sand-100/50' : ''}`}>
      <button
        onClick={() => setTypeSectionState(sectionKey, !isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-sand-100 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        {icon}
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-400">({tools.length})</span>
      </button>

      {isExpanded && (
        <div className="px-2 pb-3 space-y-1.5">
          {tools.map((tool) => (
            <EffectiveToolRow
              key={tool.id}
              tool={tool}
              onClick={() => onToolClick(tool)}
              isSelected={selectedToolId === tool.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsView() {
  const { tools, loadTools, dirtyTools, updateToolContent, saveTool, discardChanges } = useToolsStore();
  const { settings, loadSettings } = useSettingsStore();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation guard state
  const [pendingTool, setPendingTool] = useState<Tool | null>(null);
  const [pendingClose, setPendingClose] = useState(false);
  const [showNavWarning, setShowNavWarning] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTools(settings.projectRoots);
  }, [loadTools, settings.projectRoots]);

  // Beforeunload handler for app close protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyTools.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyTools.size]);

  // Global tools (same for all projects)
  const globalTools = useMemo(() => tools.filter((t) => t.scope === 'global'), [tools]);
  const globalCount = globalTools.length;

  // Aggregate tools by project
  const projectSummaries: ProjectSummary[] = useMemo(() => {
    const summaries: ProjectSummary[] = [];
    const projectRoots = [...new Set(tools.filter((t) => t.projectRoot).map((t) => t.projectRoot!))];

    for (const root of projectRoots) {
      const projectTools = tools.filter((t) => t.projectRoot === root);
      const localCount = projectTools.length;

      // Calculate context characters by scope
      const globalContext = globalTools.reduce((sum, t) => sum + t.contextCharacters, 0);
      const projectContext = projectTools.reduce((sum, t) => sum + t.contextCharacters, 0);

      summaries.push({
        path: root,
        name: root.split('/').pop() || root,
        commands: projectTools.filter((t) => t.toolType === 'command').length,
        agents: projectTools.filter((t) => t.toolType === 'agent').length,
        skills: projectTools.filter((t) => t.toolType === 'skill').length,
        hooks: projectTools.filter((t) => t.toolType === 'hook').length,
        effectiveTotal: localCount + globalCount,
        localCount,
        globalCount,
        context: {
          global: globalContext,
          project: projectContext,
          total: globalContext + projectContext,
        },
      });
    }

    return summaries;
  }, [tools, globalCount, globalTools]);

  // Get effective tools for expanded project (global + project-specific)
  const getEffectiveToolsForProject = useCallback((projectPath: string): Tool[] => {
    const projectSpecificTools = tools.filter((t) => t.projectRoot === projectPath);
    return [...globalTools, ...projectSpecificTools];
  }, [tools, globalTools]);

  // Get filtered effective tools for expanded project
  const filteredEffectiveTools = useMemo(() => {
    if (!expandedProject) return [];
    const effectiveTools = getEffectiveToolsForProject(expandedProject);
    if (!searchQuery.trim()) return effectiveTools;
    const query = searchQuery.toLowerCase();
    return effectiveTools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.frontmatter.description?.toLowerCase().includes(query) ?? false)
    );
  }, [expandedProject, getEffectiveToolsForProject, searchQuery]);

  // Group filtered tools by type
  const toolsByType = useMemo(() => ({
    command: filteredEffectiveTools.filter((t) => t.toolType === 'command'),
    agent: filteredEffectiveTools.filter((t) => t.toolType === 'agent'),
    skill: filteredEffectiveTools.filter((t) => t.toolType === 'skill'),
    hook: filteredEffectiveTools.filter((t) => t.toolType === 'hook'),
  }), [filteredEffectiveTools]);

  const handleToggleProject = (path: string) => {
    if (expandedProject === path) {
      setExpandedProject(null);
      setSelectedTool(null);
      setSearchQuery('');
    } else {
      setExpandedProject(path);
      setSelectedTool(null);
      setSearchQuery('');
    }
  };

  const handleToolClick = useCallback((tool: Tool) => {
    // Check if there are unsaved changes on current tool
    if (selectedTool && dirtyTools.has(selectedTool.id)) {
      setPendingTool(tool);
      setPendingClose(false);
      setShowNavWarning(true);
    } else {
      setSelectedTool(tool);
    }
  }, [selectedTool, dirtyTools]);

  const handleCloseEditor = useCallback(() => {
    // Check if there are unsaved changes
    if (selectedTool && dirtyTools.has(selectedTool.id)) {
      setPendingTool(null);
      setPendingClose(true);
      setShowNavWarning(true);
    } else {
      setSelectedTool(null);
    }
  }, [selectedTool, dirtyTools]);

  const handleConfirmNavigation = useCallback(() => {
    if (selectedTool) {
      discardChanges(selectedTool.id);
    }
    if (pendingClose) {
      setSelectedTool(null);
    } else if (pendingTool) {
      setSelectedTool(pendingTool);
    }
    setShowNavWarning(false);
    setPendingTool(null);
    setPendingClose(false);
  }, [selectedTool, pendingTool, pendingClose, discardChanges]);

  const handleCancelNavigation = useCallback(() => {
    setShowNavWarning(false);
    setPendingTool(null);
    setPendingClose(false);
  }, []);

  const handleContentChange = useCallback((content: string) => {
    if (selectedTool) {
      updateToolContent(selectedTool.id, content);
      // Update local selected tool state to reflect changes
      setSelectedTool(prev => prev ? { ...prev, content } : null);
    }
  }, [selectedTool, updateToolContent]);

  const handleSave = useCallback(() => {
    if (selectedTool) {
      saveTool(selectedTool.id);
    }
  }, [selectedTool, saveTool]);

  const handleDiscard = useCallback(() => {
    if (selectedTool) {
      discardChanges(selectedTool.id);
      // Reload the original content from the store
      const originalTool = tools.find(t => t.id === selectedTool.id);
      if (originalTool) {
        setSelectedTool(originalTool);
      }
    }
  }, [selectedTool, discardChanges, tools]);

  // Persist panel layout
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'projects-view-panels-v2',
    storage: localStorage,
  });

  const isDirty = selectedTool ? dirtyTools.has(selectedTool.id) : false;

  return (
    <Group orientation="horizontal" className="h-full" defaultLayout={defaultLayout} onLayoutChange={onLayoutChange}>
      {/* Projects list panel */}
      <Panel defaultSize={40} minSize={20}>
        <div className="h-full overflow-auto" style={{ minWidth: '280px' }}>
          <div className="px-6 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600 mb-6">
              Projects with custom tools. Click to expand and see available tools.
            </p>

            {projectSummaries.length === 0 ? (
              <div className="text-center py-12">
                <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No projects with custom tools found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add project roots in Settings to discover projects
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {projectSummaries.map((project) => {
                  const isExpanded = expandedProject === project.path;
                  const projectEffectiveTools = isExpanded ? filteredEffectiveTools : [];
                  const totalEffective = isExpanded ? getEffectiveToolsForProject(project.path).length : project.effectiveTotal;

                  return (
                    <div
                      key={project.path}
                      className={`bg-white rounded-lg border overflow-hidden transition-all ${
                        isExpanded
                          ? 'border-teal-500 ring-2 ring-teal-200'
                          : 'border-sand-200'
                      }`}
                    >
                      {/* Project card header - clickable */}
                      <div
                        onClick={() => handleToggleProject(project.path)}
                        className="p-5 hover:bg-sand-50 transition-colors cursor-pointer"
                      >
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <FolderGit2 className="w-6 h-6 text-teal-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{project.name}</h3>
                            <p className="text-xs text-gray-500 font-mono truncate">{project.path}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>

                        {/* Effective count - prominent */}
                        <div className="mb-3 pb-3 border-b border-sand-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {project.effectiveTotal} tools
                            </span>
                            {project.context.total > 0 && (
                              <span className="text-xs text-gray-400">
                                context {formatCharCount(project.context.total)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">effective in this project</div>
                          {project.context.total > 0 && (
                            <ContextBar context={project.context} showLabel={false} />
                          )}
                        </div>

                        {/* Type breakdown (local tools only) */}
                        <div className="grid grid-cols-4 gap-1.5 mb-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Terminal className="w-3.5 h-3.5 text-blue-500" />
                            <span>{project.commands} cmd</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Bot className="w-3.5 h-3.5 text-violet-500" />
                            <span>{project.agents} agent</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{project.skills} skill</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Webhook className="w-3.5 h-3.5 text-amber-500" />
                            <span>{project.hooks} hook</span>
                          </div>
                        </div>

                        {/* Scope breakdown */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FolderGit2 className="w-3 h-3 text-violet-500" />
                            {project.localCount} local
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-amber-500" />
                            {project.globalCount} global
                          </span>
                        </div>
                      </div>

                      {/* Expanded accordion content */}
                      {isExpanded && (
                        <div className="border-t border-sand-200 bg-gradient-to-b from-sand-50 to-sand-100/50">
                          {/* Search */}
                          <div className="px-4 py-3 border-b border-sand-200">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search tools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-sand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                              />
                            </div>
                          </div>

                          {/* Tool list grouped by type - no scrollable area */}
                          <div>
                            {projectEffectiveTools.length === 0 ? (
                              <div className="text-center py-8">
                                <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No tools match your search</p>
                              </div>
                            ) : (
                              <>
                                <TypeSection
                                  label="Commands"
                                  sectionKey="commands"
                                  icon={<Terminal className="w-4 h-4 text-blue-500" />}
                                  tools={toolsByType.command}
                                  selectedToolId={selectedTool?.id ?? null}
                                  onToolClick={handleToolClick}
                                />
                                <TypeSection
                                  label="Agents"
                                  sectionKey="agents"
                                  icon={<Bot className="w-4 h-4 text-violet-500" />}
                                  tools={toolsByType.agent}
                                  selectedToolId={selectedTool?.id ?? null}
                                  onToolClick={handleToolClick}
                                />
                                <TypeSection
                                  label="Skills"
                                  sectionKey="skills"
                                  icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
                                  tools={toolsByType.skill}
                                  selectedToolId={selectedTool?.id ?? null}
                                  onToolClick={handleToolClick}
                                />
                                <TypeSection
                                  label="Hooks"
                                  sectionKey="hooks"
                                  icon={<Webhook className="w-4 h-4 text-amber-500" />}
                                  tools={toolsByType.hook}
                                  selectedToolId={selectedTool?.id ?? null}
                                  onToolClick={handleToolClick}
                                />
                              </>
                            )}
                          </div>

                          {/* Summary footer */}
                          <div className="px-4 py-3 border-t border-sand-200 bg-sand-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                Showing {projectEffectiveTools.length} of {totalEffective} tools
                                {project.context.total > 0 && (
                                  <span className="ml-2 text-gray-400">
                                    (context {formatCharCount(project.context.total)})
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="flex items-center gap-1" title={`context ${formatCharCount(project.context.project)}`}>
                                  <FolderGit2 className="w-3 h-3 text-violet-500" />
                                  {project.localCount}
                                </span>
                                <span className="flex items-center gap-1" title={`context ${formatCharCount(project.context.global)}`}>
                                  <Globe className="w-3 h-3 text-amber-500" />
                                  {project.globalCount}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Tool editor panel - always rendered for layout persistence */}
      <Separator className="w-1.5 bg-sand-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize" />

      <Panel defaultSize={60} minSize={30}>
        {selectedTool ? (
          <div className="h-full flex flex-col border-l border-sand-200">
            <SplitView
              tool={selectedTool}
              isDirty={isDirty}
              onContentChange={handleContentChange}
              onSave={handleSave}
              onDiscard={handleDiscard}
              onClose={handleCloseEditor}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border-l border-sand-200 bg-sand-50/50">
            <div className="text-center text-gray-400">
              <p className="text-sm">Select a tool to view or edit</p>
            </div>
          </div>
        )}
      </Panel>

      {/* Navigation warning dialog */}
      <ConfirmDialog
        isOpen={showNavWarning}
        title="Unsaved changes"
        message="You have unsaved changes. Do you want to discard them and continue?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="warning"
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
      />
    </Group>
  );
}
