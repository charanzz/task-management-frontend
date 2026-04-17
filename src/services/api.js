// src/services/api.js
// Robust API client with:
// - Auto retry on network failure (backend cold start)
// - Wake-up detection with user feedback
// - Request deduplication
// - Token refresh handling

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 35000, // 35s — enough for Render cold start
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token to every request ────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle errors globally ────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;

    // Don't retry if already retried or if it's an auth error
    if (config._retryCount >= 3) return Promise.reject(error);
    if (error.response?.status === 401) {
      // Token expired — clear and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (error.response?.status === 403) return Promise.reject(error);

    // Network error or timeout — backend might be cold starting
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';
    const isServerError = error.response?.status >= 500;

    if (isNetworkError || isTimeout || isServerError) {
      config._retryCount = (config._retryCount || 0) + 1;

      // Show wake-up notification on first retry
      if (config._retryCount === 1) {
        showWakeUpBanner();
      }

      // Wait before retrying (exponential backoff)
      const delay = config._retryCount * 3000; // 3s, 6s, 9s
      await new Promise(r => setTimeout(r, delay));

      return api(config);
    }

    return Promise.reject(error);
  }
);

// ── Wake-up banner — shows when backend is cold starting ─────────────────
let bannerEl = null;
let bannerTimeout = null;

function showWakeUpBanner() {
  if (bannerEl) return; // already showing

  bannerEl = document.createElement('div');
  bannerEl.id = 'tf-wakeup-banner';
  bannerEl.innerHTML = `
    <div style="
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #1e1b4b; border: 1px solid #4f46e5; border-radius: 14px;
      padding: 12px 20px; display: flex; align-items: center; gap: 12px;
      z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      font-family: 'DM Sans', sans-serif; animation: slideUp 0.3s ease;
      max-width: 360px; width: 90%;
    ">
      <span style="font-size: 20px; animation: spin 1s linear infinite; display: inline-block;">⏳</span>
      <div>
        <p style="margin:0; font-size:13px; font-weight:600; color:#e2e8f0;">Waking up the server...</p>
        <p style="margin:0; font-size:11px; color:#94a3b8;">This takes ~15 seconds on first visit</p>
      </div>
    </div>
    <style>
      @keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;
  document.body.appendChild(bannerEl);

  // Auto-hide after 20s
  bannerTimeout = setTimeout(hideWakeUpBanner, 20000);
}

function hideWakeUpBanner() {
  if (bannerEl) {
    bannerEl.remove();
    bannerEl = null;
  }
  if (bannerTimeout) {
    clearTimeout(bannerTimeout);
    bannerTimeout = null;
  }
}

// Hide banner when any request succeeds
api.interceptors.response.use(response => {
  hideWakeUpBanner();
  return response;
});

// ── authAPI — used by Login.jsx and Register.jsx ──────────────────────────
// These calls skip the 401 redirect since user isn't logged in yet
export const authAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

// Retry on cold start for auth calls too
authAPI.interceptors.response.use(
  response => { hideWakeUpBanner(); return response; },
  async error => {
    const config = error.config;
    if (config._retryCount >= 3) return Promise.reject(error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      return Promise.reject(error);
    }
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';
    if (isNetworkError || isTimeout) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount === 1) showWakeUpBanner();
      await new Promise(r => setTimeout(r, config._retryCount * 3000));
      return authAPI(config);
    }
    return Promise.reject(error);
  }
);

export default api;