import { api } from './axios'

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

export { api }
export default authAPI
