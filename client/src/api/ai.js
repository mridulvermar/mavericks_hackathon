import { api } from './auth'

export const aiAPI = {
  discoverSkills: async (description) => {
    const response = await api.post('/ai/discover-skills', { description })
    return response.data
  },

  generateProfile: async (data) => {
    const response = await api.post('/ai/generate-profile', data)
    return response.data
  },

  chat: async (message) => {
    const response = await api.post('/ai/chat', { message })
    return response.data
  },
}

export default aiAPI
