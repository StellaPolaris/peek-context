import { Badge } from '../ui/Badge';
import type { ToolScope } from '../../types/rust-bindings';
import { Globe, FolderGit2 } from 'lucide-react';

interface ScopeBadgeProps {
  scope: ToolScope;
  projectName?: string;
}

export function ScopeBadge({ scope, projectName }: ScopeBadgeProps) {
  switch (scope) {
    case 'global':
      return (
        <Badge variant="global" className="flex items-center">
          <Globe className="w-3 h-3 mr-1" />
          Global
        </Badge>
      );
    case 'project':
      return (
        <Badge variant="project" className="flex items-center">
          <FolderGit2 className="w-3 h-3 mr-1" />
          {projectName || 'Project'}
        </Badge>
      );
  }
}
