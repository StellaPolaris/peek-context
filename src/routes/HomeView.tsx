import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Panel, Group, Separator, useDefaultLayout } from 'react-resizable-panels';
import { useToolsStore } from '../features/tools/stores/toolsStore';
import { useSettingsStore } from '../features/settings/stores/settingsStore';
import { SplitView } from '../components/editor/SplitView';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ContextBar } from '../components/ui/ContextBar';
import { ToolMeta } from '../components/tools/ToolMeta';
import { aggregateContextByScope, formatCharCount } from '../lib/format';
import {
  Globe,
  FolderGit2,
  FolderOpen,
  Terminal,
  Bot,
  Sparkles,
  Webhook,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { Tool, ToolType } from '../types/rust-bindings';

interface ToolTypeCount {
  commands: number;
  agents: number;
  skills: number;
  hooks: number;
}

const getToolIcon = (type: string, className = 'w-4 h-4') => {
  switch (type) {
    case 'command':
      return <Terminal className={`${className} text-blue-500`} />;
    case 'agent':
      return <Bot className={`${className} text-violet-500`} />;
    case 'skill':
      return <Sparkles className={`${className} text-emerald-500`} />;
    case 'hook':
      return <Webhook className={`${className} text-amber-500`} />;
    default:
      return null;
  }
};

const formatDateTime = (timestamp?: number): string => {
  if (!timestamp) return 'Not scanned yet';
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  tools: Tool[];
  counts: ToolTypeCount;
  contextChars: number;
  defaultExpanded?: boolean;
  badge?: string;
  onToolClick?: (tool: Tool) => void;
  selectedToolId?: string | null;
}

function ExpandableSection({
  title,
  icon,
  iconColor,
  tools,
  counts,
  contextChars,
  defaultExpanded = false,
  badge,
  onToolClick,
  selectedToolId,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const totalTools = counts.commands + counts.agents + counts.skills + counts.hooks;

  return (
    <div className="bg-white rounded-lg border border-sand-200 overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-sand-50 transition-colors cursor-pointer text-left"
      >
        <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {badge && (
              <span className="text-xs bg-sand-200 text-gray-600 px-2 py-0.5 rounded">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>{totalTools} tool{totalTools !== 1 ? 's' : ''}</span>
            <span className="text-gray-300">|</span>
            {counts.commands > 0 && (
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-blue-500" />
                {counts.commands}
              </span>
            )}
            {counts.agents > 0 && (
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3 text-violet-500" />
                {counts.agents}
              </span>
            )}
            {counts.skills > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                {counts.skills}
              </span>
            )}
            {counts.hooks > 0 && (
              <span className="flex items-center gap-1">
                <Webhook className="w-3 h-3 text-amber-500" />
                {counts.hooks}
              </span>
            )}
            {contextChars > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">context {formatCharCount(contextChars)}</span>
              </>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded content - tool list */}
      {isExpanded && tools.length > 0 && (
        <div className="border-t border-sand-200 bg-sand-50 px-5 py-3 expandable-content">
          <div className="grid gap-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => onToolClick?.(tool)}
                className={`flex items-start gap-3 px-3 py-2 bg-white rounded-lg border transition-colors ${
                  onToolClick ? 'cursor-pointer hover:bg-sand-50 hover:border-sand-300' : ''
                } ${
                  selectedToolId === tool.id
                    ? 'border-teal-500 ring-2 ring-teal-200'
                    : 'border-sand-200'
                }`}
              >
                {getToolIcon(tool.toolType)}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 truncate block">{tool.name}</span>
                  {tool.frontmatter.description && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {tool.frontmatter.description}
                    </p>
                  )}
                  <ToolMeta tool={tool} className="mt-1" size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isExpanded && tools.length === 0 && (
        <div className="border-t border-sand-200 bg-sand-50 px-5 py-6 text-center expandable-content">
          <p className="text-sm text-gray-400 italic">No tools in this section</p>
        </div>
      )}
    </div>
  );
}

export function HomeView() {
  const { tools, loadTools, dirtyTools, updateToolContent, saveTool, discardChanges } = useToolsStore();
  const { settings, loadSettings } = useSettingsStore();
  const navigate = useNavigate();

  // Selected tool for SplitView
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [pendingTool, setPendingTool] = useState<Tool | null>(null);
  const [showNavWarning, setShowNavWarning] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTools(settings.projectRoots);
  }, [loadTools, settings.projectRoots]);

  // Handle tool selection with dirty check
  const handleToolClick = useCallback((tool: Tool) => {
    if (selectedTool && dirtyTools.has(selectedTool.id)) {
      setPendingTool(tool);
      setShowNavWarning(true);
    } else {
      setSelectedTool(tool);
    }
  }, [selectedTool, dirtyTools]);

  const handleCloseTool = useCallback(() => {
    if (selectedTool && dirtyTools.has(selectedTool.id)) {
      setPendingTool(null);
      setShowNavWarning(true);
    } else {
      setSelectedTool(null);
    }
  }, [selectedTool, dirtyTools]);

  const handleConfirmNavigation = useCallback(() => {
    if (selectedTool) {
      discardChanges(selectedTool.id);
    }
    if (pendingTool) {
      setSelectedTool(pendingTool);
    } else {
      setSelectedTool(null);
    }
    setShowNavWarning(false);
    setPendingTool(null);
  }, [selectedTool, pendingTool, discardChanges]);

  const handleCancelNavigation = useCallback(() => {
    setShowNavWarning(false);
    setPendingTool(null);
  }, []);

  const handleContentChange = useCallback((content: string) => {
    if (selectedTool) {
      updateToolContent(selectedTool.id, content);
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
    }
  }, [selectedTool, discardChanges]);

  // Navigate to tools view with type filter
  const handleTypeClick = useCallback((type: ToolType) => {
    navigate(`/tools?type=${type}`);
  }, [navigate]);

  // Count tools by scope
  const globalTools = tools.filter((t) => t.scope === 'global');
  const projectTools = tools.filter((t) => t.scope === 'project');

  // Get unique projects
  const projectRoots = [...new Set(projectTools.map((t) => t.projectRoot!))];

  const lastScanTime = settings.lastScanTime;
  const newToolsSinceScan =
    lastScanTime !== undefined
      ? tools.filter((t) => t.lastModified > lastScanTime).length
      : null;

  // Count by type
  const countByType = (toolList: typeof tools): ToolTypeCount => ({
    commands: toolList.filter((t) => t.toolType === 'command').length,
    agents: toolList.filter((t) => t.toolType === 'agent').length,
    skills: toolList.filter((t) => t.toolType === 'skill').length,
    hooks: toolList.filter((t) => t.toolType === 'hook').length,
  });

  const globalCounts = countByType(globalTools);

  // Calculate context character totals
  const contextByScope = useMemo(() => aggregateContextByScope(tools), [tools]);

  // Persist panel layout
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'home-view-panels',
    storage: localStorage,
  });

  // Update selected tool from store when content changes
  useEffect(() => {
    if (selectedTool) {
      const updated = tools.find(t => t.id === selectedTool.id);
      if (updated && updated.content !== selectedTool.content) {
        setSelectedTool(updated);
      }
    }
  }, [tools, selectedTool]);

  const hasProjects = settings.projectRoots.length > 0;

  return (
    <Group orientation="horizontal" className="h-full" defaultLayout={defaultLayout} onLayoutChange={onLayoutChange}>
      {/* Main content panel */}
      <Panel defaultSize={selectedTool ? 50 : 100} minSize={30}>
        <div className="h-full overflow-auto">
          <div className="px-6 py-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Home</h1>
            <p className="text-gray-600 mb-6">
              Your tool landscape at a glance. Expand a section to browse what is available.
            </p>

            {/* Welcome screen - shown when no projects configured */}
            {!hasProjects && (
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200 p-6 mb-8">
                <div className="flex items-start gap-4">
                  <FolderOpen className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Welcome to Claude Tools Viewer
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Get started by adding a project directory. This will scan for Claude Code
                      tools (commands, agents, skills, hooks) in your projects.
                    </p>
                    <Link
                      to="/settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Project Directory
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Discovery status */}
            <div className="bg-white rounded-lg border border-sand-200 p-5 mb-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-medium text-gray-700">Discovery status</h2>
                </div>
                <div className="text-xs text-gray-500">Last scan: {formatDateTime(lastScanTime)}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3 rounded-lg border border-sand-200 bg-sand-50 px-4 py-3">
                  <FolderOpen className="w-4 h-4 text-teal-500" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">Project roots</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {settings.projectRoots.length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-sand-200 bg-sand-50 px-4 py-3">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">New tools</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {newToolsSinceScan === null ? '--' : newToolsSinceScan}
                    </div>
                    <div className="text-xs text-gray-500">
                      {newToolsSinceScan === null
                        ? 'Run discovery in Settings to enable'
                        : 'Updated since last scan'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe className="w-4 h-4 text-amber-500" />
                  Global tools
                </div>
                <div className="text-2xl font-semibold text-gray-900 mt-2">{globalTools.length}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {contextByScope.global > 0 ? `context ${formatCharCount(contextByScope.global)}` : 'Shared across projects'}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FolderGit2 className="w-4 h-4 text-violet-500" />
                  Project tools
                </div>
                <div className="text-2xl font-semibold text-gray-900 mt-2">{projectTools.length}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {contextByScope.project > 0 ? `context ${formatCharCount(contextByScope.project)}` : 'Local to a project'}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-sand-200 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FolderOpen className="w-4 h-4 text-teal-500" />
                  Total context
                </div>
                <div className="text-2xl font-semibold text-gray-900 mt-2">
                  {formatCharCount(contextByScope.total)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Characters in context</div>
              </div>
            </div>

            {/* Context bar visualization */}
            {contextByScope.total > 0 && (
              <div className="bg-white rounded-lg border border-sand-200 p-4 mb-8">
                <div className="text-sm text-gray-500 mb-2">Context distribution by scope</div>
                <ContextBar context={contextByScope} />
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    Global
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-violet-400 rounded-full" />
                    Project
                  </span>
                </div>
              </div>
            )}

            {/* Summary stats - clickable to filter */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div
                onClick={() => handleTypeClick('command')}
                className="bg-white rounded-lg border border-sand-200 p-4 text-center cursor-pointer hover:border-blue-300 hover:ring-2 hover:ring-blue-100 transition-all"
              >
                <div className="text-3xl font-bold text-blue-500">
                  {tools.filter((t) => t.toolType === 'command').length}
                </div>
                <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                  <Terminal className="w-4 h-4" /> Commands
                </div>
              </div>
              <div
                onClick={() => handleTypeClick('agent')}
                className="bg-white rounded-lg border border-sand-200 p-4 text-center cursor-pointer hover:border-violet-300 hover:ring-2 hover:ring-violet-100 transition-all"
              >
                <div className="text-3xl font-bold text-violet-500">
                  {tools.filter((t) => t.toolType === 'agent').length}
                </div>
                <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                  <Bot className="w-4 h-4" /> Agents
                </div>
              </div>
              <div
                onClick={() => handleTypeClick('skill')}
                className="bg-white rounded-lg border border-sand-200 p-4 text-center cursor-pointer hover:border-emerald-300 hover:ring-2 hover:ring-emerald-100 transition-all"
              >
                <div className="text-3xl font-bold text-emerald-500">
                  {tools.filter((t) => t.toolType === 'skill').length}
                </div>
                <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                  <Sparkles className="w-4 h-4" /> Skills
                </div>
              </div>
              <div
                onClick={() => handleTypeClick('hook')}
                className="bg-white rounded-lg border border-sand-200 p-4 text-center cursor-pointer hover:border-amber-300 hover:ring-2 hover:ring-amber-100 transition-all"
              >
                <div className="text-3xl font-bold text-amber-500">
                  {tools.filter((t) => t.toolType === 'hook').length}
                </div>
                <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                  <Webhook className="w-4 h-4" /> Hooks
                </div>
              </div>
            </div>

            {/* Hierarchical expandable sections */}
            <div className="space-y-4">
              {/* Global section */}
              <ExpandableSection
                title="Global"
                icon={<Globe className="w-5 h-5 text-amber-600" />}
                iconColor="bg-amber-100"
                tools={globalTools}
                counts={globalCounts}
                contextChars={contextByScope.global}
                badge="~/.claude"
                onToolClick={handleToolClick}
                selectedToolId={selectedTool?.id}
              />

              {/* Projects section - one for each project */}
              {projectRoots.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1 pt-4">
                    Projects ({projectRoots.length})
                  </h3>
                  {projectRoots.map((root) => {
                    const projectName = root.split('/').pop() || root;
                    const thisProjectTools = projectTools.filter((t) => t.projectRoot === root);
                    const projectCounts = countByType(thisProjectTools);
                    const projectContextChars = thisProjectTools.reduce((sum, t) => sum + t.contextCharacters, 0);

                    return (
                      <ExpandableSection
                        key={root}
                        title={projectName}
                        icon={<FolderGit2 className="w-5 h-5 text-violet-600" />}
                        iconColor="bg-violet-100"
                        tools={thisProjectTools}
                        counts={projectCounts}
                        contextChars={projectContextChars}
                        badge={`${thisProjectTools.length} project tool${thisProjectTools.length !== 1 ? 's' : ''}`}
                        onToolClick={handleToolClick}
                        selectedToolId={selectedTool?.id}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-sand-200 p-6 text-center">
                  <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No project tools found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add project roots in Settings to discover project-specific tools
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>

      {/* SplitView panel - shown when a tool is selected */}
      {selectedTool && (
        <>
          <Separator className="w-1.5 bg-sand-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize" />
          <Panel minSize={30}>
            <div className="h-full border-l border-sand-200 flex flex-col">
              <SplitView
                tool={selectedTool}
                isDirty={dirtyTools.has(selectedTool.id)}
                onContentChange={handleContentChange}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onClose={handleCloseTool}
              />
            </div>
          </Panel>
        </>
      )}

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
