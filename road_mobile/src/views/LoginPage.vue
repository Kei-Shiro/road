<!--
  Page de connexion
  Authentification via Firebase et backend
-->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/map" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Logo et titre -->
      <div class="login-header">
        <div class="logo-container">
          <ion-icon :icon="carSportOutline" class="app-logo"></ion-icon>
        </div>
        <h1>Road Signalement</h1>
        <p>Connectez-vous pour signaler des problèmes routiers</p>
      </div>

      <!-- Formulaire de connexion -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Message d'erreur -->
        <ion-item v-if="error" lines="none" class="error-item">
          <ion-icon :icon="alertCircleOutline" color="danger" slot="start"></ion-icon>
          <ion-label color="danger">{{ error }}</ion-label>
        </ion-item>

        <!-- Email -->
        <ion-item class="input-item">
          <ion-icon :icon="mailOutline" slot="start" color="medium"></ion-icon>
          <ion-input
            v-model="email"
            type="email"
            placeholder="Adresse email"
            autocomplete="email"
            required
          ></ion-input>
        </ion-item>

        <!-- Mot de passe -->
        <ion-item class="input-item">
          <ion-icon :icon="lockClosedOutline" slot="start" color="medium"></ion-icon>
          <ion-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mot de passe"
            autocomplete="current-password"
            required
          ></ion-input>
          <ion-button fill="clear" slot="end" @click="showPassword = !showPassword">
            <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-item>

        <!-- Bouton de connexion -->
        <ion-button
          expand="block"
          type="submit"
          class="login-button"
          :disabled="loading || !isFormValid"
        >
          <ion-spinner v-if="loading" name="crescent" slot="start"></ion-spinner>
          <span v-else>Se connecter</span>
        </ion-button>
      </form>

      <!-- Note d'inscription -->
      <div class="register-note">
        <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
        <p>
          L'inscription est uniquement possible via l'application web par un manager.
          Contactez votre administrateur pour obtenir un compte.
        </p>
      </div>

      <!-- Mode visiteur -->
      <div class="visitor-section">
        <ion-button fill="outline" expand="block" @click="continueAsVisitor">
          <ion-icon :icon="eyeOutline" slot="start"></ion-icon>
          Continuer en tant que visiteur
        </ion-button>
        <p class="visitor-note">
          En mode visiteur, vous pouvez consulter la carte et les signalements, 
          mais vous ne pourrez pas en créer.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
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
  IonIcon,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import {
  carSportOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  alertCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';

import { useAuthStore } from '@/stores/authStore';

// Router
const router = useRouter();

// Store
const authStore = useAuthStore();

// Form data
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');

// Computed
const loading = computed(() => authStore.loading);
const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.length >= 4;
});

// Methods
async function handleLogin() {
  error.value = '';

  if (!isFormValid.value) {
    error.value = 'Veuillez remplir tous les champs.';
    return;
  }

  try {
    await authStore.login(email.value, password.value);
    
    const toast = await toastController.create({
      message: `Bienvenue, ${authStore.userName} !`,
      duration: 2000,
      color: 'success',
    });
    await toast.present();

    router.replace('/tabs/map');
  } catch (err) {
    console.error('Login error:', err);
    
    if (err.response?.status === 401) {
      error.value = 'Email ou mot de passe incorrect.';
    } else if (err.response?.status === 403) {
      error.value = 'Compte désactivé. Contactez l\'administrateur.';
    } else if (err.code === 'ERR_NETWORK') {
      error.value = 'Erreur de connexion. Vérifiez votre réseau.';
    } else {
      error.value = err.response?.data?.message || 'Erreur de connexion.';
    }
  }
}

function continueAsVisitor() {
  router.replace('/tabs/map');
}
</script>

<style scoped>
ion-content {
  --background: var(--ion-background-color);
}

.login-header {
  text-align: center;
  padding: 32px 0 24px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.app-logo {
  font-size: 80px;
  color: var(--ion-color-primary);
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-header h1 {
  margin: 0 0 8px;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--ion-text-color);
}

.login-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.95rem;
}

.login-form {
  margin-top: 24px;
}

.error-item {
  --background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}

.input-item {
  --background: var(--ion-color-step-50);
  --border-radius: 12px;
  --padding-start: 16px;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.input-item ion-input {
  --padding-start: 8px;
}

.login-button {
  margin-top: 24px;
  --border-radius: 12px;
  height: 52px;
  font-weight: 600;
  font-size: 1.1rem;
}

.register-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 32px;
  padding: 16px;
  background: var(--ion-color-step-50);
  border-radius: 12px;
  border-left: 4px solid var(--ion-color-primary);
}

.register-note ion-icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.register-note p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.visitor-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--ion-color-step-100);
}

.visitor-section ion-button {
  --border-radius: 12px;
  height: 48px;
}

.visitor-note {
  text-align: center;
  margin-top: 12px;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}
</style>
