import { useEffect, useState, useCallback } from 'react';
import { Panel, Group, Separator, useDefaultLayout } from 'react-resizable-panels';
import { useToolsStore } from '../features/tools/stores/toolsStore';
import { useSettingsStore } from '../features/settings/stores/settingsStore';
import { useToolFiltersQueryParams } from '../hooks/useToolFiltersQueryParams';
import { ToolList } from '../components/tools/ToolList';
import { ToolFilters } from '../components/tools/ToolFilters';
import { SplitView } from '../components/editor/SplitView';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { RefreshCw } from 'lucide-react';
import type { Tool } from '../types/rust-bindings';

export function ToolsView() {
  const {
    filteredTools,
    selectedTool,
    dirtyTools,
    isScanning,
    loadTools,
    selectTool,
    updateToolContent,
    saveTool,
    discardChanges,
  } = useToolsStore();

  const { settings, loadSettings } = useSettingsStore();

  // Sync URL query params with filter state (reads on mount)
  useToolFiltersQueryParams();

  // Navigation guard state
  const [pendingTool, setPendingTool] = useState<Tool | null>(null);
  const [showNavWarning, setShowNavWarning] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load tools on mount and set up auto-refresh (60 seconds)
  useEffect(() => {
    loadTools(settings.projectRoots);

    // Auto-refresh every 60 seconds
    const intervalId = setInterval(() => {
      loadTools(settings.projectRoots);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [loadTools, settings.projectRoots]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadTools(settings.projectRoots);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  const handleSelectTool = useCallback((tool: Tool) => {
    // Check if there are unsaved changes on current tool
    if (selectedTool && dirtyTools.has(selectedTool.id)) {
      setPendingTool(tool);
      setShowNavWarning(true);
    } else {
      selectTool(tool);
    }
  }, [selectedTool, dirtyTools, selectTool]);

  const handleCloseTool = useCallback(() => {
    // Check if there are unsaved changes
    if (selectedTool && dirtyTools.has(selectedTool.id)) {
      setPendingTool(null);
      setShowNavWarning(true);
    } else {
      selectTool(null);
    }
  }, [selectedTool, dirtyTools, selectTool]);

  const handleConfirmNavigation = useCallback(() => {
    if (selectedTool) {
      discardChanges(selectedTool.id);
    }
    if (pendingTool) {
      selectTool(pendingTool);
    } else {
      selectTool(null);
    }
    setShowNavWarning(false);
    setPendingTool(null);
  }, [selectedTool, pendingTool, discardChanges, selectTool]);

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

  const handleRefresh = useCallback(() => {
    loadTools(settings.projectRoots);
  }, [loadTools, settings.projectRoots]);

  // Persist panel layout
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'tools-view-panels',
    storage: localStorage,
  });

  return (
    <Group orientation="horizontal" className="h-full" defaultLayout={defaultLayout} onLayoutChange={onLayoutChange}>
      {/* Tools list panel */}
      <Panel defaultSize={33} minSize={20}>
        <div className="flex flex-col h-full overflow-hidden" style={{ minWidth: '250px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200">
            <h1 className="text-xl font-semibold text-gray-900">Tools</h1>
            <button
              onClick={handleRefresh}
              disabled={isScanning}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-sand-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Refresh'}
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 pt-4">
            <ToolFilters />
          </div>

          {/* Tool list */}
          <div className="flex-1 overflow-auto px-6 pb-6">
            <ToolList tools={filteredTools} onSelectTool={handleSelectTool} />
          </div>
        </div>
      </Panel>

      {/* Tool detail panel - always rendered for layout persistence */}
      <Separator className="w-1.5 bg-sand-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize" />

      <Panel defaultSize={67} minSize={30}>
        {selectedTool ? (
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
