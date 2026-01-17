import { clsx } from 'clsx';
import { formatCharCount, type ContextByScope } from '../../lib/format';

interface ContextBarProps {
  context: ContextByScope;
  className?: string;
  showLabel?: boolean;
}

/**
 * Stacked horizontal bar showing context character distribution by scope.
 * Colors: Amber (global) -> Violet (project)
 */
export function ContextBar({ context, className, showLabel = true }: ContextBarProps) {
  const { global, project, total } = context;

  // Don't render if no context
  if (total === 0) {
    return null;
  }

  // Calculate percentages
  const globalPct = (global / total) * 100;
  const projectPct = (project / total) * 100;

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex"
        title={`Global: ${formatCharCount(global)} | Project: ${formatCharCount(project)}`}
      >
        {global > 0 && (
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${globalPct}%` }}
          />
        )}
        {project > 0 && (
          <div
            className="h-full bg-violet-400 transition-all duration-300"
            style={{ width: `${projectPct}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          context {formatCharCount(total)}
        </span>
      )}
    </div>
  );
}

/**
 * Compact version for inline display (e.g., in tool cards)
 */
interface ContextCountProps {
  chars: number;
  className?: string;
  size?: 'sm' | 'xs';
}

const sizeStyles: Record<NonNullable<ContextCountProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  xs: 'text-[10px] px-1.5 py-0.5',
};

const labelStyles: Record<NonNullable<ContextCountProps['size']>, string> = {
  sm: 'text-[10px]',
  xs: 'text-[9px]',
};

export function ContextCount({ chars, className, size = 'sm' }: ContextCountProps) {
  if (chars === 0) {
    return null;
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded border border-sand-200 bg-sand-100 text-sand-700',
        sizeStyles[size],
        className
      )}
    >
      <span className={clsx('tracking-wide text-sand-500', labelStyles[size])}>context</span>
      <span className="font-medium">{formatCharCount(chars)}</span>
    </span>
  );
}
