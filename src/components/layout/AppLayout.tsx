import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { UpdateChecker } from '../UpdateChecker';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-sand-50">
      <SidebarNav />
      <main className="flex-1 overflow-hidden">
        <UpdateChecker />
        <Outlet />
      </main>
    </div>
  );
}
