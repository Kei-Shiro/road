/**
 * Store d'authentification Pinia
 * Gère l'état de connexion de l'utilisateur
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';
import { useSignalementStore } from '@/stores/signalementStore';

export const useAuthStore = defineStore('auth', () => {
  // État
  const user = ref(null);
  const token = ref(null);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const userRole = computed(() => user.value?.role || null);
  const isAdmin = computed(() => userRole.value === 'ADMIN');
  const isManager = computed(() => userRole.value === 'MANAGER');
  const canCreateSignalement = computed(() => isAuthenticated.value && !isAdmin.value);
  const userName = computed(() => {
    if (!user.value) return '';
    return `${user.value.prenom || ''} ${user.value.nom || ''}`.trim();
  });

  // Actions

  /**
   * Initialise l'authentification au démarrage
   */
  async function initAuth() {
    if (initialized.value) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const storedUser = await authService.getCurrentUser();
      const storedToken = await authService.getToken();
      
      if (storedUser && storedToken) {
        user.value = storedUser;
        token.value = storedToken;
        
        // Vérifier la validité du token en récupérant le profil
        try {
          const profile = await authService.getProfile();
          user.value = profile;
          await authService.updateStoredUser(profile);

          // Démarrer le polling des notifications de changement de statut
          if (profile?.id) {
            const signalementStore = useSignalementStore();
            signalementStore.startStatusPolling(profile.id);
          }
        } catch (profileError) {
          // Token invalide, déconnecter
          console.warn('Token invalide, déconnexion:', profileError);
          await logout();
        }
      }
    } catch (err) {
      console.error('Erreur initialisation auth:', err);
      error.value = err.message;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async function login(email, password) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.login(email, password);
      
      user.value = response.user;
      token.value = response.accessToken;
      
      // Démarrer le polling des notifications de changement de statut
      if (response.user?.id) {
        const signalementStore = useSignalementStore();
        signalementStore.startStatusPolling(response.user.id);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur de connexion';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Connexion via Firebase
   */
  async function loginWithFirebase(email, password) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.loginWithFirebase(email, password);
      
      user.value = response.user;
      token.value = response.accessToken;
      
      return response;
    } catch (err) {
      error.value = err.message || 'Erreur Firebase';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Déconnexion
   */
  async function logout() {
    loading.value = true;
    
    try {
      // Arrêter le polling des notifications
      const signalementStore = useSignalementStore();
      signalementStore.stopStatusPolling();

      await authService.logout();
    } catch (err) {
      console.warn('Erreur lors de la déconnexion:', err);
    } finally {
      user.value = null;
      token.value = null;
      loading.value = false;
    }
  }

  /**
   * Met à jour le profil utilisateur localement
   */
  function updateUser(userData) {
    user.value = { ...user.value, ...userData };
    authService.updateStoredUser(user.value);
  }

  /**
   * Recharge le profil depuis le serveur
   */
  async function refreshProfile() {
    if (!isAuthenticated.value) return;
    
    try {
      const profile = await authService.getProfile();
      user.value = profile;
      await authService.updateStoredUser(profile);
    } catch (err) {
      console.error('Erreur refresh profil:', err);
    }
  }

  /**
   * Nettoie l'erreur
   */
  function clearError() {
    error.value = null;
  }

  return {
    // État
    user,
    token,
    loading,
    initialized,
    error,
    
    // Getters
    isAuthenticated,
    userRole,
    isAdmin,
    isManager,
    canCreateSignalement,
    userName,
    
    // Actions
    initAuth,
    login,
    loginWithFirebase,
    logout,
    updateUser,
    refreshProfile,
    clearError,
  };
});
