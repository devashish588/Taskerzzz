import { Sun, Moon, Bell, Menu } from 'lucide-react';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';

const Header = ({ title, onMenuToggle }) => {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="app-header-menu lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base font-bold text-white font-heading">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="app-header-btn">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="app-header-btn relative">
          <Bell size={17} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-xs font-bold text-white ml-1">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
