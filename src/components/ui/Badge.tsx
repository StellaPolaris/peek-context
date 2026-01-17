import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'command' | 'agent' | 'skill' | 'hook' | 'global' | 'project';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  command: 'bg-blue-100 text-blue-700',
  agent: 'bg-violet-100 text-violet-700',
  skill: 'bg-emerald-100 text-emerald-700',
  hook: 'bg-amber-100 text-amber-700',
  global: 'bg-purple-100 text-purple-700',
  project: 'bg-teal-100 text-teal-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
