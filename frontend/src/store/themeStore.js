import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.className = next;
      return { theme: next };
    }),
  initTheme: () => {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = saved;
    set({ theme: saved });
  },
}));

export default useThemeStore;
