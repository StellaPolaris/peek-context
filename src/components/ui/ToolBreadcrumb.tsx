import { Globe, FolderGit2, Terminal, Bot, Sparkles, Webhook, ChevronRight } from 'lucide-react';
import type { Tool, ToolType } from '../../types/rust-bindings';
import { PluginBadge } from './PluginBadge';

interface ToolBreadcrumbProps {
  tool: Tool;
}

const typeIcons: Record<ToolType, React.ReactNode> = {
  command: <Terminal className="w-3 h-3 text-blue-500" />,
  agent: <Bot className="w-3 h-3 text-violet-500" />,
  skill: <Sparkles className="w-3 h-3 text-emerald-500" />,
  hook: <Webhook className="w-3 h-3 text-amber-500" />,
};

const typeFolders: Record<ToolType, string> = {
  command: 'commands',
  agent: 'agents',
  skill: 'skills',
  hook: 'hooks',
};

export function ToolBreadcrumb({ tool }: ToolBreadcrumbProps) {
  const filename = tool.path.split('/').pop() || tool.name;

  const renderScopeSegment = () => {
    switch (tool.scope) {
      case 'global':
        return (
          <>
            <Globe className="w-3 h-3 text-purple-500" />
            <span>Global</span>
            {tool.pluginName && (
              <>
                <ChevronRight className="w-3 h-3" />
                <PluginBadge name={tool.pluginName} size="xs" />
              </>
            )}
          </>
        );
      case 'project':
        {
          const projectName = tool.projectRoot?.split('/').pop() || 'Project';
          return (
            <>
              <FolderGit2 className="w-3 h-3 text-teal-500" />
              <span>Project: {projectName}</span>
              {tool.pluginName && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <PluginBadge name={tool.pluginName} size="xs" />
                </>
              )}
            </>
          );
        }
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
      {renderScopeSegment()}
      <ChevronRight className="w-3 h-3" />
      {typeIcons[tool.toolType]}
      <span>{typeFolders[tool.toolType]}</span>
      <ChevronRight className="w-3 h-3" />
      <span className="text-gray-700 font-medium">{filename}</span>
    </div>
  );
}
