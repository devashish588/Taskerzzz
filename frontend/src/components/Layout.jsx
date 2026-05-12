import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/team': 'Team',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/my-tasks': 'My Tasks',
};

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const baseRoute = '/' + location.pathname.split('/').filter(Boolean)[0];
  const title = pageTitles[baseRoute] || 'Taskerzz';

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={`app-main ${collapsed ? 'app-main--collapsed' : ''}`}>
        <Header title={title} onMenuToggle={() => setMobileOpen(true)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ className: 'toast-custom', duration: 3000 }} />
    </div>
  );
};

export default Layout;
