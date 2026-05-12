import api from './axios';

export const projectsApi = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getOverdue: (params) => api.get('/tasks/overdue', { params }),
  getByProject: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  submitForReview: (id) => api.put(`/tasks/${id}/submit`),
  review: (id, data) => api.put(`/tasks/${id}/review`, data),
};

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: (id) => api.get(`/users/${id}/stats`),
  setDailyTarget: (id, dailyTarget) => api.put(`/users/${id}/daily-target`, { dailyTarget }),
};

export const commentsApi = {
  getByTask: (taskId) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getTasksOverTime: (days) => api.get('/analytics/tasks-over-time', { params: { days } }),
  getByStatus: () => api.get('/analytics/by-status'),
  getByPriority: () => api.get('/analytics/by-priority'),
  getByProject: () => api.get('/analytics/by-project'),
  getTaskerPerformance: () => api.get('/analytics/tasker-performance'),
  getTaskerTimeline: (id, days) => api.get(`/analytics/tasker/${id}/timeline`, { params: { days } }),
  getReviewMetrics: () => api.get('/analytics/review-metrics'),
  getProductivity: (days) => api.get('/analytics/productivity', { params: { days } }),
};

export const authApi = {
  invite: (email) => api.post('/auth/invite', { email }),
  acceptInvite: (data) => api.post('/auth/accept-invite', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};
