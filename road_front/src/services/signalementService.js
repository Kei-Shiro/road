import api from './api';

export const signalementService = {
  async getAll(page = 0, size = 20) {
    const response = await api.get('/signalements', {
      params: { page, size },
    });
    return response.data;
  },

  async getByStatut(statut, page = 0, size = 20) {
    const response = await api.get(`/signalements/statut/${statut}`, {
      params: { page, size },
    });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/signalements/${id}`);
    return response.data;
  },

  async getByBounds(minLat, maxLat, minLng, maxLng) {
    const response = await api.get('/signalements/bounds', {
      params: { minLat, maxLat, minLng, maxLng },
    });
    return response.data;
  },

  async create(data) {
    const response = await api.post('/signalements', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/signalements/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/signalements/${id}`);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/signalements/stats');
    return response.data;
  },

  async sync(data) {
    const response = await api.post('/signalements/sync', data);
    return response.data;
  },

  async getPrixParM2() {
    const response = await api.get('/signalements/config/prix-m2');
    return response.data;
  },

  async updatePrixParM2(prixParM2) {
    const response = await api.put('/signalements/config/prix-m2', { prixParM2: prixParM2.toString() });
    return response.data;
  },

  async getConfigurations() {
    const response = await api.get('/signalements/config');
    return response.data;
  },
};

