/**
 * Service de gestion des signalements
 * Communique avec l'API backend pour les opérations CRUD
 */
import api from './api';

export const signalementService = {
  /**
   * Récupère tous les signalements avec pagination
   * @param {number} page - Numéro de page (0-indexed)
   * @param {number} size - Nombre d'éléments par page
   */
  async getAll(page = 0, size = 50) {
    const response = await api.get('/signalements', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Récupère les signalements par statut
   * @param {string} statut - Statut (NOUVEAU, EN_COURS, TERMINE, ANNULE)
   * @param {number} page - Numéro de page
   * @param {number} size - Nombre d'éléments par page
   */
  async getByStatut(statut, page = 0, size = 50) {
    const response = await api.get(`/signalements/statut/${statut}`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Récupère un signalement par son ID
   * @param {number} id - ID du signalement
   */
  async getById(id) {
    const response = await api.get(`/signalements/${id}`);
    return response.data;
  },

  /**
   * Récupère les signalements dans une zone géographique
   * @param {number} minLat - Latitude minimum
   * @param {number} maxLat - Latitude maximum
   * @param {number} minLng - Longitude minimum
   * @param {number} maxLng - Longitude maximum
   */
  async getByBounds(minLat, maxLat, minLng, maxLng) {
    const response = await api.get('/signalements/bounds', {
      params: { minLat, maxLat, minLng, maxLng },
    });
    return response.data;
  },

  /**
   * Récupère les signalements de l'utilisateur connecté
   */
  async getMySignalements(page = 0, size = 50) {
    const response = await api.get('/signalements/my', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Crée un nouveau signalement
   * @param {Object} data - Données du signalement
   */
  async create(data) {
    const response = await api.post('/signalements', {
      titre: data.titre,
      description: data.description,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      adresse: data.adresse,
      type: data.type,
      priorite: data.priorite,
    });
    return response.data;
  },

  /**
   * Met à jour un signalement existant
   * @param {number} id - ID du signalement
   * @param {Object} data - Nouvelles données
   */
  async update(id, data) {
    const response = await api.put(`/signalements/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un signalement
   * @param {number} id - ID du signalement à supprimer
   */
  async delete(id) {
    const response = await api.delete(`/signalements/${id}`);
    return response.data;
  },

  /**
   * Récupère les statistiques globales
   */
  async getStats() {
    const response = await api.get('/signalements/stats');
    return response.data;
  },

  /**
   * Synchronise les signalements créés hors ligne
   * @param {Object} data - Données de synchronisation
   */
  async sync(data) {
    const response = await api.post('/signalements/sync', data);
    return response.data;
  },

  /**
   * Recherche des signalements par mot-clé
   * @param {string} query - Terme de recherche
   */
  async search(query, page = 0, size = 20) {
    const response = await api.get('/signalements/search', {
      params: { query, page, size },
    });
    return response.data;
  }
};
