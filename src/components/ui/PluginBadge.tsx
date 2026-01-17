import { clsx } from 'clsx';
import { Package } from 'lucide-react';

interface PluginBadgeProps {
  name: string;
  size?: 'sm' | 'xs';
  className?: string;
}

const sizeStyles: Record<NonNullable<PluginBadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  xs: 'text-[10px] px-1.5 py-0.5',
};

const iconStyles: Record<NonNullable<PluginBadgeProps['size']>, string> = {
  sm: 'w-3 h-3',
  xs: 'w-3 h-3',
};

export function PluginBadge({ name, size = 'sm', className }: PluginBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-100 text-sky-700',
        sizeStyles[size],
        className
      )}
    >
      <Package className={iconStyles[size]} />
      plugin:{name}
    </span>
  );
}
