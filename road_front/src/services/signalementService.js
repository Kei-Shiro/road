import api from './api'

export const signalementService = {
  async getAll(params = {}) {
    const response = await api.get('/signalements', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/signalements/${id}`)
    return response.data
  },

  async getByStatut(statut, params = {}) {
    const response = await api.get(`/signalements/statut/${statut}`, { params })
    return response.data
  },

  async getByBounds(bounds) {
    const response = await api.get('/signalements/bounds', { params: bounds })
    return response.data
  },

  async create(signalement) {
    const response = await api.post('/signalements', signalement)
    return response.data
  },

  async update(id, signalement) {
    const response = await api.put(`/signalements/${id}`, signalement)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/signalements/${id}`)
    return response.data
  },

  async getStats() {
    const response = await api.get('/signalements/stats')
    return response.data
  },

  async sync(syncData) {
    const response = await api.post('/signalements/sync', syncData)
    return response.data
  }
}

export default signalementService

