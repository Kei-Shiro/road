export const TANA_CENTER = [-18.8792, 47.5079];
export const TANA_ZOOM = 13;

// Configuration du serveur de tuiles
export const TILE_SERVER = {
  // Serveur offline local (Docker tileserver-gl)
  OFFLINE_URL: 'http://localhost:8081/styles/basic/{z}/{x}/{y}.png',
  // Serveur en ligne OpenStreetMap (fallback)
  ONLINE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  // Attribution
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const STATUT_SIGNALEMENT = {
  NOUVEAU: 'NOUVEAU',
  EN_COURS: 'EN_COURS',
  TERMINE: 'TERMINE',
  ANNULE: 'ANNULE',
};

export const STATUT_LABELS = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export const STATUT_COLORS = {
  NOUVEAU: '#ef4444',
  EN_COURS: '#f59e0b',
  TERMINE: '#10b981',
  ANNULE: '#6b7280',
};

export const PRIORITE = {
  BASSE: 'BASSE',
  MOYENNE: 'MOYENNE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE',
};

export const TYPE_TRAVAUX = {
  REPARATION: 'REPARATION',
  CONSTRUCTION: 'CONSTRUCTION',
  ENTRETIEN: 'ENTRETIEN',
  EXTENSION: 'EXTENSION',
};

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VISITEUR: 'VISITEUR',
};

