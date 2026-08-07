/**
 * PayGuard – Axios API Client
 * ============================
 * Configured HTTP client with JWT interceptors, base URL,
 * and automatic token refresh.
 */

import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// ── Request Interceptor: Attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("payguard_access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: Handle 401 ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem("payguard_refresh_token")
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          localStorage.setItem("payguard_access_token", data.access_token)
          localStorage.setItem("payguard_refresh_token", data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem("payguard_access_token")
          localStorage.removeItem("payguard_refresh_token")
          localStorage.removeItem("payguard_user")
          window.location.href = "/login"
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
