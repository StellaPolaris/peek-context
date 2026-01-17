import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToolsStore } from '../features/tools/stores/toolsStore';
import { useSettingsStore } from '../features/settings/stores/settingsStore';
import {
  Check,
  Terminal,
  Bot,
  Sparkles,
  Webhook,
  Globe,
  FolderGit2,
  Grid3x3,
} from 'lucide-react';
import type { ToolType } from '../types/rust-bindings';

const getToolIcon = (type: ToolType) => {
  switch (type) {
    case 'command':
      return <Terminal className="w-3.5 h-3.5 text-blue-500" />;
    case 'agent':
      return <Bot className="w-3.5 h-3.5 text-violet-500" />;
    case 'skill':
      return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
    case 'hook':
      return <Webhook className="w-3.5 h-3.5 text-amber-500" />;
  }
};

const getTypeRowColor = (type: ToolType) => {
  switch (type) {
    case 'command':
      return 'hover:bg-blue-50';
    case 'agent':
      return 'hover:bg-violet-50';
    case 'skill':
      return 'hover:bg-emerald-50';
    case 'hook':
      return 'hover:bg-amber-50';
  }
};

interface ToolRow {
  name: string;
  toolType: ToolType;
  inGlobal: boolean;
  projects: Map<string, boolean>;
}

export function MatrixView() {
  const { tools, loadTools, setProjectFilter, setScopeFilters, setSearchQuery } = useToolsStore();
  const { settings, loadSettings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTools(settings.projectRoots);
  }, [loadTools, settings.projectRoots]);

  // Build matrix data
  const { rows, projectColumns } = useMemo(() => {
    // Get unique project roots
    const projectRoots = [...new Set(tools.filter((t) => t.projectRoot).map((t) => t.projectRoot!))];
    const projectColumns = projectRoots.map((path) => ({
      path,
      name: path.split('/').pop() || path,
    }));

    // Build rows by unique tool name + type combinations
    const toolMap = new Map<string, ToolRow>();

    for (const tool of tools) {
      const key = `${tool.name}:${tool.toolType}`;

      if (!toolMap.has(key)) {
        toolMap.set(key, {
          name: tool.name,
          toolType: tool.toolType,
          inGlobal: false,
          projects: new Map(projectRoots.map((p) => [p, false])),
        });
      }

      const row = toolMap.get(key)!;

      if (tool.scope === 'global') {
        row.inGlobal = true;
      } else if (tool.projectRoot) {
        row.projects.set(tool.projectRoot, true);
      }
    }

    // Sort rows by type then name
    const rows = Array.from(toolMap.values()).sort((a, b) => {
      const typeOrder = ['command', 'agent', 'skill', 'hook'];
      const typeCompare = typeOrder.indexOf(a.toolType) - typeOrder.indexOf(b.toolType);
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });

    return { rows, projectColumns };
  }, [tools]);

  const handleCellClick = (toolName: string, scope: 'global' | string) => {
    // Navigate to tools view with filters pre-set
    setSearchQuery(toolName);
    if (scope === 'global') {
      setScopeFilters(['global']);
      setProjectFilter('all');
    } else {
      setScopeFilters(['project', 'global']);
      setProjectFilter(scope);
    }
    navigate('/tools');
  };

  // Count totals
  const globalToolCount = rows.filter((r) => r.inGlobal).length;
  const projectToolCounts = projectColumns.map((col) => ({
    ...col,
    count: rows.filter((r) => r.projects.get(col.path)).length,
  }));

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Grid3x3 className="w-7 h-7 text-gray-400" />
          <h1 className="text-2xl font-semibold text-gray-900">Tool Matrix</h1>
        </div>
        <p className="text-gray-600 mb-6">
          See which tools exist in each project. Click a cell to view the tool.
        </p>

        {rows.length === 0 ? (
          <div className="text-center py-12">
            <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tools found</p>
            <p className="text-sm text-gray-400 mt-1">
              Add project roots in Settings to discover tools
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-sand-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sand-50 border-b border-sand-200">
                    <th className="sticky left-0 bg-sand-50 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px] z-10">
                      Tool Name
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <Globe className="w-4 h-4 text-purple-500" />
                        <span>Global</span>
                        <span className="text-xs text-gray-400 font-normal">({globalToolCount})</span>
                      </div>
                    </th>
                    {projectToolCounts.map((col) => (
                      <th
                        key={col.path}
                        className="px-4 py-3 text-center text-sm font-medium text-gray-700 min-w-[100px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <FolderGit2 className="w-4 h-4 text-teal-500" />
                          <span className="truncate max-w-[80px]" title={col.path}>
                            {col.name}
                          </span>
                          <span className="text-xs text-gray-400 font-normal">({col.count})</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.name}:${row.toolType}`}
                      className={`border-b border-sand-100 ${getTypeRowColor(row.toolType)} ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-sand-50/30'
                      }`}
                    >
                      <td className="sticky left-0 bg-inherit px-4 py-2 z-10">
                        <div className="flex items-center gap-2">
                          {getToolIcon(row.toolType)}
                          <span className="text-sm text-gray-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.inGlobal && (
                          <button
                            onClick={() => handleCellClick(row.name, 'global')}
                            className="inline-flex items-center justify-center w-6 h-6 rounded bg-purple-100 hover:bg-purple-200 transition-colors"
                            title="View in Global"
                          >
                            <Check className="w-4 h-4 text-purple-600" />
                          </button>
                        )}
                      </td>
                      {projectColumns.map((col) => (
                        <td key={col.path} className="px-4 py-2 text-center">
                          {row.projects.get(col.path) && (
                            <button
                              onClick={() => handleCellClick(row.name, col.path)}
                              className="inline-flex items-center justify-center w-6 h-6 rounded bg-teal-100 hover:bg-teal-200 transition-colors"
                              title={`View in ${col.name}`}
                            >
                              <Check className="w-4 h-4 text-teal-600" />
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span>Command</span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-500" />
            <span>Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Skill</span>
          </div>
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-amber-500" />
            <span>Hook</span>
          </div>
        </div>
      </div>
    </div>
  );
}
