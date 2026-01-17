import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ToolsView } from './routes/ToolsView';
import { ProjectsView } from './routes/ProjectsView';
import { HomeView } from './routes/HomeView';
import { MatrixView } from './routes/MatrixView';
import { SettingsView } from './routes/SettingsView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/tools" element={<ToolsView />} />
          <Route path="/projects" element={<ProjectsView />} />
          <Route path="/matrix" element={<MatrixView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
