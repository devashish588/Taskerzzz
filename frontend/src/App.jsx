import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import InvitePage from './pages/InvitePage';
import AdminDashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import Projects from './pages/admin/Projects';
import ProjectDetail from './pages/admin/ProjectDetail';
import Tasks from './pages/admin/Tasks';
import TaskDetail from './pages/admin/TaskDetail';
import Team from './pages/admin/Team';
import Settings from './pages/admin/Settings';
import TaskerDashboard from './pages/tasker/Dashboard';
import MyTasks from './pages/tasker/MyTasks';
import { Toaster } from 'react-hot-toast';

const DashboardRouter = () => {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <TaskerDashboard />;
};

function App() {
  const { checkAuth, isLoading } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => { initTheme(); checkAuth(); }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-base-300 text-sm font-mono">Loading Taskerzz...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />

        {/* Protected with layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/analytics" element={<ProtectedRoute adminOnly><Analytics /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute adminOnly><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/team" element={<ProtectedRoute adminOnly><Team /></ProtectedRoute>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Settings />} />
          <Route path="/my-tasks" element={<MyTasks />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ className: 'toast-custom', duration: 3000 }} />
    </BrowserRouter>
  );
}

export default App;
