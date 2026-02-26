import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://task-management-system-backend-qdw6.onrender.com'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
}

export const taskAPI = {
  getAll:   ()         => api.get('/api/tasks'),
  create:   (data)     => api.post('/api/tasks', data),
  update:   (id, data) => api.put(`/api/tasks/${id}`, data),
  toggle:   (id)       => api.patch(`/api/tasks/${id}/toggle`),
  delete:   (id)       => api.delete(`/api/tasks/${id}`),
  getStats: ()         => api.get('/api/tasks/stats'),
}

export default api