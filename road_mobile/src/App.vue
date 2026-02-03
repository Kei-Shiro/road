<!--
  Composant racine de l'application
  Gère l'initialisation et le conteneur principal Ionic
-->
<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';

// Initialiser l'authentification au démarrage
onMounted(async () => {
  const authStore = useAuthStore();
  await authStore.initAuth();
});
</script>

<style>
/* Styles de base pour l'application */
ion-app {
  --ion-safe-area-top: env(safe-area-inset-top);
  --ion-safe-area-bottom: env(safe-area-inset-bottom);
  --ion-safe-area-left: env(safe-area-inset-left);
  --ion-safe-area-right: env(safe-area-inset-right);
}
</style>
