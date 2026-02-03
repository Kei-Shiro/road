/**
 * Configuration Axios pour les appels API
 * Gère l'authentification via intercepteurs
 */
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

// URL de base de l'API backend
// En développement, utiliser l'IP locale du serveur
const API_BASE_URL = 'http://localhost:8080/api';

// Créer l'instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Timeout de 15 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Récupère le token stocké
 */
const getStoredToken = async () => {
  try {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  } catch {
    // Fallback sur localStorage en mode web
    return localStorage.getItem('token');
  }
};

/**
 * Supprime les données d'authentification
 */
const clearAuthData = async () => {
  try {
    await Preferences.remove({ key: 'token' });
    await Preferences.remove({ key: 'user' });
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ===============================
// Intercepteur REQUEST
// Ajoute le token JWT dans les headers
// ===============================
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// Intercepteur RESPONSE
// Gère les erreurs d'authentification (401)
// ===============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide, déconnecter l'utilisateur
      await clearAuthData();
      
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

/**
 * Configure l'URL de base de l'API
 * Utile pour changer entre environnements
 */
export const setApiBaseUrl = (url) => {
  api.defaults.baseURL = url;
};
