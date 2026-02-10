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

      <ion-button
        class="locate-button"
        size="small"
        fill="solid"
        color="light"
        @click="centerOnUserWithAnimation"
        :disabled="locatingUser"
      >
        <ion-spinner v-if="locatingUser" name="crescent" slot="icon-only"></ion-spinner>
        <ion-icon v-else :icon="locateOutline" slot="icon-only"></ion-icon>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
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
  onIonViewDidEnter,
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
import { useMapMarkers } from '@/composables/useMapMarkers';
import { TANA_CENTER, TANA_ZOOM, STATUT_COLORS, STATUT_LABELS } from '@/utils/constants';
import FilterModal from '@/components/FilterModal.vue';

// Router
const router = useRouter();

// Stores
const authStore = useAuthStore();
const signalementStore = useSignalementStore();

// Refs
const mapContainer = ref(null);
const map = ref(null);
const userMarker = ref(null);
const userPosition = ref(null);
const locatingUser = ref(false);
const showLegend = ref(true);
const showFilterModal = ref(false);
const showQuickCreate = ref(false);
const selectedPosition = ref(null);

// Map markers composable
let mapMarkersComposable = null;

// Computed
const loading = computed(() => signalementStore.loading);
const signalements = computed(() => signalementStore.filteredSignalements);
const canCreateSignalement = computed(() => authStore.canCreateSignalement);

// Initialisation de la carte
onMounted(async () => {
  await initMap();
  mapMarkersComposable = useMapMarkers(map.value);
  await loadSignalements();
  await getUserLocation();
});

onIonViewDidEnter(() => {
  refreshMapSize();
});

// Nettoyage
onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
  window.removeEventListener('resize', refreshMapSize);
});

// Observer les changements de signalements
watch(signalements, () => {
  updateMarkers();
}, { deep: true });

function refreshMapSize() {
  if (!map.value) return;
  requestAnimationFrame(() => {
    map.value.invalidateSize(true);
  });
}

/**
 * Initialise la carte Leaflet
 */
async function initMap() {
  if (!mapContainer.value) return;

  try {
    // Créer la carte avec configuration optimale
    map.value = L.map(mapContainer.value, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView(TANA_CENTER, TANA_ZOOM);

    // Forcer la mise à jour du DOM et du canvas
    await nextTick();

    window.addEventListener('resize', refreshMapSize);

    // Ajouter le contrôle de zoom en haut à droite
    L.control.zoom({ position: 'topright' }).addTo(map.value);

    // Ajouter les tuiles OpenStreetMap avec options de chargement
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 2,
      attribution: '© OpenStreetMap contributors',
      crossOrigin: true,
    }).addTo(map.value);

    // Attribution personnalisée
    L.control.attribution({ position: 'bottomleft' })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
      .addTo(map.value);

    // Gérer les clics sur la carte
    map.value.on('click', handleMapClick);

    // Invalider la taille de la carte plusieurs fois pour s'assurer qu'elle est correctement rendue
    refreshMapSize();
    await nextTick();
    setTimeout(() => {
      refreshMapSize();
    }, 100);
    setTimeout(() => {
      refreshMapSize();
    }, 250);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la carte:', error);
    const toast = await toastController.create({
      message: 'Erreur d\'initialisation de la carte',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  }
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
  if (!mapMarkersComposable || !map.value) return;

  mapMarkersComposable.updateMarkers(signalements.value, (signalementId) => {
    router.push(`/signalement/${signalementId}`);
  });
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

    const userIcon = mapMarkersComposable
      ? mapMarkersComposable.createUserLocationIcon()
      : L.divIcon({
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
 * Centre la carte sur la position de l'utilisateur avec animation
 */
async function centerOnUserWithAnimation() {
  locatingUser.value = true;

  try {
    // Si on a déjà la position, juste centrer
    if (userPosition.value && map.value) {
      map.value.flyTo(
        [userPosition.value.latitude, userPosition.value.longitude],
        17,
        {
          animate: true,
          duration: 1.5,
        }
      );

      // Pulse animation sur le marqueur utilisateur
      if (userMarker.value) {
        const markerElement = userMarker.value.getElement();
        if (markerElement) {
          markerElement.classList.add('pulse');
          setTimeout(() => {
            markerElement.classList.remove('pulse');
          }, 1500);
        }
      }
    } else {
      // Récupérer la position puis centrer
      const hasPermission = await locationService.checkPermissions();

      if (!hasPermission) {
        const toast = await toastController.create({
          message: 'Permission de localisation refusée',
          duration: 3000,
          color: 'warning',
          position: 'top',
        });
        await toast.present();
        return;
      }

      const position = await locationService.getCurrentPosition();
      userPosition.value = position;

      // Ajouter/mettre à jour le marqueur utilisateur
      if (userMarker.value) {
        userMarker.value.setLatLng([position.latitude, position.longitude]);
      } else {
        const userIcon = mapMarkersComposable
          ? mapMarkersComposable.createUserLocationIcon()
          : L.divIcon({
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
      }

      // Animer vers la position
      if (map.value) {
        map.value.flyTo(
          [position.latitude, position.longitude],
          17,
          {
            animate: true,
            duration: 1.5,
          }
        );
      }

      const toast = await toastController.create({
        message: 'Position trouvée',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();
    }
  } catch (error) {
    console.error('Erreur de localisation:', error);
    const toast = await toastController.create({
      message: error.message || 'Impossible de récupérer votre position',
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  } finally {
    locatingUser.value = false;
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
  overflow: hidden;
  --overflow: hidden;
  display: block;
  width: 100%;
  height: 100%;
}

#map {
  width: 100% !important;
  height: 100% !important;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background-color: #f0f0f0;
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

/* Bouton de localisation style Google Maps */
.locate-button {
  position: absolute;
  bottom: 180px;
  right: 16px;
  z-index: 1000;
  --border-radius: 50%;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  width: 44px;
  height: 44px;
  --background: white;
  --color: #333;
}

.locate-button:hover {
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.locate-button ion-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}

.locate-button ion-spinner {
  --color: var(--ion-color-primary);
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
