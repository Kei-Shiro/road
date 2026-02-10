<!--
  Page de statistiques
  Affiche les statistiques globales des signalements
-->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Statistiques</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refresh">
            <ion-icon :icon="refreshOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Chargement -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des statistiques...</p>
      </div>

      <template v-else>
        <!-- Total des signalements -->
        <ion-card class="total-card">
          <ion-card-content>
            <div class="total-content">
              <div class="total-number">{{ stats.total }}</div>
              <div class="total-label">Signalements au total</div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Tableau récapitulatif (cahier des charges) -->
        <ion-card class="summary-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="analyticsOutline"></ion-icon>
              Récapitulatif
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">{{ stats.total }}</div>
                <div class="summary-label">Nb de points</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">{{ formatSurface(stats.totalSurface) }}</div>
                <div class="summary-label">Surface totale</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">{{ avancementGlobal.toFixed(0) }}%</div>
                <div class="summary-label">Avancement</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">{{ formatBudgetCompact(stats.totalBudget) }}</div>
                <div class="summary-label">Budget total</div>
              </div>
            </div>
            <!-- Barre de progression -->
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: `${avancementGlobal}%` }"></div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Répartition par statut -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="pieChartOutline"></ion-icon>
              Répartition par statut
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="status-bars">
              <div 
                v-for="item in statusData" 
                :key="item.statut" 
                class="status-bar-item"
              >
                <div class="status-bar-header">
                  <span class="status-bar-label">
                    <span class="status-dot" :style="{ backgroundColor: item.color }"></span>
                    {{ item.label }}
                  </span>
                  <span class="status-bar-count">{{ item.count }}</span>
                </div>
                <div class="status-bar-track">
                  <div 
                    class="status-bar-fill" 
                    :style="{ 
                      width: `${item.percentage}%`, 
                      backgroundColor: item.color 
                    }"
                  ></div>
                </div>
                <div class="status-bar-percentage">{{ item.percentage.toFixed(1) }}%</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Indicateurs clés -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="analyticsOutline"></ion-icon>
              Indicateurs clés
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-icon :icon="flashOutline" slot="start" color="warning"></ion-icon>
                <ion-label>
                  <h3>Taux de résolution</h3>
                  <p>Signalements terminés</p>
                </ion-label>
                <ion-badge slot="end" color="success">
                  {{ resolutionRate.toFixed(1) }}%
                </ion-badge>
              </ion-item>

              <ion-item>
                <ion-icon :icon="timeOutline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>En attente</h3>
                  <p>Signalements nouveaux</p>
                </ion-label>
                <ion-badge slot="end" color="danger">
                  {{ stats.nouveau }}
                </ion-badge>
              </ion-item>

              <ion-item>
                <ion-icon :icon="constructOutline" slot="start" color="warning"></ion-icon>
                <ion-label>
                  <h3>En cours de traitement</h3>
                  <p>Travaux en progression</p>
                </ion-label>
                <ion-badge slot="end" color="warning">
                  {{ stats.enCours }}
                </ion-badge>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Dernières activités -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="pulseOutline"></ion-icon>
              Activité récente
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list v-if="recentSignalements.length > 0">
              <ion-item 
                v-for="sig in recentSignalements" 
                :key="sig.id" 
                button 
                @click="goToDetail(sig.id)"
              >
                <ion-badge 
                  slot="start" 
                  :color="getStatusColor(sig.statut)"
                  class="status-badge-small"
                >
                  {{ sig.statut.charAt(0) }}
                </ion-badge>
                <ion-label>
                  <h3>{{ truncateText(sig.titre, 30) }}</h3>
                  <p>{{ formatRelativeDate(sig.createdAt) }}</p>
                </ion-label>
                <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
              </ion-item>
            </ion-list>
            <div v-else class="empty-recent">
              <p>Aucune activité récente</p>
            </div>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from 'vue';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import {
  refreshOutline,
  pieChartOutline,
  analyticsOutline,
  flashOutline,
  timeOutline,
  constructOutline,
  pulseOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

import { useSignalementStore } from '@/stores/signalementStore';
import { STATUT_LABELS, STATUT_COLORS } from '@/utils/constants';
import { formatRelativeDate, truncateText, calculateStats } from '@/utils/helpers';

// Router
const router = useRouter();

// Store
const signalementStore = useSignalementStore();

// Computed
const loading = computed(() => signalementStore.loading);
const signalements = computed(() => signalementStore.signalements);

const stats = computed(() => calculateStats(signalements.value));

const statusData = computed(() => {
  const total = stats.value.total || 1;
  return [
    {
      statut: 'NOUVEAU',
      label: STATUT_LABELS.NOUVEAU,
      count: stats.value.nouveau,
      percentage: (stats.value.nouveau / total) * 100,
      color: STATUT_COLORS.NOUVEAU,
    },
    {
      statut: 'EN_COURS',
      label: STATUT_LABELS.EN_COURS,
      count: stats.value.enCours,
      percentage: (stats.value.enCours / total) * 100,
      color: STATUT_COLORS.EN_COURS,
    },
    {
      statut: 'TERMINE',
      label: STATUT_LABELS.TERMINE,
      count: stats.value.termine,
      percentage: (stats.value.termine / total) * 100,
      color: STATUT_COLORS.TERMINE,
    },
    {
      statut: 'ANNULE',
      label: STATUT_LABELS.ANNULE,
      count: stats.value.annule,
      percentage: (stats.value.annule / total) * 100,
      color: STATUT_COLORS.ANNULE,
    },
  ];
});

const resolutionRate = computed(() => {
  if (stats.value.total === 0) return 0;
  return (stats.value.termine / stats.value.total) * 100;
});

// Avancement global basé sur: NOUVEAU=0%, EN_COURS=50%, TERMINE=100%
const avancementGlobal = computed(() => {
  if (stats.value.total === 0) return 0;
  const total = stats.value.nouveau * 0 + stats.value.enCours * 50 + stats.value.termine * 100;
  return total / stats.value.total;
});

const recentSignalements = computed(() => {
  return [...signalements.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
});

// Lifecycle
onMounted(async () => {
  if (signalements.value.length === 0) {
    await signalementStore.fetchAll();
  }
});

// Methods
async function refresh() {
  await signalementStore.refresh();
}

async function handleRefresh(event) {
  await signalementStore.refresh();
  event.target.complete();
}

function goToDetail(id) {
  router.push({ name: 'SignalementDetail', params: { id } });
}

function getStatusColor(statut) {
  switch (statut) {
    case 'NOUVEAU': return 'danger';
    case 'EN_COURS': return 'warning';
    case 'TERMINE': return 'success';
    case 'ANNULE': return 'medium';
    default: return 'medium';
  }
}

function formatSurface(surface) {
  if (!surface) return '0 m²';
  if (surface >= 1000) {
    return `${(surface / 1000).toFixed(1)}k m²`;
  }
  return `${surface.toLocaleString()} m²`;
}

function formatBudgetCompact(budget) {
  if (!budget) return '0 Ar';
  if (budget >= 1000000000) {
    return `${(budget / 1000000000).toFixed(1)} Mrd Ar`;
  }
  if (budget >= 1000000) {
    return `${(budget / 1000000).toFixed(1)} M Ar`;
  }
  if (budget >= 1000) {
    return `${(budget / 1000).toFixed(0)}k Ar`;
  }
  return `${budget.toLocaleString()} Ar`;
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

/* Total card */
.total-card {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  color: white;
  margin: 16px;
  border-radius: 20px;
}

.total-content {
  text-align: center;
  padding: 24px 0;
}

.total-number {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
}

.total-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-top: 8px;
}

/* Summary card - Tableau récapitulatif */
.summary-card {
  margin: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background: var(--ion-color-step-50);
  border-radius: 12px;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.summary-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-top: 4px;
}

.progress-bar-container {
  height: 12px;
  background: var(--ion-color-step-100);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-success) 0%, var(--ion-color-success-shade) 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
}

/* Status bars */
ion-card {
  margin: 16px;
  border-radius: 16px;
}

ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-bar-count {
  font-weight: 700;
}

.status-bar-track {
  height: 8px;
  background: var(--ion-color-step-100);
  border-radius: 4px;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.status-bar-percentage {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  text-align: right;
}

/* Key indicators */
ion-list ion-item h3 {
  font-weight: 600;
  font-size: 0.95rem;
}

ion-list ion-item p {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

/* Recent activity */
.status-badge-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.empty-recent {
  text-align: center;
  padding: 24px;
  color: var(--ion-color-medium);
}
</style>
