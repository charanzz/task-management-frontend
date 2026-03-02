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

// Auth
export const authAPI = {
  // sends { name, email, password } — backend RegisterRequest expects "name" not "username"
  register: (data) => api.post('/api/users/register', data),
  // returns { token, email, name, id }
  login:    (data) => api.post('/api/users/login', data),

  googleLogin: (data) => api.post('/api/users/google-login', data),
}

// Tasks
export const taskAPI = {
  getAll:  ()        => api.get('/api/tasks'),
  create:  (data)    => api.post('/api/tasks', data),
  update:  (id, d)   => api.put(`/api/tasks/${id}`, d),
  remove:  (id)      => api.delete(`/api/tasks/${id}`),
  getStats: ()       => api.get('/api/users/stats'),  // fixed: was /api/tasks/stats
}

export const userAPI = {
    getBadges: () => api.get('/api/users/badges'),
    getLevel:  () => api.get('/api/users/level'),
    getStats:  () => api.get('/api/users/stats'),
    getMe:     () => api.get('/api/users/me'),
}
export default api