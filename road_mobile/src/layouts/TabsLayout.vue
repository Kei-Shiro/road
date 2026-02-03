<!--
  Layout avec barre d'onglets en bas
  Navigation principale de l'application mobile
-->
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <!-- Barre d'onglets inférieure -->
      <ion-tab-bar slot="bottom">
        <!-- Onglet Carte -->
        <ion-tab-button tab="map" href="/tabs/map">
          <ion-icon :icon="mapOutline" aria-hidden="true"></ion-icon>
          <ion-label>Carte</ion-label>
        </ion-tab-button>

        <!-- Onglet Liste des signalements -->
        <ion-tab-button tab="signalements" href="/tabs/signalements">
          <ion-icon :icon="listOutline" aria-hidden="true"></ion-icon>
          <ion-label>Signalements</ion-label>
          <!-- Badge pour les nouveaux signalements -->
          <ion-badge v-if="newSignalementsCount > 0" color="danger">
            {{ newSignalementsCount > 99 ? '99+' : newSignalementsCount }}
          </ion-badge>
        </ion-tab-button>

        <!-- Onglet Statistiques -->
        <ion-tab-button tab="stats" href="/tabs/stats">
          <ion-icon :icon="statsChartOutline" aria-hidden="true"></ion-icon>
          <ion-label>Stats</ion-label>
        </ion-tab-button>

        <!-- Onglet Profil / Connexion -->
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="isAuthenticated ? personCircle : personCircleOutline" aria-hidden="true"></ion-icon>
          <ion-label>{{ isAuthenticated ? 'Profil' : 'Connexion' }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { computed } from 'vue';
import {
  IonPage,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonRouterOutlet,
} from '@ionic/vue';
import {
  mapOutline,
  listOutline,
  statsChartOutline,
  personCircleOutline,
  personCircle,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/authStore';
import { useSignalementStore } from '@/stores/signalementStore';

// Stores
const authStore = useAuthStore();
const signalementStore = useSignalementStore();

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);
const newSignalementsCount = computed(() => signalementStore.countByStatut.nouveau);
</script>

<style scoped>
ion-tab-bar {
  --background: var(--ion-tab-bar-background);
  border-top: 1px solid var(--ion-color-step-100, rgba(0, 0, 0, 0.1));
}

ion-tab-button {
  --color: var(--ion-color-medium);
  --color-selected: var(--ion-color-primary);
}

ion-tab-button.tab-selected ion-icon {
  transform: scale(1.1);
}

ion-badge {
  position: absolute;
  top: 4px;
  right: 12px;
  font-size: 0.65rem;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
}

/* Animation de transition douce */
ion-tab-button ion-icon {
  transition: transform 0.2s ease;
}
</style>
