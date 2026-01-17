import { clsx } from 'clsx';
import { Calendar } from 'lucide-react';
import type { Tool } from '../../types/rust-bindings';
import { formatDate } from '../../lib/format';
import { ContextCount } from '../ui/ContextBar';
import { PluginBadge } from '../ui/PluginBadge';

interface ToolMetaProps {
  tool: Tool;
  className?: string;
  size?: 'sm' | 'xs';
}

const sizeStyles: Record<NonNullable<ToolMetaProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  xs: 'text-[10px] px-1.5 py-0.5',
};

const containerStyles: Record<NonNullable<ToolMetaProps['size']>, string> = {
  sm: 'text-xs',
  xs: 'text-[10px]',
};

const iconStyles: Record<NonNullable<ToolMetaProps['size']>, string> = {
  sm: 'w-3 h-3',
  xs: 'w-3 h-3',
};

export function ToolMeta({ tool, className, size = 'sm' }: ToolMetaProps) {
  if (!tool.pluginName && tool.contextCharacters === 0 && tool.lastModified === 0) {
    return null;
  }

  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', containerStyles[size], className)}>
      {tool.pluginName && <PluginBadge name={tool.pluginName} size={size} />}
      <ContextCount chars={tool.contextCharacters} size={size} />
      {tool.lastModified > 0 && (
        <span
          className={clsx(
            'inline-flex items-center gap-1 rounded border border-sand-200 bg-sand-100 text-sand-700',
            sizeStyles[size]
          )}
        >
          <Calendar className={iconStyles[size]} />
          {formatDate(tool.lastModified)}
        </span>
      )}
    </div>
  );
}
