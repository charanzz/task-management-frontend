import axios from "axios";

const API = axios.create({
  baseURL: "https://task-management-system-backend-x9qb.onrender.com",
});
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token")
  if (token) {
    req.headers.Authorization = `Bearer ${token}`
  }
  return req
})

export default API
