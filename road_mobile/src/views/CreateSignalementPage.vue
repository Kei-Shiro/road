<!--
  Page de création d'un nouveau signalement
  Formulaire complet avec géolocalisation et photos
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

        <!-- Section Photos -->
        <div class="photos-section">
          <h4>
            <ion-icon :icon="cameraOutline"></ion-icon>
            Photos (optionnel)
          </h4>

          <!-- Boutons d'ajout de photo -->
          <div class="photo-buttons">
            <ion-button
              fill="outline"
              @click="addPhoto"
              :disabled="photos.length >= 5"
            >
              <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
              Ajouter une photo
            </ion-button>
          </div>

          <!-- Grille de photos -->
          <div v-if="photos.length > 0" class="photos-grid">
            <div v-for="(photo, index) in photos" :key="index" class="photo-item">
              <img :src="photo.dataUrl" :alt="'Photo ' + (index + 1)" />
              <ion-button
                fill="clear"
                color="danger"
                size="small"
                class="remove-photo-btn"
                @click="removePhoto(index)"
              >
                <ion-icon :icon="closeCircleOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>

          <p class="photo-hint" v-if="photos.length < 5">
            Vous pouvez ajouter jusqu'à 5 photos ({{ 5 - photos.length }} restante(s))
          </p>
        </div>

        <!-- Prévisualisation de la carte -->
        <div class="map-preview" v-if="formData.latitude && formData.longitude">
          <h4>
            <ion-icon :icon="mapOutline"></ion-icon>
            Prévisualisation
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
  cameraOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import L from 'leaflet';

import { useSignalementStore } from '@/stores/signalementStore';
import { locationService } from '@/services/locationService';
import { cameraService } from '@/services/cameraService';
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
const photos = ref([]);

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

// Fonctions pour la gestion des photos
async function addPhoto() {
  if (photos.value.length >= 5) {
    const toast = await toastController.create({
      message: 'Maximum 5 photos autorisées',
      duration: 2000,
      color: 'warning',
    });
    await toast.present();
    return;
  }

  try {
    const photo = await cameraService.promptForPhoto();
    photos.value.push(photo);

    const toast = await toastController.create({
      message: 'Photo ajoutée',
      duration: 1500,
      color: 'success',
    });
    await toast.present();
  } catch (err) {
    if (err.message !== 'Annulé') {
      const toast = await toastController.create({
        message: err.message || 'Erreur lors de la capture',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }
}

function removePhoto(index) {
  photos.value.splice(index, 1);
}

async function handleSubmit() {
  error.value = '';

  if (!isFormValid.value) {
    error.value = 'Veuillez remplir tous les champs obligatoires';
    return;
  }

  try {
    const signalementData = {
      titre: formData.value.titre,
      description: formData.value.description,
      adresse: formData.value.adresse,
      latitude: formData.value.latitude,
      longitude: formData.value.longitude,
      type: formData.value.type,
      priorite: formData.value.priorite,
    };

    // Créer le signalement
    const newSignalement = await signalementStore.create(signalementData);

    // Upload des photos si présentes
    if (photos.value.length > 0 && newSignalement?.id) {
      try {
        for (const photo of photos.value) {
          await signalementStore.uploadPhoto(newSignalement.id, photo);
        }
      } catch (photoError) {
        console.error('Erreur lors de l\'upload des photos:', photoError);
        // On continue malgré l'erreur des photos
      }
    }

    const toast = await toastController.create({
      message: 'Signalement créé avec succès !',
      duration: 2000,
      color: 'success',
    });
    await toast.present();

    router.push('/tabs/map');
  } catch (err) {
    error.value = err.message || 'Erreur lors de la création du signalement';
  }
}
</script>

<style scoped>
.input-item {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  margin-bottom: 16px;
}

.coords-section {
  display: flex;
  gap: 12px;
}

.coord-item {
  flex: 1;
}

.location-btn {
  margin: 16px 0;
  --border-radius: 12px;
}

.photos-section {
  margin: 24px 0;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.photos-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: var(--ion-color-medium);
}

.photo-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  --padding-start: 4px;
  --padding-end: 4px;
}

.photo-hint {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin: 0;
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
