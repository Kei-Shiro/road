<!--
  Page de création d'un nouveau signalement
  Formulaire complet avec géolocalisation
-->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/map" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Nouveau signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <form @submit.prevent="handleSubmit">
        <!-- Titre -->
        <ion-item class="input-item">
          <ion-icon :icon="textOutline" slot="start" color="primary"></ion-icon>
          <ion-input
            v-model="formData.titre"
            label="Titre *"
            label-placement="floating"
            placeholder="Ex: Nid de poule dangereux"
            required
            :counter="true"
            :maxlength="100"
          ></ion-input>
        </ion-item>

        <!-- Description -->
        <ion-item class="input-item">
          <ion-icon :icon="documentTextOutline" slot="start" color="primary"></ion-icon>
          <ion-textarea
            v-model="formData.description"
            label="Description *"
            label-placement="floating"
            placeholder="Décrivez le problème en détail..."
            :rows="4"
            :counter="true"
            :maxlength="500"
            required
          ></ion-textarea>
        </ion-item>

        <!-- Adresse -->
        <ion-item class="input-item">
          <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
          <ion-input
            v-model="formData.adresse"
            label="Adresse *"
            label-placement="floating"
            placeholder="Ex: Avenue de l'Indépendance, Analakely"
            required
          ></ion-input>
        </ion-item>

        <!-- Coordonnées GPS -->
        <div class="coords-section">
          <ion-item class="input-item coord-item">
            <ion-icon :icon="navigateOutline" slot="start" color="secondary"></ion-icon>
            <ion-input
              v-model.number="formData.latitude"
              label="Latitude *"
              label-placement="floating"
              type="number"
              step="any"
              required
            ></ion-input>
          </ion-item>

          <ion-item class="input-item coord-item">
            <ion-icon :icon="navigateOutline" slot="start" color="secondary"></ion-icon>
            <ion-input
              v-model.number="formData.longitude"
              label="Longitude *"
              label-placement="floating"
              type="number"
              step="any"
              required
            ></ion-input>
          </ion-item>
        </div>

        <!-- Bouton de géolocalisation -->
        <ion-button 
          expand="block" 
          fill="outline" 
          @click="getCurrentLocation" 
          :disabled="gettingLocation"
          class="location-btn"
        >
          <ion-spinner v-if="gettingLocation" name="crescent" slot="start"></ion-spinner>
          <ion-icon v-else :icon="locateOutline" slot="start"></ion-icon>
          {{ gettingLocation ? 'Localisation...' : 'Utiliser ma position actuelle' }}
        </ion-button>

        <!-- Type de travaux -->
        <ion-item class="input-item">
          <ion-icon :icon="buildOutline" slot="start" color="primary"></ion-icon>
          <ion-select
            v-model="formData.type"
            label="Type de travaux *"
            label-placement="floating"
            interface="action-sheet"
          >
            <ion-select-option 
              v-for="(label, key) in TYPE_TRAVAUX_LABELS" 
              :key="key" 
              :value="key"
            >
              {{ label }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Priorité -->
        <ion-item class="input-item">
          <ion-icon :icon="flagOutline" slot="start" color="primary"></ion-icon>
          <ion-select
            v-model="formData.priorite"
            label="Priorité *"
            label-placement="floating"
            interface="action-sheet"
          >
            <ion-select-option 
              v-for="(label, key) in PRIORITE_LABELS" 
              :key="key" 
              :value="key"
            >
              {{ label }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Aperçu de la carte -->
        <div v-if="formData.latitude && formData.longitude" class="map-preview">
          <h4>
            <ion-icon :icon="mapOutline"></ion-icon>
            Aperçu de la localisation
          </h4>
          <div id="preview-map" ref="previewMapRef"></div>
        </div>

        <!-- Message d'erreur -->
        <ion-item v-if="error" lines="none" class="error-item">
          <ion-icon :icon="alertCircleOutline" color="danger" slot="start"></ion-icon>
          <ion-label color="danger">{{ error }}</ion-label>
        </ion-item>

        <!-- Bouton de soumission -->
        <ion-button
          expand="block"
          type="submit"
          :disabled="loading || !isFormValid"
          class="submit-btn"
        >
          <ion-spinner v-if="loading" name="crescent" slot="start"></ion-spinner>
          <ion-icon v-else :icon="sendOutline" slot="start"></ion-icon>
          {{ loading ? 'Envoi en cours...' : 'Envoyer le signalement' }}
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import {
  textOutline,
  documentTextOutline,
  locationOutline,
  navigateOutline,
  locateOutline,
  buildOutline,
  flagOutline,
  mapOutline,
  alertCircleOutline,
  sendOutline,
} from 'ionicons/icons';
import L from 'leaflet';

import { useSignalementStore } from '@/stores/signalementStore';
import { locationService } from '@/services/locationService';
import { TYPE_TRAVAUX_LABELS, PRIORITE_LABELS, TANA_CENTER } from '@/utils/constants';

// Router
const router = useRouter();
const route = useRoute();

// Store
const signalementStore = useSignalementStore();

// Refs
const previewMapRef = ref(null);
const previewMap = ref(null);
const previewMarker = ref(null);
const gettingLocation = ref(false);
const error = ref('');

// Form data
const formData = ref({
  titre: '',
  description: '',
  adresse: '',
  latitude: null,
  longitude: null,
  type: 'REPARATION',
  priorite: 'MOYENNE',
});

// Computed
const loading = computed(() => signalementStore.loading);
const isFormValid = computed(() => {
  return (
    formData.value.titre.trim() !== '' &&
    formData.value.description.trim() !== '' &&
    formData.value.adresse.trim() !== '' &&
    formData.value.latitude !== null &&
    formData.value.longitude !== null
  );
});

// Lifecycle
onMounted(() => {
  // Récupérer les coordonnées de l'URL si présentes
  if (route.query.lat && route.query.lng) {
    formData.value.latitude = parseFloat(route.query.lat);
    formData.value.longitude = parseFloat(route.query.lng);
  }
});

// Watcher pour la carte de prévisualisation
watch(
  () => [formData.value.latitude, formData.value.longitude],
  async () => {
    if (formData.value.latitude && formData.value.longitude) {
      await nextTick();
      updatePreviewMap();
    }
  },
  { immediate: true }
);

// Methods
async function getCurrentLocation() {
  gettingLocation.value = true;
  error.value = '';

  try {
    const hasPermission = await locationService.checkPermissions();
    
    if (!hasPermission) {
      error.value = 'Permission de localisation refusée';
      return;
    }

    const position = await locationService.getCurrentPosition();
    formData.value.latitude = parseFloat(position.latitude.toFixed(6));
    formData.value.longitude = parseFloat(position.longitude.toFixed(6));

    const toast = await toastController.create({
      message: 'Position récupérée avec succès',
      duration: 2000,
      color: 'success',
    });
    await toast.present();
  } catch (err) {
    error.value = err.message || 'Impossible de récupérer la position';
  } finally {
    gettingLocation.value = false;
  }
}

function updatePreviewMap() {
  if (!previewMapRef.value) return;
  
  const lat = formData.value.latitude;
  const lng = formData.value.longitude;
  
  if (!lat || !lng) return;

  // Créer ou mettre à jour la carte
  if (!previewMap.value) {
    previewMap.value = L.map(previewMapRef.value, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(previewMap.value);
  } else {
    previewMap.value.setView([lat, lng], 16);
  }

  // Ajouter ou mettre à jour le marqueur
  if (previewMarker.value) {
    previewMarker.value.setLatLng([lat, lng]);
  } else {
    previewMarker.value = L.marker([lat, lng]).addTo(previewMap.value);
  }
}

async function handleSubmit() {
  error.value = '';

  if (!isFormValid.value) {
    error.value = 'Veuillez remplir tous les champs obligatoires';
    return;
  }

  try {
    await signalementStore.create({
      titre: formData.value.titre,
      description: formData.value.description,
      adresse: formData.value.adresse,
      latitude: formData.value.latitude,
      longitude: formData.value.longitude,
      type: formData.value.type,
      priorite: formData.value.priorite,
    });

    const toast = await toastController.create({
      message: 'Signalement créé avec succès !',
      duration: 3000,
      color: 'success',
    });
    await toast.present();

    router.replace('/tabs/signalements');
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la création';
  }
}
</script>

<style scoped>
.input-item {
  --background: var(--ion-color-step-50);
  --border-radius: 12px;
  --padding-start: 12px;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.coords-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.coord-item {
  margin-bottom: 8px;
}

.location-btn {
  margin: 16px 0;
  --border-radius: 12px;
}

.map-preview {
  margin: 24px 0;
}

.map-preview h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: var(--ion-color-medium);
}

#preview-map {
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.error-item {
  --background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: 12px;
  margin: 16px 0;
}

.submit-btn {
  margin-top: 24px;
  --border-radius: 12px;
  height: 56px;
  font-weight: 600;
  font-size: 1.1rem;
}
</style>
