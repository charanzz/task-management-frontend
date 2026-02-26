import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://task-management-system-backend-qdw6.onrender.com'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach JWT
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth — matches UserController EXACTLY
// POST /api/users/register — body: { username, email, password } — returns User object
// POST /api/users/login    — body: { email, password }           — returns plain string token
export const authAPI = {
  register: (data) => api.post('/api/users/register', data),
  login:    (data) => api.post('/api/users/login',    data),
}

// Tasks
export const taskAPI = {
  getAll:   ()       => api.get('/api/tasks'),
  create:   (data)   => api.post('/api/tasks', data),
  update:   (id, d)  => api.put(`/api/tasks/${id}`, d),
  toggle:   (id)     => api.patch(`/api/tasks/${id}/toggle`),
  remove:   (id)     => api.delete(`/api/tasks/${id}`),
  getStats: ()       => api.get('/api/tasks/stats'),
}

export default api