import { Badge } from '../ui/Badge';
import type { ToolType } from '../../types/rust-bindings';
import { Terminal, Bot, Sparkles, Webhook } from 'lucide-react';

interface TypeBadgeProps {
  type: ToolType;
}

const typeConfig: Record<ToolType, { label: string; icon: React.ReactNode }> = {
  command: { label: 'Command', icon: <Terminal className="w-3 h-3 mr-1" /> },
  agent: { label: 'Agent', icon: <Bot className="w-3 h-3 mr-1" /> },
  skill: { label: 'Skill', icon: <Sparkles className="w-3 h-3 mr-1" /> },
  hook: { label: 'Hook', icon: <Webhook className="w-3 h-3 mr-1" /> },
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = typeConfig[type];
  return (
    <Badge variant={type} className="flex items-center">
      {config.icon}
      {config.label}
    </Badge>
  );
}
