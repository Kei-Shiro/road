<!--
  Composant card de signalement réutilisable
  Affiche les informations principales d'un signalement
-->
<template>
  <ion-card :button="true" @click="handleClick">
    <ion-card-header>
      <div class="card-header-row">
        <span class="status-badge" :class="signalement.statut?.toLowerCase()">
          {{ STATUT_LABELS[signalement.statut] }}
        </span>
        <span class="priority-badge" :class="signalement.priorite?.toLowerCase()">
          <ion-icon :icon="getPriorityIcon(signalement.priorite)"></ion-icon>
          {{ PRIORITE_LABELS[signalement.priorite] }}
        </span>
      </div>
      <ion-card-title>{{ signalement.titre }}</ion-card-title>
      <ion-card-subtitle>
        <ion-icon :icon="locationOutline"></ion-icon>
        {{ signalement.adresse || 'Adresse non renseignée' }}
      </ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <!-- Description tronquée -->
      <p v-if="signalement.description" class="description">
        {{ truncateText(signalement.description, 120) }}
      </p>

      <!-- Métadonnées -->
      <div class="card-meta">
        <span class="meta-item">
          <ion-icon :icon="calendarOutline"></ion-icon>
          {{ formatRelativeDate(signalement.createdAt) }}
        </span>
        <span v-if="signalement.createdBy" class="meta-item">
          <ion-icon :icon="personOutline"></ion-icon>
          {{ signalement.createdBy.prenom }}
        </span>
        <span class="meta-item type-tag">
          <ion-icon :icon="buildOutline"></ion-icon>
          {{ TYPE_TRAVAUX_LABELS[signalement.type] || signalement.type }}
        </span>
      </div>

      <!-- Progression si disponible -->
      <div v-if="signalement.pourcentageAvancement" class="progress-row">
        <ion-progress-bar :value="signalement.pourcentageAvancement / 100"></ion-progress-bar>
        <span>{{ signalement.pourcentageAvancement }}%</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup>
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonProgressBar,
} from '@ionic/vue';
import {
  locationOutline,
  calendarOutline,
  personOutline,
  buildOutline,
  chevronDownOutline,
  removeOutline,
  chevronUpOutline,
  flameOutline,
} from 'ionicons/icons';

import { STATUT_LABELS, PRIORITE_LABELS, TYPE_TRAVAUX_LABELS } from '@/utils/constants';
import { formatRelativeDate, truncateText } from '@/utils/helpers';

// Props
const props = defineProps({
  signalement: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['click']);

// Methods
function handleClick() {
  emit('click', props.signalement);
}

function getPriorityIcon(priorite) {
  const icons = {
    BASSE: chevronDownOutline,
    MOYENNE: removeOutline,
    HAUTE: chevronUpOutline,
    URGENTE: flameOutline,
  };
  return icons[priorite] || removeOutline;
}
</script>

<style scoped>
ion-card {
  margin: 12px;
  border-radius: 16px;
}

.card-header-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

ion-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
}

ion-card-subtitle {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.85rem;
}

.description {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.meta-item ion-icon {
  font-size: 14px;
}

.type-tag {
  padding: 2px 8px;
  background: var(--ion-color-step-100);
  border-radius: 4px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.progress-row ion-progress-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
}

.progress-row span {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ion-color-primary);
}
</style>
