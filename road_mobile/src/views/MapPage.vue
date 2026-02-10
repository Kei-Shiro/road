<!--
  Page de la carte interactive
  Affiche les signalements sur une carte Leaflet/OpenStreetMap
-->
<template>
  <ion-page>
    <!-- Header -->
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Carte des signalements</ion-title>
        <ion-buttons slot="end">
          <!-- Bouton de localisation -->
          <ion-button @click="centerOnUser" :disabled="!userPosition">
            <ion-icon slot="icon-only" :icon="locateOutline"></ion-icon>
          </ion-button>
          <!-- Bouton de filtre -->
          <ion-button @click="showFilterModal = true">
            <ion-icon slot="icon-only" :icon="filterOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="map-content">
      <!-- Carte Leaflet -->
      <div id="map" ref="mapContainer"></div>

      <!-- Légende de la carte -->
      <div class="map-legend" v-if="showLegend">
        <div class="legend-header">
          <span>Légende</span>
          <ion-button fill="clear" size="small" @click="showLegend = false">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </div>
        <div class="legend-items">
          <div class="legend-item" v-for="(color, statut) in STATUT_COLORS" :key="statut">
            <span class="legend-color" :style="{ backgroundColor: color }"></span>
            <span>{{ STATUT_LABELS[statut] }}</span>
          </div>
        </div>
      </div>

      <!-- Bouton pour afficher/masquer la légende -->
      <ion-button 
        v-if="!showLegend" 
        class="legend-toggle" 
        size="small" 
        fill="solid"
        @click="showLegend = true"
      >
        <ion-icon :icon="informationCircleOutline"></ion-icon>
      </ion-button>

      <!-- FAB pour créer un signalement -->
      <ion-fab v-if="canCreateSignalement" slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="handleCreateSignalement">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Indicateur de chargement -->
      <div v-if="loading" class="loading-overlay">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des signalements...</p>
      </div>
    </ion-content>

    <!-- Modal de création rapide -->
    <ion-modal :is-open="showQuickCreate" @did-dismiss="showQuickCreate = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Nouveau signalement</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showQuickCreate = false">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p class="quick-create-info">
          <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
          Appuyez sur la carte pour sélectionner l'emplacement du problème, 
          puis remplissez le formulaire.
        </p>
        <ion-button expand="block" @click="goToCreatePage">
          <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
          Créer un signalement
        </ion-button>
      </ion-content>
    </ion-modal>

    <!-- Modal de filtre -->
    <FilterModal 
      v-model:isOpen="showFilterModal" 
      @apply="applyFilters"
    />
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonModal,
  toastController,
} from '@ionic/vue';
import {
  addOutline,
  locateOutline,
  filterOutline,
  closeOutline,
  informationCircleOutline,
  addCircleOutline,
} from 'ionicons/icons';
import L from 'leaflet';

import { useAuthStore } from '@/stores/authStore';
import { useSignalementStore } from '@/stores/signalementStore';
import { locationService } from '@/services/locationService';
import { TANA_CENTER, TANA_ZOOM, STATUT_COLORS, STATUT_LABELS, TILE_SERVER } from '@/utils/constants';
import { formatDate, getMarkerColor } from '@/utils/helpers';
import FilterModal from '@/components/FilterModal.vue';

// Router
const router = useRouter();

// Stores
const authStore = useAuthStore();
const signalementStore = useSignalementStore();

// Refs
const mapContainer = ref(null);
const map = ref(null);
const markers = ref([]);
const userMarker = ref(null);
const userPosition = ref(null);
const showLegend = ref(true);
const showFilterModal = ref(false);
const showQuickCreate = ref(false);
const selectedPosition = ref(null);

// Computed
const loading = computed(() => signalementStore.loading);
const signalements = computed(() => signalementStore.filteredSignalements);
const canCreateSignalement = computed(() => authStore.canCreateSignalement);

// Initialisation de la carte
onMounted(async () => {
  initMap();
  await loadSignalements();
  await getUserLocation();
});

// Nettoyage
onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});

// Observer les changements de signalements
watch(signalements, () => {
  updateMarkers();
}, { deep: true });

/**
 * Initialise la carte Leaflet
 */
function initMap() {
  if (!mapContainer.value) return;

  // Créer la carte
  map.value = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView(TANA_CENTER, TANA_ZOOM);

  // Ajouter le contrôle de zoom en haut à droite
  L.control.zoom({ position: 'topright' }).addTo(map.value);

  // Ajouter les tuiles OpenStreetMap (avec fallback)
  L.tileLayer(TILE_SERVER.ONLINE_URL, {
    maxZoom: 19,
    attribution: TILE_SERVER.ATTRIBUTION,
  }).addTo(map.value);

  // Attribution en bas
  L.control.attribution({ position: 'bottomleft' })
    .addAttribution(TILE_SERVER.ATTRIBUTION)
    .addTo(map.value);

  // Gérer les clics sur la carte
  map.value.on('click', handleMapClick);
}

/**
 * Charge les signalements
 */
async function loadSignalements() {
  try {
    await signalementStore.fetchAll();
    updateMarkers();
  } catch (error) {
    const toast = await toastController.create({
      message: 'Erreur de chargement des signalements',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  }
}

/**
 * Met à jour les marqueurs sur la carte
 */
function updateMarkers() {
  // Supprimer les anciens marqueurs
  markers.value.forEach(marker => marker.remove());
  markers.value = [];

  // Ajouter les nouveaux marqueurs
  signalements.value.forEach(sig => {
    if (!sig.latitude || !sig.longitude) return;

    const color = getMarkerColor(sig.statut);
    
    // Créer une icône personnalisée
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="custom-marker" style="background-color: ${color}">
          ⚠️
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    // Créer le marqueur
    const marker = L.marker([sig.latitude, sig.longitude], { icon })
      .addTo(map.value)
      .bindPopup(createPopupContent(sig));

    // Ouvrir les détails au clic sur le marqueur
    marker.on('click', () => {
      setTimeout(() => {
        const detailButton = document.querySelector(`.popup-detail-btn[data-id="${sig.id}"]`);
        if (detailButton) {
          detailButton.addEventListener('click', () => {
            router.push(`/signalement/${sig.id}`);
          });
        }
      }, 100);
    });

    markers.value.push(marker);
  });
}

/**
 * Crée le contenu HTML du popup
 */
function createPopupContent(sig) {
  return `
    <div class="popup-content">
      <div class="popup-header">
        <span class="status-badge ${sig.statut.toLowerCase()}">${STATUT_LABELS[sig.statut]}</span>
        <h4>${sig.titre}</h4>
      </div>
      <div class="popup-body">
        <p><strong>Adresse:</strong> ${sig.adresse || 'Non renseignée'}</p>
        <p><strong>Date:</strong> ${formatDate(sig.createdAt)}</p>
        ${sig.description ? `<p>${sig.description.substring(0, 100)}...</p>` : ''}
      </div>
      <div class="popup-footer">
        <button class="popup-detail-btn" data-id="${sig.id}">Voir les détails →</button>
      </div>
    </div>
  `;
}

/**
 * Obtient la position de l'utilisateur
 */
async function getUserLocation() {
  try {
    const hasPermission = await locationService.checkPermissions();
    
    if (!hasPermission) {
      console.log('Permission de localisation refusée');
      return;
    }

    const position = await locationService.getCurrentPosition();
    userPosition.value = position;

    // Ajouter un marqueur pour la position utilisateur
    if (userMarker.value) {
      userMarker.value.remove();
    }

    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: `
        <div class="user-marker">
          <div class="user-marker-pulse"></div>
          <div class="user-marker-dot"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarker.value = L.marker([position.latitude, position.longitude], { icon: userIcon })
      .addTo(map.value)
      .bindPopup('Vous êtes ici');

    // Centrer sur l'utilisateur
    map.value.setView([position.latitude, position.longitude], 15);
  } catch (error) {
    console.warn('Erreur de géolocalisation:', error);
  }
}

/**
 * Centre la carte sur la position de l'utilisateur
 */
async function centerOnUser() {
  if (userPosition.value) {
    map.value.setView([userPosition.value.latitude, userPosition.value.longitude], 16, {
      animate: true,
    });
  } else {
    await getUserLocation();
  }
}

/**
 * Gère le clic sur la carte
 */
function handleMapClick(e) {
  if (!canCreateSignalement.value) return;

  selectedPosition.value = {
    lat: e.latlng.lat,
    lng: e.latlng.lng,
  };

  // Rediriger vers la page de création avec les coordonnées
  router.push({
    name: 'CreateSignalement',
    query: {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    },
  });
}

/**
 * Gère le clic sur le FAB de création
 */
function handleCreateSignalement() {
  if (userPosition.value) {
    router.push({
      name: 'CreateSignalement',
      query: {
        lat: userPosition.value.latitude,
        lng: userPosition.value.longitude,
      },
    });
  } else {
    showQuickCreate.value = true;
  }
}

/**
 * Navigue vers la page de création
 */
function goToCreatePage() {
  showQuickCreate.value = false;
  router.push({ name: 'CreateSignalement' });
}

/**
 * Applique les filtres
 */
function applyFilters(filters) {
  signalementStore.setFilterStatut(filters.statut);
  signalementStore.setSortBy(filters.sortBy);
  signalementStore.setFilterMyOnly(filters.myOnly);
  showFilterModal.value = false;
}
</script>

<style scoped>
.map-content {
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Légende */
.map-legend {
  position: absolute;
  bottom: 100px;
  left: 16px;
  background: var(--ion-card-background, white);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-toggle {
  position: absolute;
  bottom: 100px;
  left: 16px;
  z-index: 1000;
  --border-radius: 50%;
  width: 40px;
  height: 40px;
}

/* Chargement */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  color: white;
}

.loading-overlay p {
  margin-top: 16px;
}

/* Info création rapide */
.quick-create-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--ion-color-primary-tint);
  border-radius: 12px;
  margin-bottom: 24px;
  color: var(--ion-color-primary-contrast);
}

.quick-create-info ion-icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Marqueur utilisateur */
:deep(.user-marker) {
  position: relative;
  width: 24px;
  height: 24px;
}

:deep(.user-marker-dot) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--ion-color-primary);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:deep(.user-marker-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* Marqueur personnalisé */
:deep(.custom-marker) {
  width: 36px;
  height: 36px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  border: 3px solid white;
  font-size: 18px;
  color: white;
  text-align: center;
  line-height: 1;
}

/* Popup */
:deep(.popup-content) {
  min-width: 200px;
}

:deep(.popup-header h4) {
  margin: 8px 0 4px;
  font-size: 1rem;
  font-weight: 600;
}

:deep(.popup-body p) {
  margin: 4px 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

:deep(.popup-footer) {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--ion-color-step-100);
}

:deep(.popup-detail-btn) {
  background: var(--ion-color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s ease;
}

:deep(.popup-detail-btn:hover) {
  background: var(--ion-color-primary-shade);
}

:deep(.popup-link) {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-weight: 500;
}
</style>
