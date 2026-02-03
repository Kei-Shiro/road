<!--
  Page de détail d'un signalement
  Affiche toutes les informations d'un signalement
-->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/signalements" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Détail du signalement</ion-title>
        <ion-buttons slot="end" v-if="canEdit">
          <ion-button @click="goToEdit">
            <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Chargement -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
        <p>{{ error }}</p>
        <ion-button @click="loadSignalement">Réessayer</ion-button>
      </div>

      <!-- Contenu -->
      <template v-else-if="signalement">
        <!-- Carte mini -->
        <div id="detail-map" ref="detailMapRef" class="detail-map"></div>

        <!-- Infos principales -->
        <div class="detail-content">
          <!-- Badge statut + priorité -->
          <div class="badges-row">
            <span class="status-badge" :class="signalement.statut?.toLowerCase()">
              {{ STATUT_LABELS[signalement.statut] }}
            </span>
            <span class="priority-badge" :class="signalement.priorite?.toLowerCase()">
              {{ PRIORITE_LABELS[signalement.priorite] }}
            </span>
          </div>

          <!-- Titre -->
          <h1>{{ signalement.titre }}</h1>

          <!-- Type de travaux -->
          <ion-chip color="primary" outline>
            <ion-icon :icon="buildOutline"></ion-icon>
            <ion-label>{{ TYPE_TRAVAUX_LABELS[signalement.type] || signalement.type }}</ion-label>
          </ion-chip>

          <!-- Description -->
          <ion-card v-if="signalement.description">
            <ion-card-header>
              <ion-card-subtitle>Description</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              {{ signalement.description }}
            </ion-card-content>
          </ion-card>

          <!-- Informations détaillées -->
          <ion-list>
            <ion-list-header>
              <ion-label>Informations</ion-label>
            </ion-list-header>

            <!-- Adresse -->
            <ion-item>
              <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <p>Adresse</p>
                <h3>{{ signalement.adresse || 'Non renseignée' }}</h3>
              </ion-label>
            </ion-item>

            <!-- Date de création -->
            <ion-item>
              <ion-icon :icon="calendarOutline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <p>Date de signalement</p>
                <h3>{{ formatDateTime(signalement.createdAt) }}</h3>
              </ion-label>
            </ion-item>

            <!-- Signalé par -->
            <ion-item v-if="signalement.createdBy">
              <ion-icon :icon="personOutline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <p>Signalé par</p>
                <h3>{{ signalement.createdBy.prenom }} {{ signalement.createdBy.nom }}</h3>
              </ion-label>
            </ion-item>

            <!-- Coordonnées -->
            <ion-item>
              <ion-icon :icon="navigateOutline" slot="start" color="secondary"></ion-icon>
              <ion-label>
                <p>Coordonnées GPS</p>
                <h3>{{ signalement.latitude?.toFixed(6) }}, {{ signalement.longitude?.toFixed(6) }}</h3>
              </ion-label>
              <ion-button slot="end" fill="clear" @click="openInMaps">
                <ion-icon :icon="openOutline"></ion-icon>
              </ion-button>
            </ion-item>

            <!-- Surface impactée -->
            <ion-item v-if="signalement.surfaceImpactee">
              <ion-icon :icon="expandOutline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <p>Surface impactée</p>
                <h3>{{ signalement.surfaceImpactee }} m²</h3>
              </ion-label>
            </ion-item>

            <!-- Budget -->
            <ion-item v-if="signalement.budget">
              <ion-icon :icon="cashOutline" slot="start" color="success"></ion-icon>
              <ion-label>
                <p>Budget estimé</p>
                <h3>{{ formatBudget(signalement.budget) }}</h3>
              </ion-label>
            </ion-item>

            <!-- Entreprise responsable -->
            <ion-item v-if="signalement.entrepriseResponsable">
              <ion-icon :icon="businessOutline" slot="start" color="tertiary"></ion-icon>
              <ion-label>
                <p>Entreprise responsable</p>
                <h3>{{ signalement.entrepriseResponsable }}</h3>
              </ion-label>
            </ion-item>

            <!-- Progression -->
            <ion-item v-if="signalement.pourcentageAvancement !== undefined">
              <ion-icon :icon="statsChartOutline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <p>Progression</p>
                <div class="progress-container">
                  <ion-progress-bar :value="signalement.pourcentageAvancement / 100"></ion-progress-bar>
                  <span>{{ signalement.pourcentageAvancement }}%</span>
                </div>
              </ion-label>
            </ion-item>
          </ion-list>

          <!-- Actions -->
          <div class="actions" v-if="canEdit || canDelete">
            <ion-button v-if="canEdit" expand="block" @click="goToEdit">
              <ion-icon :icon="createOutline" slot="start"></ion-icon>
              Modifier
            </ion-button>
            <ion-button v-if="canDelete" expand="block" color="danger" fill="outline" @click="confirmDelete">
              <ion-icon :icon="trashOutline" slot="start"></ion-icon>
              Supprimer
            </ion-button>
          </div>
        </div>
      </template>

      <!-- Alert de suppression -->
      <ion-alert
        :is-open="showDeleteAlert"
        header="Confirmer la suppression"
        message="Cette action est irréversible. Voulez-vous vraiment supprimer ce signalement ?"
        :buttons="deleteAlertButtons"
        @didDismiss="showDeleteAlert = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
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
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonChip,
  IonSpinner,
  IonProgressBar,
  IonAlert,
  toastController,
} from '@ionic/vue';
import {
  createOutline,
  trashOutline,
  alertCircleOutline,
  locationOutline,
  calendarOutline,
  personOutline,
  navigateOutline,
  openOutline,
  expandOutline,
  cashOutline,
  businessOutline,
  statsChartOutline,
  buildOutline,
} from 'ionicons/icons';
import L from 'leaflet';

import { useAuthStore } from '@/stores/authStore';
import { useSignalementStore } from '@/stores/signalementStore';
import { 
  STATUT_LABELS, 
  PRIORITE_LABELS, 
  TYPE_TRAVAUX_LABELS,
  STATUT_COLORS 
} from '@/utils/constants';
import { 
  formatDateTime, 
  formatBudget, 
  canEditSignalement, 
  canDeleteSignalement,
  getMarkerColor 
} from '@/utils/helpers';

// Router
const router = useRouter();
const route = useRoute();

// Stores
const authStore = useAuthStore();
const signalementStore = useSignalementStore();

// Refs
const detailMapRef = ref(null);
const detailMap = ref(null);
const showDeleteAlert = ref(false);

// Computed
const loading = computed(() => signalementStore.loading);
const error = computed(() => signalementStore.error);
const signalement = computed(() => signalementStore.currentSignalement);
const currentUser = computed(() => authStore.user);

const canEdit = computed(() => canEditSignalement(signalement.value, currentUser.value));
const canDelete = computed(() => canDeleteSignalement(signalement.value, currentUser.value));

const deleteAlertButtons = [
  { text: 'Annuler', role: 'cancel' },
  { text: 'Supprimer', role: 'destructive', handler: deleteSignalement },
];

// Lifecycle
onMounted(async () => {
  await loadSignalement();
});

onUnmounted(() => {
  if (detailMap.value) {
    detailMap.value.remove();
  }
});

// Methods
async function loadSignalement() {
  const id = parseInt(route.params.id);
  
  try {
    await signalementStore.fetchById(id);
    await nextTick();
    initMap();
  } catch (err) {
    console.error('Erreur chargement signalement:', err);
  }
}

function initMap() {
  if (!detailMapRef.value || !signalement.value) return;
  
  const { latitude, longitude, statut } = signalement.value;
  
  if (!latitude || !longitude) return;

  // Créer la carte
  detailMap.value = L.map(detailMapRef.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView([latitude, longitude], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMap.value);

  // Ajouter le marqueur
  const color = getMarkerColor(statut);
  const icon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-marker" style="background-color: ${color}"></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  L.marker([latitude, longitude], { icon }).addTo(detailMap.value);
}

function goToEdit() {
  router.push({ name: 'EditSignalement', params: { id: signalement.value.id } });
}

function confirmDelete() {
  showDeleteAlert.value = true;
}

async function deleteSignalement() {
  try {
    await signalementStore.remove(signalement.value.id);
    
    const toast = await toastController.create({
      message: 'Signalement supprimé',
      duration: 2000,
      color: 'success',
    });
    await toast.present();

    router.replace('/tabs/signalements');
  } catch (err) {
    const toast = await toastController.create({
      message: 'Erreur lors de la suppression',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  }
}

function openInMaps() {
  if (!signalement.value) return;
  
  const { latitude, longitude } = signalement.value;
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(url, '_blank');
}
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
  padding: 24px;
}

.error-container ion-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.detail-map {
  height: 200px;
  width: 100%;
}

.detail-content {
  padding: 16px;
}

.badges-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

h1 {
  margin: 0 0 12px;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
}

ion-chip {
  margin-bottom: 16px;
}

ion-card {
  margin: 0 0 16px;
  border-radius: 12px;
}

ion-card-subtitle {
  font-weight: 600;
  text-transform: none;
}

ion-list-header {
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

ion-item ion-label p {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

ion-item ion-label h3 {
  font-weight: 600;
  font-size: 0.95rem;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.progress-container ion-progress-bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
}

.progress-container span {
  font-weight: 600;
  min-width: 40px;
}

.actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 24px;
}

.actions ion-button {
  --border-radius: 12px;
}

/* Custom marker */
:deep(.custom-marker) {
  width: 36px;
  height: 36px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 3px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
</style>
