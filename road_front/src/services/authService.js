import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // === Fonctions Admin/Manager pour la gestion des utilisateurs ===

  /**
   * Récupère la liste de tous les utilisateurs (Manager/Admin uniquement)
   */
  async getAllUsers() {
    const response = await api.get('/auth/admin/users');
    return response.data;
  },

  /**
   * Crée un nouvel utilisateur (Manager/Admin uniquement)
   */
  async createUser(userData) {
    const response = await api.post('/auth/admin/users', userData);
    return response.data;
  },

  /**
   * Récupère un utilisateur par ID
   */
  async getUserById(userId) {
    const response = await api.get(`/auth/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Supprime un utilisateur
   */
  async deleteUser(userId) {
    const response = await api.delete(`/auth/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Déverrouille un compte utilisateur par email (public)
   */
  async unlockAccountByEmail(email) {
    const response = await api.post(`/auth/unlock/${encodeURIComponent(email)}`);
    return response.data;
  },

  /**
   * Déverrouille un compte utilisateur par ID (Manager uniquement)
   */
  async unlockAccountById(userId) {
    const response = await api.post(`/auth/admin/unlock/${userId}`);
    return response.data;
  },
