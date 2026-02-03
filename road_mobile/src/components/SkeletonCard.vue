<!--
  Composant loading skeleton pour les cartes
  Affiche un placeholder animé pendant le chargement
-->
<template>
  <ion-card v-for="i in count" :key="i" class="skeleton-card">
    <ion-card-header>
      <div class="skeleton-badges">
        <ion-skeleton-text animated style="width: 70px; height: 22px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width: 60px; height: 22px;"></ion-skeleton-text>
      </div>
      <ion-skeleton-text animated style="width: 80%; height: 20px; margin-top: 8px;"></ion-skeleton-text>
      <ion-skeleton-text animated style="width: 60%; height: 16px; margin-top: 8px;"></ion-skeleton-text>
    </ion-card-header>

    <ion-card-content>
      <ion-skeleton-text animated style="width: 100%; height: 14px;"></ion-skeleton-text>
      <ion-skeleton-text animated style="width: 90%; height: 14px; margin-top: 6px;"></ion-skeleton-text>
      <ion-skeleton-text animated style="width: 70%; height: 14px; margin-top: 6px;"></ion-skeleton-text>

      <div class="skeleton-meta">
        <ion-skeleton-text animated style="width: 80px; height: 14px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width: 60px; height: 14px;"></ion-skeleton-text>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup>
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonSkeletonText,
} from '@ionic/vue';

// Props
defineProps({
  count: {
    type: Number,
    default: 3,
  },
});
</script>

<style scoped>
.skeleton-card {
  margin: 12px;
  border-radius: 16px;
}

.skeleton-badges {
  display: flex;
  gap: 8px;
}

.skeleton-badges ion-skeleton-text {
  border-radius: 12px;
}

.skeleton-meta {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}
</style>
