/**
 * Fonctions utilitaires
 * Reprend et étend les helpers de l'application web
 */

/**
 * Formate un montant en Ariary
 * @param {number} amount - Montant à formater
 * @returns {string} Montant formaté
 */
export const formatBudget = (amount) => {
  if (!amount) return 'Non défini';
  
  const numAmount = Number(amount);
  
  if (numAmount >= 1000000) {
    return (numAmount / 1000000).toFixed(1) + 'M Ar';
  }
  if (numAmount >= 1000) {
    return (numAmount / 1000).toFixed(0) + 'K Ar';
  }
  
  return numAmount.toLocaleString() + ' Ar';
};

/**
 * Formate une date
 * @param {string|Date} dateStr - Date à formater
 * @returns {string} Date formatée
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formate une date avec l'heure
 * @param {string|Date} dateStr - Date à formater
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formate une date relative (ex: "il y a 2 heures")
 * @param {string|Date} dateStr - Date à formater
 * @returns {string} Date relative
 */
export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'À l\'instant';
  }
  if (diffMins < 60) {
    return `Il y a ${diffMins} min`;
  }
  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays}j`;
  }
  
  return formatDate(dateStr);
};

/**
 * Calcule le progrès moyen des signalements
 * @param {Array} signalements - Liste des signalements
 * @returns {number} Pourcentage de progression
 */
export const calculateProgress = (signalements) => {
  if (!signalements || signalements.length === 0) return 0;
  
  const totalProgress = signalements.reduce(
    (sum, s) => sum + (s.pourcentageAvancement || 0),
    0
  );
  
  return Math.round(totalProgress / signalements.length);
};

/**
 * Calcule les statistiques des signalements
 * @param {Array} signalements - Liste des signalements
 * @returns {Object} Statistiques
 */
export const calculateStats = (signalements) => {
  const stats = {
    total: signalements?.length || 0,
    nouveau: 0,
    enCours: 0,
    termine: 0,
    annule: 0,
    totalSurface: 0,
    totalBudget: 0,
  };
  
  if (!signalements) return stats;
  
  signalements.forEach((sig) => {
    switch (sig.statut) {
      case 'NOUVEAU':
        stats.nouveau++;
        break;
      case 'EN_COURS':
        stats.enCours++;
        break;
      case 'TERMINE':
        stats.termine++;
        break;
      case 'ANNULE':
        stats.annule++;
        break;
    }
    
    stats.totalSurface += sig.surfaceImpactee || 0;
    stats.totalBudget += Number(sig.budget || 0);
  });
  
  return stats;
};

/**
 * Trie les signalements selon différents critères
 * @param {Array} signalements - Liste à trier
 * @param {string} sortBy - Critère de tri
 * @returns {Array} Liste triée
 */
export const sortSignalements = (signalements, sortBy) => {
  if (!signalements || !Array.isArray(signalements)) return [];
  
  const sorted = [...signalements];
  
  switch (sortBy) {
    case 'date_desc':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    case 'date_asc':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    case 'priorite_desc':
      const prioriteOrder = { URGENTE: 0, HAUTE: 1, MOYENNE: 2, BASSE: 3 };
      return sorted.sort((a, b) => 
        (prioriteOrder[a.priorite] || 99) - (prioriteOrder[b.priorite] || 99)
      );
    
    case 'priorite_asc':
      const prioriteOrderAsc = { BASSE: 0, MOYENNE: 1, HAUTE: 2, URGENTE: 3 };
      return sorted.sort((a, b) => 
        (prioriteOrderAsc[a.priorite] || 99) - (prioriteOrderAsc[b.priorite] || 99)
      );
    
    case 'statut':
      const statutOrder = { NOUVEAU: 0, EN_COURS: 1, TERMINE: 2, ANNULE: 3 };
      return sorted.sort((a, b) => 
        (statutOrder[a.statut] || 99) - (statutOrder[b.statut] || 99)
      );
    
    default:
      return sorted;
  }
};

/**
 * Filtre les signalements par statut
 * @param {Array} signalements - Liste à filtrer
 * @param {string} statut - Statut à filtrer ('all' pour tous)
 * @returns {Array} Liste filtrée
 */
export const filterByStatut = (signalements, statut) => {
  if (!signalements || !Array.isArray(signalements)) return [];
  if (statut === 'all') return signalements;
  
  return signalements.filter((s) => s.statut === statut);
};

/**
 * Filtre les signalements par utilisateur
 * @param {Array} signalements - Liste à filtrer
 * @param {number} userId - ID de l'utilisateur
 * @returns {Array} Liste filtrée
 */
export const filterByUser = (signalements, userId) => {
  if (!signalements || !Array.isArray(signalements) || !userId) return signalements;
  
  return signalements.filter((s) => s.createdBy?.id === userId);
};

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Génère une couleur de marqueur selon le statut
 * @param {string} statut - Statut du signalement
 * @returns {string} Code couleur hexadécimal
 */
export const getMarkerColor = (statut) => {
  const colors = {
    NOUVEAU: '#ef4444',
    EN_COURS: '#f59e0b',
    TERMINE: '#10b981',
    ANNULE: '#6b7280',
  };
  
  return colors[statut] || '#6b7280';
};

/**
 * Vérifie si un utilisateur peut modifier un signalement
 * @param {Object} signalement - Signalement à vérifier
 * @param {Object} user - Utilisateur courant
 * @returns {boolean} true si modification autorisée
 */
export const canEditSignalement = (signalement, user) => {
  if (!user || !signalement) return false;
  
  // Les admins peuvent tout modifier
  if (user.role === 'ADMIN') return true;
  
  // Les managers peuvent modifier
  if (user.role === 'MANAGER') return true;
  
  // L'utilisateur peut modifier ses propres signalements non terminés
  if (signalement.createdBy?.id === user.id) {
    return signalement.statut !== 'TERMINE' && signalement.statut !== 'ANNULE';
  }
  
  return false;
};

/**
 * Vérifie si un utilisateur peut supprimer un signalement
 * @param {Object} signalement - Signalement à vérifier
 * @param {Object} user - Utilisateur courant
 * @returns {boolean} true si suppression autorisée
 */
export const canDeleteSignalement = (signalement, user) => {
  if (!user || !signalement) return false;
  
  // Seuls les admins peuvent supprimer
  if (user.role === 'ADMIN') return true;
  
  // L'utilisateur peut supprimer ses propres signalements NOUVEAU
  if (signalement.createdBy?.id === user.id && signalement.statut === 'NOUVEAU') {
    return true;
  }
  
  return false;
};

/**
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
