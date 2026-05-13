import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (name, email, password, role = 'TASKER') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch (err) { console.error(err); }
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

export default useAuthStore;
