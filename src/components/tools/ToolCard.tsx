import { clsx } from 'clsx';
import type { Tool } from '../../types/rust-bindings';
import { TypeBadge } from './TypeBadge';
import { ScopeBadge } from './ScopeBadge';
import { ToolMeta } from './ToolMeta';
import { Circle } from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
  isSelected: boolean;
  isDirty: boolean;
  onClick: () => void;
}

export function ToolCard({ tool, isSelected, isDirty, onClick }: ToolCardProps) {
  const projectName = tool.projectRoot?.split('/').pop();

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-lg border bg-white cursor-pointer transition-all duration-200 card-hover-effect',
        'border-sand-200 hover:border-sand-300',
        `tool-card-${tool.toolType}`,
        isSelected && 'ring-2 ring-blue-500 border-blue-300',
        !tool.isEditable && 'opacity-80'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={tool.toolType} />
          <h3 className="font-medium text-gray-900">{tool.name}</h3>
          {isDirty && (
            <Circle className="w-2 h-2 fill-orange-500 text-orange-500" />
          )}
        </div>
        <ScopeBadge scope={tool.scope} projectName={projectName} />
      </div>

      {tool.frontmatter.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {tool.frontmatter.description}
        </p>
      )}

      <ToolMeta tool={tool} className="mt-3" />
    </div>
  );
}
