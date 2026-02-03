<!--
  Page de modification d'un signalement
  Formulaire pré-rempli avec les données existantes
-->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/signalement/${id}`" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Modifier le signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Chargement -->
      <div v-if="loadingData" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement...</p>
      </div>

      <!-- Formulaire -->
      <form v-else @submit.prevent="handleSubmit">
        <!-- Titre -->
        <ion-item class="input-item">
          <ion-icon :icon="textOutline" slot="start" color="primary"></ion-icon>
          <ion-input
            v-model="formData.titre"
            label="Titre *"
            label-placement="floating"
            required
          ></ion-input>
        </ion-item>

        <!-- Description -->
        <ion-item class="input-item">
          <ion-icon :icon="documentTextOutline" slot="start" color="primary"></ion-icon>
          <ion-textarea
            v-model="formData.description"
            label="Description *"
            label-placement="floating"
            :rows="4"
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
            required
          ></ion-input>
        </ion-item>

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
          <ion-icon v-else :icon="saveOutline" slot="start"></ion-icon>
          {{ loading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
        </ion-button>

        <!-- Bouton annuler -->
        <ion-button
          expand="block"
          fill="outline"
          color="medium"
          @click="cancel"
          class="cancel-btn"
        >
          Annuler
        </ion-button>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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
  buildOutline,
  flagOutline,
  alertCircleOutline,
  saveOutline,
} from 'ionicons/icons';

import { useSignalementStore } from '@/stores/signalementStore';
import { TYPE_TRAVAUX_LABELS, PRIORITE_LABELS } from '@/utils/constants';

// Router
const router = useRouter();
const route = useRoute();

// Store
const signalementStore = useSignalementStore();

// Refs
const loadingData = ref(true);
const error = ref('');
const id = ref(null);

// Form data
const formData = ref({
  titre: '',
  description: '',
  adresse: '',
  type: 'REPARATION',
  priorite: 'MOYENNE',
});

// Computed
const loading = computed(() => signalementStore.loading);
const isFormValid = computed(() => {
  return (
    formData.value.titre.trim() !== '' &&
    formData.value.description.trim() !== '' &&
    formData.value.adresse.trim() !== ''
  );
});

// Lifecycle
onMounted(async () => {
  id.value = parseInt(route.params.id);
  await loadSignalement();
});

// Methods
async function loadSignalement() {
  loadingData.value = true;

  try {
    const sig = await signalementStore.fetchById(id.value);
    
    formData.value = {
      titre: sig.titre || '',
      description: sig.description || '',
      adresse: sig.adresse || '',
      type: sig.type || 'REPARATION',
      priorite: sig.priorite || 'MOYENNE',
    };
  } catch (err) {
    error.value = 'Erreur lors du chargement du signalement';
  } finally {
    loadingData.value = false;
  }
}

async function handleSubmit() {
  error.value = '';

  if (!isFormValid.value) {
    error.value = 'Veuillez remplir tous les champs obligatoires';
    return;
  }

  try {
    await signalementStore.update(id.value, formData.value);

    const toast = await toastController.create({
      message: 'Signalement modifié avec succès !',
      duration: 2000,
      color: 'success',
    });
    await toast.present();

    router.replace({ name: 'SignalementDetail', params: { id: id.value } });
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la modification';
  }
}

function cancel() {
  router.back();
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
}

.loading-container p {
  margin-top: 16px;
  color: var(--ion-color-medium);
}

.input-item {
  --background: var(--ion-color-step-50);
  --border-radius: 12px;
  --padding-start: 12px;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.error-item {
  --background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: 12px;
  margin: 16px 0;
}

.submit-btn {
  margin-top: 24px;
  --border-radius: 12px;
  height: 52px;
  font-weight: 600;
}

.cancel-btn {
  margin-top: 12px;
  --border-radius: 12px;
}
</style>
