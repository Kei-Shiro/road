/**
 * Constantes de l'application
 * Reprend les valeurs de l'application web
 */

// Centre de la carte (Antananarivo)
export const TANA_CENTER = [-18.8792, 47.5079];
export const TANA_ZOOM = 13;

// Statuts des signalements
export const STATUT_SIGNALEMENT = {
  NOUVEAU: 'NOUVEAU',
  EN_COURS: 'EN_COURS',
  TERMINE: 'TERMINE',
  ANNULE: 'ANNULE',
};

// Labels des statuts pour l'affichage
export const STATUT_LABELS = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

// Couleurs des statuts
export const STATUT_COLORS = {
  NOUVEAU: '#ef4444',
  EN_COURS: '#f59e0b',
  TERMINE: '#10b981',
  ANNULE: '#6b7280',
};

// Icônes Ionicons pour les statuts
export const STATUT_ICONS = {
  NOUVEAU: 'alert-circle',
  EN_COURS: 'construct',
  TERMINE: 'checkmark-circle',
  ANNULE: 'close-circle',
};

// Niveaux de priorité
export const PRIORITE = {
  BASSE: 'BASSE',
  MOYENNE: 'MOYENNE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE',
};

// Labels des priorités
export const PRIORITE_LABELS = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

// Couleurs des priorités
export const PRIORITE_COLORS = {
  BASSE: '#10b981',
  MOYENNE: '#3b82f6',
  HAUTE: '#f59e0b',
  URGENTE: '#ef4444',
};

// Icônes des priorités
export const PRIORITE_ICONS = {
  BASSE: 'chevron-down',
  MOYENNE: 'remove',
  HAUTE: 'chevron-up',
  URGENTE: 'flame',
};

// Types de travaux
export const TYPE_TRAVAUX = {
  REPARATION: 'REPARATION',
  CONSTRUCTION: 'CONSTRUCTION',
  ENTRETIEN: 'ENTRETIEN',
  EXTENSION: 'EXTENSION',
};

// Labels des types de travaux
export const TYPE_TRAVAUX_LABELS = {
  REPARATION: 'Réparation',
  CONSTRUCTION: 'Construction',
  ENTRETIEN: 'Entretien',
  EXTENSION: 'Extension',
};

// Icônes des types de travaux
export const TYPE_TRAVAUX_ICONS = {
  REPARATION: 'build',
  CONSTRUCTION: 'hammer',
  ENTRETIEN: 'settings',
  EXTENSION: 'expand',
};

// Rôles utilisateurs
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VISITEUR: 'VISITEUR',
};

// Labels des rôles
export const ROLES_LABELS = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  VISITEUR: 'Visiteur',
};

// Options de tri
export const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Plus récent' },
  { value: 'date_asc', label: 'Plus ancien' },
  { value: 'priorite_desc', label: 'Priorité (haute → basse)' },
  { value: 'priorite_asc', label: 'Priorité (basse → haute)' },
  { value: 'statut', label: 'Statut' },
];

// Options de filtre par statut
export const FILTER_STATUT_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'NOUVEAU', label: 'Nouveaux' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminés' },
  { value: 'ANNULE', label: 'Annulés' },
];

// Messages d'erreur communs
export const ERROR_MESSAGES = {
  NETWORK: 'Erreur de connexion. Vérifiez votre réseau.',
  AUTH: 'Session expirée. Veuillez vous reconnecter.',
  PERMISSION: 'Vous n\'avez pas les droits pour effectuer cette action.',
  NOT_FOUND: 'Élément non trouvé.',
  VALIDATION: 'Veuillez vérifier les informations saisies.',
  SERVER: 'Erreur serveur. Réessayez plus tard.',
  LOCATION: 'Impossible d\'obtenir votre position.',
};

// Durées d'animation (en ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};
