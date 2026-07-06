import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
if (API_URL && !API_URL.endsWith('/api/v1')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api/v1';
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_bos_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/register') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        localStorage.setItem('ai_bos_access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem('ai_bos_access_token');
        if (window.location.pathname !== '/login') window.location.assign('/login');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && original?.url?.includes('/auth/refresh')) {
      localStorage.removeItem('ai_bos_access_token');
    }

    return Promise.reject(error);
  }
);

export const endpoints = {
  auth: {
    login: (payload) => api.post('/auth/login', payload),
    register: (payload) => api.post('/auth/register', payload),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
  },
  dashboard: () => api.get('/dashboard'),
  customers: {
    list: (params) => api.get('/customers', { params }),
    create: (payload) => api.post('/customers', payload),
    update: (id, payload) => api.put(`/customers/${id}`, payload)
  },
  products: {
    list: (params) => api.get('/products', { params }),
    stats: () => api.get('/products/stats'),
    create: (payload) => api.post('/products', payload),
    update: (id, payload) => api.put(`/products/${id}`, payload)
  },
  orders: {
    list: (params) => api.get('/orders', { params }),
    create: (payload) => api.post('/orders', payload),
    status: (id, payload) => api.patch(`/orders/${id}/status`, payload),
    cancel: (id) => api.post(`/orders/${id}/cancel`)
  },
  finance: {
    list: (params) => api.get('/finance', { params }),
    summary: () => api.get('/finance/summary'),
    create: (payload) => api.post('/finance', payload),
    invoice: (id) => api.post(`/finance/${id}/invoice`)
  },
  ai: {
    chat: (payload) => api.post('/ai/chat', typeof payload === 'string' ? { message: payload } : payload),
    conversations: (params) => api.get('/ai/conversations', { params }),
    messages: (id) => api.get(`/ai/conversations/${id}/messages`),
    updateConversation: (id, payload) => api.patch(`/ai/conversations/${id}`, payload),
    deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),
    documents: () => api.get('/ai/documents'),
    uploadDocument: (formData) => api.post('/ai/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteDocument: (id) => api.delete(`/ai/documents/${id}`),
    askKnowledge: (payload) => api.post('/ai/knowledge/ask', payload),
    reports: () => api.get('/ai/reports'),
    generateReport: (payload) => api.post('/ai/generate-report', payload),
    runAgent: (payload) => api.post('/ai/agents/run', payload),
    workflowLogs: () => api.get('/ai/agents/logs'),
    agentTasks: () => api.get('/ai/agents/tasks')
  },
  analytics: Object.assign(
    (params) => api.get('/analytics', { params }),
    {
      dashboard: (params) => api.get('/analytics/dashboard', { params }),
      sales: (params) => api.get('/analytics/sales', { params }),
      customers: (params) => api.get('/analytics/customers', { params }),
      inventory: () => api.get('/analytics/inventory'),
      finance: (params) => api.get('/analytics/finance', { params }),
      employees: () => api.get('/analytics/employees'),
      predictions: () => api.get('/analytics/predictions'),
      businessScore: () => api.get('/analytics/business-score'),
      recommendations: () => api.get('/analytics/recommendations')
    }
  ),
  settings: {
    get: () => api.get('/settings'),
    update: (payload) => api.put('/settings', payload)
  }
};
