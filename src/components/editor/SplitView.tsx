import { useState, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Panel, Group, Separator, useDefaultLayout } from 'react-resizable-panels';
import type { Tool } from '../../types/rust-bindings';
import { Save, Lock, Circle, Calendar, PanelLeft, Columns2, PanelRight, RotateCcw, X } from 'lucide-react';
import { ToolBreadcrumb } from '../ui/ToolBreadcrumb';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useSettingsStore } from '../../features/settings/stores/settingsStore';
import { formatDate } from '../../lib/format';
import { frontmatterHighlight } from './frontmatterHighlight';

interface SplitViewProps {
  tool: Tool;
  isDirty: boolean;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onDiscard?: () => void;
  onClose?: () => void;
}

export function SplitView({ tool, isDirty, onContentChange, onSave, onDiscard, onClose }: SplitViewProps) {
  const [localContent, setLocalContent] = useState(tool.content);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const { viewMode, setViewMode } = useSettingsStore();

  useEffect(() => {
    setLocalContent(tool.content);
  }, [tool.id, tool.content]);

  // Cmd+S handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 's') {
        e.preventDefault();
        if (tool.isEditable && isDirty) {
          onSave();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSave, tool.isEditable, isDirty]);

  const handleChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      if (tool.isEditable) {
        onContentChange(value);
      }
    },
    [onContentChange, tool.isEditable]
  );

  // Persist panel layout
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: 'split-view-editor-preview',
    storage: localStorage,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-200 bg-sand-50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{tool.name}</h2>
            {isDirty && (
              <span className="flex items-center gap-1 text-orange-500 text-sm">
                <Circle className="w-2 h-2 fill-current" />
                Unsaved
              </span>
            )}
            {!tool.isEditable && (
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <Lock className="w-3 h-3" />
                Read-only
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ToolBreadcrumb tool={tool} />
            {tool.lastModified > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {formatDate(tool.lastModified)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-sand-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'editor'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Editor only"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'split'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Editor and Preview"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Preview only"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>

          {tool.isEditable && (
            <div className="flex items-center gap-2">
              {isDirty && onDiscard && (
                <button
                  onClick={() => setShowDiscardDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Discard
                </button>
              )}
              <button
                onClick={onSave}
                disabled={!isDirty}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          )}

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-sand-200 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them? This action cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="warning"
        onConfirm={() => {
          onDiscard?.();
          setShowDiscardDialog(false);
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />

      {/* Content area - renders based on viewMode */}
      {viewMode === 'split' ? (
        <Group orientation="horizontal" className="flex-1" defaultLayout={defaultLayout} onLayoutChange={onLayoutChange}>
          {/* Editor pane */}
          <Panel defaultSize={50} minSize={25}>
            <div className="h-full border-r border-sand-200 overflow-auto">
              <CodeMirror
                value={localContent}
                height="100%"
                extensions={[markdown(), frontmatterHighlight, EditorView.lineWrapping]}
                onChange={handleChange}
                readOnly={!tool.isEditable}
                className="h-full text-[13px]"
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLineGutter: true,
                }}
              />
            </div>
          </Panel>

          <Separator className="w-1.5 bg-sand-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Preview pane */}
          <Panel defaultSize={50} minSize={25}>
            <div className="h-full p-6 overflow-auto bg-white">
              <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {localContent}
                </ReactMarkdown>
              </article>
            </div>
          </Panel>
        </Group>
      ) : viewMode === 'editor' ? (
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={localContent}
            height="100%"
            extensions={[markdown(), frontmatterHighlight, EditorView.lineWrapping]}
            onChange={handleChange}
            readOnly={!tool.isEditable}
            className="h-full text-[13px]"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLineGutter: true,
            }}
          />
        </div>
      ) : (
        <div className="flex-1 p-6 overflow-auto bg-white">
          <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {localContent}
            </ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  );
}
