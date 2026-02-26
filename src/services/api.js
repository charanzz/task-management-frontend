import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://task-management-system-backend-qdw6.onrender.com'

const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export const authAPI = {
  login:    d => api.post('/api/auth/login', d),
  register: d => api.post('/api/auth/register', d),
}

export const taskAPI = {
  getAll:   ()      => api.get('/api/tasks'),
  create:   d       => api.post('/api/tasks', d),
  update:   (id, d) => api.put(`/api/tasks/${id}`, d),
  toggle:   id      => api.patch(`/api/tasks/${id}/toggle`),
  remove:   id      => api.delete(`/api/tasks/${id}`),
  getStats: ()      => api.get('/api/tasks/stats'),
}

export default api