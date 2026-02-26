import axios from "axios";

/*
  Priority:
  1️⃣ Use VITE_API_URL (for production Render frontend)
  2️⃣ Fallback to Render backend URL
  3️⃣ Fallback to localhost (for local dev)
*/
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://task-management-system-backend-qdw6.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─────────────────────────────────────────────
   Attach JWT Token Automatically
───────────────────────────────────────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // ❌ Don't attach token for login/register
  if (
    token &&
    !config.url.includes("/api/auth/login") &&
    !config.url.includes("/api/auth/register")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ─────────────────────────────────────────────
   Auto Logout on 401
───────────────────────────────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────
   AUTH APIs
───────────────────────────────────────────── */
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
};

/* ─────────────────────────────────────────────
   TASK APIs
───────────────────────────────────────────── */
export const taskAPI = {
  getAll: () => api.get("/api/tasks"),
  getById: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post("/api/tasks", data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  toggle: (id) => api.patch(`/api/tasks/${id}/toggle`),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  getStats: () => api.get("/api/tasks/stats"),
  getByStatus: (status) => api.get(`/api/tasks/status/${status}`),
  getByPriority: (priority) =>
    api.get(`/api/tasks/priority/${priority}`),
};

export default api;