import { Badge } from '../ui/Badge';
import { ToolMeta } from './ToolMeta';
import type { Tool, ToolType, ToolScope } from '../../types/rust-bindings';
import { Terminal, Bot, Sparkles, Webhook, Globe, FolderGit2 } from 'lucide-react';

interface EffectiveToolRowProps {
  tool: Tool;
  onClick?: () => void;
  isSelected?: boolean;
}

const typeIcons: Record<ToolType, React.ReactNode> = {
  command: <Terminal className="w-4 h-4 text-blue-500" />,
  agent: <Bot className="w-4 h-4 text-violet-500" />,
  skill: <Sparkles className="w-4 h-4 text-emerald-500" />,
  hook: <Webhook className="w-4 h-4 text-amber-500" />,
};

const scopeIcons: Record<ToolScope, React.ReactNode> = {
  global: <Globe className="w-3 h-3" />,
  project: <FolderGit2 className="w-3 h-3" />,
};

const scopeLabels: Record<ToolScope, string> = {
  global: 'Global',
  project: 'Project',
};

export function EffectiveToolRow({ tool, onClick, isSelected }: EffectiveToolRowProps) {
  const description = tool.frontmatter.description || '';

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-3 py-2.5 bg-white rounded-lg border transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-200'
          : 'border-sand-200 hover:bg-sand-50 hover:border-sand-300'
      }`}
    >
      {/* Type icon */}
      <div className="flex-shrink-0 mt-0.5">
        {typeIcons[tool.toolType]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{tool.name}</span>
          <Badge variant={tool.scope} className="flex items-center text-[10px]">
            {scopeIcons[tool.scope]}
            <span className="ml-1">{scopeLabels[tool.scope]}</span>
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{description}</p>
        )}
        <ToolMeta tool={tool} className="mt-1" size="xs" />
      </div>
    </div>
  );
}
