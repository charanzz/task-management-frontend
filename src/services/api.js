// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Wake-up banner ────────────────────────────────────────────────────────
let bannerEl = null;
let bannerTimeout = null;

function showWakeUpBanner() {
  if (bannerEl) return;
  bannerEl = document.createElement('div');
  bannerEl.innerHTML = `
    <div style="
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      background:#1e1b4b;border:1px solid #4f46e5;border-radius:14px;
      padding:12px 20px;display:flex;align-items:center;gap:12px;
      z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5);
      font-family:sans-serif;max-width:380px;width:90%;
    ">
      <span style="font-size:18px;">⏳</span>
      <div>
        <p style="margin:0;font-size:13px;font-weight:600;color:#e2e8f0;">Waking up server...</p>
        <p style="margin:0;font-size:11px;color:#94a3b8;">~15 sec on first visit</p>
      </div>
    </div>
  `;
  document.body.appendChild(bannerEl);
  bannerTimeout = setTimeout(hideWakeUpBanner, 25000);
}

function hideWakeUpBanner() {
  if (bannerEl) { bannerEl.remove(); bannerEl = null; }
  if (bannerTimeout) { clearTimeout(bannerTimeout); bannerTimeout = null; }
}

// ── Shared retry on cold start ────────────────────────────────────────────
async function retryOnColdStart(error, instance) {
  const config = error.config;
  if (!config) return Promise.reject(error);
  // Never retry 4xx — wrong password, not found, forbidden etc.
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return Promise.reject(error);
  }
  if ((config._retryCount || 0) >= 2) return Promise.reject(error);
  const isNetworkError = !error.response;
  const isTimeout = error.code === 'ECONNABORTED';
  const isServerError = error.response && error.response.status >= 500;
  if (isNetworkError || isTimeout || isServerError) {
    config._retryCount = (config._retryCount || 0) + 1;
    if (config._retryCount === 1) showWakeUpBanner();
    await new Promise(r => setTimeout(r, config._retryCount * 4000));
    return instance(config);
  }
  return Promise.reject(error);
}

// ── authAPI — Login & Register only (no token, no redirect) ──────────────
export const authAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});
authAPI.interceptors.response.use(
  res => { hideWakeUpBanner(); return res; },
  err => retryOnColdStart(err, authAPI)
);

// ── Main API — all authenticated requests ─────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  res => { hideWakeUpBanner(); return res; },
  async err => {
    if (err.response?.status === 401) {
      const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
      if (!onAuthPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
    return retryOnColdStart(err, api);
  }
);

export default api;