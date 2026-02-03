/**
 * Service d'authentification
 * Gère la connexion via Firebase et le backend
 */
import api from './api';
import { Preferences } from '@capacitor/preferences';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';

// Configuration Firebase (à remplacer par vos valeurs)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialiser Firebase
let firebaseApp = null;
let firebaseAuth = null;

try {
  firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
} catch (error) {
  console.warn('Firebase non initialisé, utilisation du backend uniquement');
}

/**
 * Stocke les données utilisateur
 */
const storeUserData = async (token, user) => {
  try {
    await Preferences.set({ key: 'token', value: token });
    await Preferences.set({ key: 'user', value: JSON.stringify(user) });
  } catch {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Récupère les données utilisateur stockées
 */
const getStoredUser = async () => {
  try {
    const { value } = await Preferences.get({ key: 'user' });
    return value ? JSON.parse(value) : null;
  } catch {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

/**
 * Récupère le token stocké
 */
const getStoredToken = async () => {
  try {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  } catch {
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

export const authService = {
  /**
   * Connexion avec email et mot de passe
   * Essaie d'abord Firebase, puis le backend
   */
  async login(email, password) {
    try {
      // Connexion via le backend (sans Firebase pour l'instant)
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.accessToken) {
        await storeUserData(response.data.accessToken, response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  /**
   * Connexion via Firebase
   */
  async loginWithFirebase(email, password) {
    if (!firebaseAuth) {
      throw new Error('Firebase non configuré');
    }

    try {
      // Authentification Firebase
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Envoyer le token Firebase au backend pour validation
      const response = await api.post('/auth/firebase-login', { idToken });
      
      if (response.data.accessToken) {
        await storeUserData(response.data.accessToken, response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur Firebase:', error);
      throw error;
    }
  },

  /**
   * Déconnexion
   */
  async logout() {
    try {
      // Déconnecter du backend
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Erreur lors de la déconnexion backend:', error);
    }

    // Déconnecter de Firebase si disponible
    if (firebaseAuth) {
      try {
        await firebaseSignOut(firebaseAuth);
      } catch (error) {
        console.warn('Erreur Firebase signOut:', error);
      }
    }

    // Nettoyer les données locales
    await clearAuthData();
  },

  /**
   * Récupère le profil utilisateur depuis le backend
   */
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Récupère l'utilisateur actuel depuis le stockage local
   */
  async getCurrentUser() {
    return await getStoredUser();
  },

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  async isAuthenticated() {
    const token = await getStoredToken();
    return !!token;
  },

  /**
   * Récupère le token actuel
   */
  async getToken() {
    return await getStoredToken();
  },

  /**
   * Observe les changements d'état d'authentification Firebase
   */
  onAuthStateChanged(callback) {
    if (firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, callback);
    }
    return () => {}; // Retourne une fonction vide si Firebase n'est pas disponible
  },

  /**
   * Met à jour les données utilisateur stockées
   */
  async updateStoredUser(user) {
    try {
      await Preferences.set({ key: 'user', value: JSON.stringify(user) });
    } catch {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
};
