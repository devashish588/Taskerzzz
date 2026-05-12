import { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3, Settings, LogOut, Zap, ListTodo, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/team', icon: Users, label: 'Team' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const taskerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-tasks', icon: ListTodo, label: 'My Tasks' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const links = isAdmin ? adminLinks : taskerLinks;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`sidebar-logo ${collapsed ? 'sidebar-logo--collapsed' : ''}`}>
        <div className="sidebar-logo-icon">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-[15px] font-bold text-white font-heading leading-tight">Taskerzz</h1>
            <p className="text-[9px] text-cream font-mono uppercase tracking-[0.2em]">workspace</p>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn hidden lg:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="sidebar-collapse-btn lg:hidden"
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''} ${collapsed ? 'sidebar-link--collapsed' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-base-300 truncate">{user?.role}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-link sidebar-link--danger ${collapsed ? 'sidebar-link--collapsed' : ''}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className={`sidebar sidebar--desktop ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
