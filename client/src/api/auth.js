import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE,
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

export const authAPI = {
  register: async (data) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('sh_token')
      localStorage.removeItem('sh_user')
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updateOnboarding: async (onboardingData) => {
    const response = await api.put('/auth/onboarding', onboardingData)
    return response.data
  },
}

export default authAPI
