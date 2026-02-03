<!--
  Composant état vide réutilisable
  Affiche un message quand il n'y a pas de données
-->
<template>
  <div class="empty-state">
    <div class="empty-icon">
      <ion-icon :icon="icon" :color="color"></ion-icon>
    </div>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <slot name="action"></slot>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue';
import { documentTextOutline } from 'ionicons/icons';

// Props
defineProps({
  icon: {
    type: String,
    default: documentTextOutline,
  },
  title: {
    type: String,
    default: 'Aucun élément',
  },
  message: {
    type: String,
    default: 'Il n\'y a rien à afficher pour le moment.',
  },
  color: {
    type: String,
    default: 'medium',
  },
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  min-height: 300px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-icon ion-icon {
  font-size: 80px;
  opacity: 0.5;
}

h3 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-text-color);
}

p {
  margin: 0 0 24px;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
  max-width: 280px;
  line-height: 1.5;
}
</style>
