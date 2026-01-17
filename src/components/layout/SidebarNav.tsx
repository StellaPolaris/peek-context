import { clsx } from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Wrench,
  FolderOpen,
  Grid3x3,
  Settings,
} from 'lucide-react';
import { useToolsStore } from '../../features/tools/stores/toolsStore';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/matrix', label: 'Matrix', icon: Grid3x3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const location = useLocation();
  const { tools } = useToolsStore();

  // Compute counts
  const toolCount = tools.length;
  const projectCount = new Set(tools.filter((t) => t.projectRoot).map((t) => t.projectRoot)).size;

  const counts: Record<string, number | undefined> = {
    '/tools': toolCount,
    '/projects': projectCount,
  };

  return (
    <nav className="w-56 bg-sand-100 border-r border-sand-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sand-200">
        <h1 className="text-lg font-semibold text-gray-900">Claude Tools</h1>
        <p className="text-xs text-gray-500 mt-0.5">Viewer & Editor</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            const count = counts[path];
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:bg-sand-200 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className="ml-auto text-xs bg-sand-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sand-200 text-xs text-gray-500">
        <p>v0.1.0</p>
      </div>
    </nav>
  );
}
