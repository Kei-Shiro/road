/**
 * Store de gestion des signalements Pinia
 * Gère l'état des signalements et les opérations CRUD
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { signalementService } from '@/services/signalementService';
import { sortSignalements, filterByStatut, filterByUser, calculateStats } from '@/utils/helpers';

export const useSignalementStore = defineStore('signalement', () => {
  // État
  const signalements = ref([]);
  const currentSignalement = ref(null);
  const loading = ref(false);
  const refreshing = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 0,
    size: 50,
    totalElements: 0,
    totalPages: 0,
    hasMore: false,
  });
  
  // Filtres et tri
  const filterStatut = ref('all');
  const filterMyOnly = ref(false);
  const sortBy = ref('date_desc');
  const searchQuery = ref('');
  
  // Statistiques en cache
  const stats = ref(null);

  // Getters

  /**
   * Signalements filtrés et triés
   */
  const filteredSignalements = computed(() => {
    let result = [...signalements.value];
    
    // Filtre par statut
    if (filterStatut.value !== 'all') {
      result = filterByStatut(result, filterStatut.value);
    }
    
    // Tri
    result = sortSignalements(result, sortBy.value);
    
    return result;
  });

  /**
   * Signalements de l'utilisateur connecté
   */
  const mySignalements = computed(() => {
    return (userId) => {
      return filterByUser(signalements.value, userId);
    };
  });

  /**
   * Statistiques calculées
   */
  const computedStats = computed(() => {
    return calculateStats(signalements.value);
  });

  /**
   * Nombre de signalements par statut
   */
  const countByStatut = computed(() => {
    return {
      total: signalements.value.length,
      nouveau: signalements.value.filter(s => s.statut === 'NOUVEAU').length,
      enCours: signalements.value.filter(s => s.statut === 'EN_COURS').length,
      termine: signalements.value.filter(s => s.statut === 'TERMINE').length,
      annule: signalements.value.filter(s => s.statut === 'ANNULE').length,
    };
  });

  // Actions

  /**
   * Charge tous les signalements
   */
  async function fetchAll(page = 0, size = 50) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await signalementService.getAll(page, size);
      
      if (page === 0) {
        signalements.value = response.content || [];
      } else {
        signalements.value = [...signalements.value, ...(response.content || [])];
      }
      
      pagination.value = {
        page: response.pageable?.pageNumber || page,
        size: response.pageable?.pageSize || size,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        hasMore: !response.last,
      };
      
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur de chargement';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Rafraîchit les signalements (pull-to-refresh)
   */
  async function refresh() {
    refreshing.value = true;
    
    try {
      await fetchAll(0, pagination.value.size);
    } finally {
      refreshing.value = false;
    }
  }

  /**
   * Charge plus de signalements (pagination infinie)
   */
  async function loadMore() {
    if (!pagination.value.hasMore || loading.value) return;
    
    await fetchAll(pagination.value.page + 1, pagination.value.size);
  }

  /**
   * Récupère un signalement par son ID
   */
  async function fetchById(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const signalement = await signalementService.getById(id);
      currentSignalement.value = signalement;
      return signalement;
    } catch (err) {
      error.value = err.response?.data?.message || 'Signalement non trouvé';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crée un nouveau signalement
   */
  async function create(data) {
    loading.value = true;
    error.value = null;
    
    try {
      const newSignalement = await signalementService.create(data);
      
      // Ajouter au début de la liste
      signalements.value = [newSignalement, ...signalements.value];
      
      return newSignalement;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur de création';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Met à jour un signalement
   */
  async function update(id, data) {
    loading.value = true;
    error.value = null;
    
    try {
      const updated = await signalementService.update(id, data);
      
      // Mettre à jour dans la liste
      const index = signalements.value.findIndex(s => s.id === id);
      if (index !== -1) {
        signalements.value[index] = updated;
      }
      
      // Mettre à jour le signalement courant si c'est le même
      if (currentSignalement.value?.id === id) {
        currentSignalement.value = updated;
      }
      
      return updated;
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur de mise à jour';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Supprime un signalement
   */
  async function remove(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await signalementService.delete(id);
      
      // Retirer de la liste
      signalements.value = signalements.value.filter(s => s.id !== id);
      
      // Nettoyer si c'était le signalement courant
      if (currentSignalement.value?.id === id) {
        currentSignalement.value = null;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur de suppression';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Charge les signalements dans une zone géographique
   */
  async function fetchByBounds(bounds) {
    try {
      const { minLat, maxLat, minLng, maxLng } = bounds;
      const response = await signalementService.getByBounds(minLat, maxLat, minLng, maxLng);
      return response;
    } catch (err) {
      console.error('Erreur chargement par zone:', err);
      return [];
    }
  }

  /**
   * Charge les statistiques
   */
  async function fetchStats() {
    try {
      stats.value = await signalementService.getStats();
      return stats.value;
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      return null;
    }
  }

  /**
   * Définit le filtre par statut
   */
  function setFilterStatut(statut) {
    filterStatut.value = statut;
  }

  /**
   * Définit le mode "mes signalements uniquement"
   */
  function setFilterMyOnly(value) {
    filterMyOnly.value = value;
  }

  /**
   * Définit le tri
   */
  function setSortBy(value) {
    sortBy.value = value;
  }

  /**
   * Définit la recherche
   */
  function setSearchQuery(query) {
    searchQuery.value = query;
  }

  /**
   * Nettoie l'erreur
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Réinitialise le store
   */
  function reset() {
    signalements.value = [];
    currentSignalement.value = null;
    loading.value = false;
    refreshing.value = false;
    error.value = null;
    filterStatut.value = 'all';
    filterMyOnly.value = false;
    sortBy.value = 'date_desc';
    searchQuery.value = '';
    stats.value = null;
    pagination.value = {
      page: 0,
      size: 50,
      totalElements: 0,
      totalPages: 0,
      hasMore: false,
    };
  }

  return {
    // État
    signalements,
    currentSignalement,
    loading,
    refreshing,
    error,
    pagination,
    filterStatut,
    filterMyOnly,
    sortBy,
    searchQuery,
    stats,
    
    // Getters
    filteredSignalements,
    mySignalements,
    computedStats,
    countByStatut,
    
    // Actions
    fetchAll,
    refresh,
    loadMore,
    fetchById,
    create,
    update,
    remove,
    fetchByBounds,
    fetchStats,
    setFilterStatut,
    setFilterMyOnly,
    setSortBy,
    setSearchQuery,
    clearError,
    reset,
  };
});
