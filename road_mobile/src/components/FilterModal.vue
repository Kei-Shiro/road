<!--
  Composant modal de filtres
  Permet de filtrer et trier les signalements
-->
<template>
  <ion-modal :is-open="isOpen" @did-dismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="close">Annuler</ion-button>
        </ion-buttons>
        <ion-title>Filtres</ion-title>
        <ion-buttons slot="end">
          <ion-button strong @click="apply">Appliquer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Filtre par statut -->
      <div class="filter-section">
        <h4>
          <ion-icon :icon="funnelOutline"></ion-icon>
          Statut
        </h4>
        <ion-segment :value="localFilters.statut" @ionChange="updateStatut($event)">
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="NOUVEAU">
            <ion-label>Nouveaux</ion-label>
          </ion-segment-button>
          <ion-segment-button value="EN_COURS">
            <ion-label>En cours</ion-label>
          </ion-segment-button>
        </ion-segment>
        <ion-segment :value="localFilters.statut" @ionChange="updateStatut($event)" class="segment-bottom">
          <ion-segment-button value="TERMINE">
            <ion-label>Terminés</ion-label>
          </ion-segment-button>
          <ion-segment-button value="ANNULE">
            <ion-label>Annulés</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Tri -->
      <div class="filter-section">
        <h4>
          <ion-icon :icon="swapVerticalOutline"></ion-icon>
          Trier par
        </h4>
        <ion-list>
          <ion-radio-group :value="localFilters.sortBy" @ionChange="updateSortBy($event)">
            <ion-item v-for="option in sortOptions" :key="option.value">
              <ion-label>{{ option.label }}</ion-label>
              <ion-radio slot="end" :value="option.value"></ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </div>

      <!-- Mes signalements uniquement -->
      <div class="filter-section" v-if="isAuthenticated">
        <h4>
          <ion-icon :icon="personOutline"></ion-icon>
          Mes signalements
        </h4>
        <ion-item lines="none">
          <ion-label>Afficher uniquement mes signalements</ion-label>
          <ion-toggle :checked="localFilters.myOnly" @ionChange="updateMyOnly($event)"></ion-toggle>
        </ion-item>
      </div>

      <!-- Bouton de réinitialisation -->
      <ion-button expand="block" fill="outline" color="medium" @click="reset" class="reset-btn">
        <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
        Réinitialiser les filtres
      </ion-button>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonToggle,
  IonIcon,
} from '@ionic/vue';
import {
  funnelOutline,
  swapVerticalOutline,
  personOutline,
  refreshOutline,
} from 'ionicons/icons';

import { useAuthStore } from '@/stores/authStore';
import { SORT_OPTIONS } from '@/utils/constants';

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:isOpen', 'apply']);

// Store
const authStore = useAuthStore();

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Local state
const localFilters = ref({
  statut: 'all',
  sortBy: 'date_desc',
  myOnly: false,
});

const sortOptions = SORT_OPTIONS;

// Default filters
const defaultFilters = {
  statut: 'all',
  sortBy: 'date_desc',
  myOnly: false,
};

// Watch pour réinitialiser quand la modal s'ouvre
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    // Optionnel : charger les filtres actuels du store
  }
});

// Methods
function updateStatut(event) {
  localFilters.value.statut = event.detail.value;
}

function updateSortBy(event) {
  localFilters.value.sortBy = event.detail.value;
}

function updateMyOnly(event) {
  localFilters.value.myOnly = event.detail.checked;
}

function close() {
  emit('update:isOpen', false);
}

function apply() {
  emit('apply', { ...localFilters.value });
  close();
}

function reset() {
  localFilters.value = { ...defaultFilters };
}
</script>

<style scoped>
.filter-section {
  margin-bottom: 24px;
}

.filter-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ion-color-medium);
}

ion-segment {
  margin-bottom: 4px;
}

.segment-bottom {
  margin-bottom: 0;
}

ion-list {
  background: transparent;
  padding: 0;
}

ion-list ion-item {
  --background: var(--ion-color-step-50);
  --border-radius: 8px;
  margin-bottom: 4px;
}

.reset-btn {
  margin-top: 24px;
  --border-radius: 12px;
}
</style>
