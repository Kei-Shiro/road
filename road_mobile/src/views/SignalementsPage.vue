<!--
  Page de liste des signalements
  Affiche les signalements sous forme de cards avec swipe actions
-->
<template>
  <ion-page>
    <!-- Header -->
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showFilterModal = true">
            <ion-icon slot="icon-only" :icon="filterOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Segment pour filtrer par statut -->
      <ion-toolbar>
        <ion-segment :value="filterStatut" @ionChange="onFilterChange($event)">
          <ion-segment-button value="all">
            <ion-label>Tous</ion-label>
          </ion-segment-button>
          <ion-segment-button value="NOUVEAU">
            <ion-label>Nouveaux</ion-label>
          </ion-segment-button>
          <ion-segment-button value="EN_COURS">
            <ion-label>En cours</ion-label>
          </ion-segment-button>
          <ion-segment-button value="TERMINE">
            <ion-label>Terminés</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content
          pulling-icon="chevron-down"
          pulling-text="Tirer pour rafraîchir"
          refreshing-spinner="crescent"
          refreshing-text="Chargement..."
        ></ion-refresher-content>
      </ion-refresher>

      <!-- Toggle mes signalements uniquement -->
      <ion-item v-if="isAuthenticated" lines="none" class="my-only-toggle">
        <ion-icon :icon="personOutline" slot="start" color="primary"></ion-icon>
        <ion-label>Mes signalements uniquement</ion-label>
        <ion-toggle 
          :checked="filterMyOnly" 
          @ionChange="toggleMyOnly($event)"
        ></ion-toggle>
      </ion-item>

      <!-- Compteur de résultats -->
      <div class="results-count">
        <ion-chip color="medium" outline>
          {{ displayedSignalements.length }} signalement(s)
        </ion-chip>
      </div>

      <!-- État vide -->
      <div v-if="!loading && displayedSignalements.length === 0" class="empty-state">
        <ion-icon :icon="documentTextOutline"></ion-icon>
        <h3>Aucun signalement</h3>
        <p>{{ emptyMessage }}</p>
        <ion-button v-if="canCreateSignalement" @click="goToCreate">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Créer un signalement
        </ion-button>
      </div>

      <!-- Liste des signalements -->
      <ion-list v-else>
        <ion-item-sliding v-for="sig in displayedSignalements" :key="sig.id">
          <!-- Card du signalement -->
          <ion-item button @click="goToDetail(sig.id)" detail>
            <ion-thumbnail slot="start" class="status-indicator">
              <div class="status-dot" :style="{ backgroundColor: getStatusColor(sig.statut) }">
                <ion-icon :icon="getStatusIcon(sig.statut)"></ion-icon>
              </div>
            </ion-thumbnail>

            <ion-label>
              <h2>{{ sig.titre }}</h2>
              <p class="address">
                <ion-icon :icon="locationOutline"></ion-icon>
                {{ sig.adresse || 'Adresse non renseignée' }}
              </p>
              <p class="meta">
                <span class="date">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  {{ formatRelativeDate(sig.createdAt) }}
                </span>
                <span class="priority-badge" :class="sig.priorite?.toLowerCase()">
                  {{ PRIORITE_LABELS[sig.priorite] || sig.priorite }}
                </span>
              </p>
            </ion-label>

            <ion-badge slot="end" :color="getStatusBadgeColor(sig.statut)">
              {{ STATUT_LABELS[sig.statut] }}
            </ion-badge>
          </ion-item>

          <!-- Swipe actions -->
          <ion-item-options side="end" v-if="canEdit(sig) || canDelete(sig)">
            <ion-item-option v-if="canEdit(sig)" color="warning" @click="goToEdit(sig.id)">
              <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
            </ion-item-option>
            <ion-item-option v-if="canDelete(sig)" color="danger" @click="confirmDelete(sig)">
              <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Chargement infini -->
      <ion-infinite-scroll 
        v-if="hasMore" 
        @ionInfinite="loadMore($event)" 
        :disabled="loading"
      >
        <ion-infinite-scroll-content
          loading-spinner="bubbles"
          loading-text="Chargement..."
        ></ion-infinite-scroll-content>
      </ion-infinite-scroll>

      <!-- Skeleton loading -->
      <ion-list v-if="loading && signalements.length === 0">
        <ion-item v-for="i in 5" :key="i">
          <ion-thumbnail slot="start">
            <ion-skeleton-text animated style="width: 48px; height: 48px; border-radius: 50%;"></ion-skeleton-text>
          </ion-thumbnail>
          <ion-label>
            <h2><ion-skeleton-text animated style="width: 70%;"></ion-skeleton-text></h2>
            <p><ion-skeleton-text animated style="width: 50%;"></ion-skeleton-text></p>
            <p><ion-skeleton-text animated style="width: 40%;"></ion-skeleton-text></p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- FAB de création -->
      <ion-fab v-if="canCreateSignalement" slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="goToCreate">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Modal de filtre -->
    <FilterModal 
      v-model:isOpen="showFilterModal" 
      @apply="applyFilters"
    />

    <!-- Alert de confirmation de suppression -->
    <ion-alert
      :is-open="showDeleteAlert"
      header="Confirmer la suppression"
      :message="`Voulez-vous vraiment supprimer le signalement '${signalementToDelete?.titre}' ?`"
      :buttons="deleteAlertButtons"
      @didDismiss="showDeleteAlert = false"
    ></ion-alert>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonThumbnail,
  IonBadge,
  IonChip,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSkeletonText,
  IonFab,
  IonFabButton,
  IonAlert,
  toastController,
} from '@ionic/vue';
import {
  filterOutline,
  addOutline,
  createOutline,
  trashOutline,
  documentTextOutline,
  locationOutline,
  calendarOutline,
  personOutline,
  alertCircleOutline,
  constructOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';

import { useAuthStore } from '@/stores/authStore';
import { useSignalementStore } from '@/stores/signalementStore';
import { STATUT_LABELS, STATUT_COLORS, PRIORITE_LABELS } from '@/utils/constants';
import { formatRelativeDate, canEditSignalement, canDeleteSignalement } from '@/utils/helpers';
import FilterModal from '@/components/FilterModal.vue';

// Router
const router = useRouter();

// Stores
const authStore = useAuthStore();
const signalementStore = useSignalementStore();

// Refs
const showFilterModal = ref(false);
const showDeleteAlert = ref(false);
const signalementToDelete = ref(null);

// Computed
const loading = computed(() => signalementStore.loading);
const signalements = computed(() => signalementStore.signalements);
const filteredSignalements = computed(() => signalementStore.filteredSignalements);
const filterStatut = computed(() => signalementStore.filterStatut);
const filterMyOnly = computed(() => signalementStore.filterMyOnly);
const hasMore = computed(() => signalementStore.pagination.hasMore);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const canCreateSignalement = computed(() => authStore.canCreateSignalement);
const currentUser = computed(() => authStore.user);

const displayedSignalements = computed(() => {
  let result = filteredSignalements.value;
  
  if (filterMyOnly.value && currentUser.value) {
    result = result.filter(s => s.createdBy?.id === currentUser.value.id);
  }
  
  return result;
});

const emptyMessage = computed(() => {
  if (filterMyOnly.value) {
    return 'Vous n\'avez pas encore créé de signalement.';
  }
  if (filterStatut.value !== 'all') {
    return `Aucun signalement avec le statut "${STATUT_LABELS[filterStatut.value]}".`;
  }
  return 'Aucun signalement trouvé.';
});

const deleteAlertButtons = [
  {
    text: 'Annuler',
    role: 'cancel',
  },
  {
    text: 'Supprimer',
    role: 'destructive',
    handler: () => deleteSignalement(),
  },
];

// Lifecycle
onMounted(async () => {
  if (signalements.value.length === 0) {
    await signalementStore.fetchAll();
  }
});

// Methods
function onFilterChange(event) {
  signalementStore.setFilterStatut(event.detail.value);
}

function toggleMyOnly(event) {
  signalementStore.setFilterMyOnly(event.detail.checked);
}

async function handleRefresh(event) {
  await signalementStore.refresh();
  event.target.complete();
}

async function loadMore(event) {
  await signalementStore.loadMore();
  event.target.complete();
}

function applyFilters(filters) {
  signalementStore.setFilterStatut(filters.statut);
  signalementStore.setSortBy(filters.sortBy);
  showFilterModal.value = false;
}

function goToDetail(id) {
  router.push({ name: 'SignalementDetail', params: { id } });
}

function goToCreate() {
  router.push({ name: 'CreateSignalement' });
}

function goToEdit(id) {
  router.push({ name: 'EditSignalement', params: { id } });
}

function canEdit(sig) {
  return canEditSignalement(sig, currentUser.value);
}

function canDelete(sig) {
  return canDeleteSignalement(sig, currentUser.value);
}

function confirmDelete(sig) {
  signalementToDelete.value = sig;
  showDeleteAlert.value = true;
}

async function deleteSignalement() {
  if (!signalementToDelete.value) return;

  try {
    await signalementStore.remove(signalementToDelete.value.id);
    
    const toast = await toastController.create({
      message: 'Signalement supprimé avec succès',
      duration: 2000,
      color: 'success',
    });
    await toast.present();
  } catch (error) {
    const toast = await toastController.create({
      message: 'Erreur lors de la suppression',
      duration: 3000,
      color: 'danger',
    });
    await toast.present();
  }
  
  signalementToDelete.value = null;
}

function getStatusColor(statut) {
  return STATUT_COLORS[statut] || '#6b7280';
}

function getStatusIcon(statut) {
  const icons = {
    NOUVEAU: alertCircleOutline,
    EN_COURS: constructOutline,
    TERMINE: checkmarkCircleOutline,
    ANNULE: closeCircleOutline,
  };
  return icons[statut] || alertCircleOutline;
}

function getStatusBadgeColor(statut) {
  const colors = {
    NOUVEAU: 'danger',
    EN_COURS: 'warning',
    TERMINE: 'success',
    ANNULE: 'medium',
  };
  return colors[statut] || 'medium';
}
</script>

<style scoped>
.my-only-toggle {
  --background: var(--ion-color-step-50);
  margin: 8px 12px;
  border-radius: 12px;
}

.results-count {
  padding: 8px 16px;
  display: flex;
  justify-content: flex-end;
}

ion-item-sliding ion-item {
  --padding-start: 8px;
  --inner-padding-end: 8px;
}

.status-indicator {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot ion-icon {
  color: white;
  font-size: 20px;
}

ion-item h2 {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
}

.address {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.address ion-icon {
  font-size: 14px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
}

.date ion-icon {
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  height: 60vh;
}

.empty-state ion-icon {
  font-size: 80px;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: var(--ion-text-color);
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 24px;
  color: var(--ion-color-medium);
}

ion-fab {
  margin-bottom: 16px;
}
</style>
