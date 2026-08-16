import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'
export const SOCKET_URL   = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5050'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sh_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
