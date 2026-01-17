import { Search, Terminal, Bot, Sparkles, Webhook, FolderGit2, Globe } from 'lucide-react';
import { useToolsStore } from '../../features/tools/stores/toolsStore';
import type { ToolType, ToolScope } from '../../types/rust-bindings';

const typeOptions: { value: ToolType; label: string; icon: typeof Terminal; color: string }[] = [
  { value: 'command', label: 'Commands', icon: Terminal, color: 'text-blue-500' },
  { value: 'agent', label: 'Agents', icon: Bot, color: 'text-violet-500' },
  { value: 'skill', label: 'Skills', icon: Sparkles, color: 'text-emerald-500' },
  { value: 'hook', label: 'Hooks', icon: Webhook, color: 'text-amber-500' },
];

const scopeOptions: { value: ToolScope; label: string; icon: typeof Globe }[] = [
  { value: 'project', label: 'Project', icon: FolderGit2 },
  { value: 'global', label: 'Global', icon: Globe },
];

export function ToolFilters() {
  const {
    typeFilters,
    scopeFilters,
    projectFilter,
    searchQuery,
    toggleTypeFilter,
    toggleScopeFilter,
    setProjectFilter,
    setSearchQuery,
    tools,
  } = useToolsStore();

  // Get unique projects
  const projects = [...new Set(tools.filter(t => t.projectRoot).map(t => t.projectRoot))];

  return (
    <div className="space-y-4 mb-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-sand-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Type and Scope filters row */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Type checkboxes */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Types</span>
          <div className="flex flex-wrap gap-3">
            {typeOptions.map(({ value, label, icon: Icon, color }) => (
              <label
                key={value}
                className="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={typeFilters.includes(value)}
                  onChange={() => toggleTypeFilter(value)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Scope checkboxes */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scopes</span>
          <div className="flex flex-wrap gap-3">
            {scopeOptions.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className="flex items-center gap-1.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={scopeFilters.includes(value)}
                  onChange={() => toggleScopeFilter(value)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Project context filter - keep as dropdown */}
        {projects.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project Context</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-sand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p} value={p!}>
                  {p!.split('/').pop()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
