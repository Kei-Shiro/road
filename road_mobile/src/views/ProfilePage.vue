<!--
  Page de profil utilisateur
  Affiche les informations et permet la déconnexion
-->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profil</ion-title>
        <ion-buttons slot="end" v-if="isAuthenticated">
          <ion-button @click="handleLogout" color="danger">
            <ion-icon :icon="logOutOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Utilisateur connecté -->
      <template v-if="isAuthenticated">
        <!-- Header du profil -->
        <div class="profile-header">
          <div class="avatar">
            <ion-icon :icon="personCircle"></ion-icon>
          </div>
          <h1>{{ userName }}</h1>
          <ion-badge :color="getRoleColor(userRole)">{{ getRoleLabel(userRole) }}</ion-badge>
          <p class="email">{{ user?.email }}</p>
        </div>

        <!-- Statistiques personnelles -->
        <ion-card class="stats-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="statsChartOutline"></ion-icon>
              Mes statistiques
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ myStats.total }}</span>
                <span class="stat-label">Signalements</span>
              </div>
              <div class="stat-item">
                <span class="stat-value text-danger">{{ myStats.nouveau }}</span>
                <span class="stat-label">Nouveaux</span>
              </div>
              <div class="stat-item">
                <span class="stat-value text-warning">{{ myStats.enCours }}</span>
                <span class="stat-label">En cours</span>
              </div>
              <div class="stat-item">
                <span class="stat-value text-success">{{ myStats.termine }}</span>
                <span class="stat-label">Terminés</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Actions rapides -->
        <ion-list>
          <ion-list-header>
            <ion-label>Actions rapides</ion-label>
          </ion-list-header>

          <ion-item button @click="goToMySignalements" detail>
            <ion-icon :icon="listOutline" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Mes signalements</h3>
              <p>Voir tous mes signalements créés</p>
            </ion-label>
          </ion-item>

          <ion-item v-if="canCreateSignalement" button @click="goToCreate" detail>
            <ion-icon :icon="addCircleOutline" slot="start" color="success"></ion-icon>
            <ion-label>
              <h3>Nouveau signalement</h3>
              <p>Créer un nouveau signalement</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Paramètres -->
        <ion-list>
          <ion-list-header>
            <ion-label>Paramètres</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon :icon="moonOutline" slot="start" color="medium"></ion-icon>
            <ion-label>Mode sombre</ion-label>
            <ion-toggle :checked="isDarkMode" @ionChange="toggleDarkMode"></ion-toggle>
          </ion-item>

          <ion-item>
            <ion-icon :icon="notificationsOutline" slot="start" color="medium"></ion-icon>
            <ion-label>Notifications</ion-label>
            <ion-toggle :checked="notificationsEnabled" @ionChange="toggleNotifications"></ion-toggle>
          </ion-item>
        </ion-list>

        <!-- À propos -->
        <ion-list>
          <ion-list-header>
            <ion-label>À propos</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-icon :icon="informationCircleOutline" slot="start" color="medium"></ion-icon>
            <ion-label>
              <h3>Road Signalement</h3>
              <p>Version 1.0.0</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <!-- Bouton de déconnexion -->
        <div class="logout-section">
          <ion-button expand="block" color="danger" fill="outline" @click="handleLogout">
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            Se déconnecter
          </ion-button>
        </div>
      </template>

      <!-- Utilisateur non connecté -->
      <template v-else>
        <div class="guest-content">
          <div class="guest-icon">
            <ion-icon :icon="personCircleOutline"></ion-icon>
          </div>
          <h2>Non connecté</h2>
          <p>Connectez-vous pour accéder à toutes les fonctionnalités.</p>
          
          <ion-button expand="block" @click="goToLogin" class="login-btn">
            <ion-icon :icon="logInOutline" slot="start"></ion-icon>
            Se connecter
          </ion-button>

          <div class="guest-features">
            <h4>Avantages de la connexion :</h4>
            <ion-item lines="none">
              <ion-icon :icon="checkmarkCircleOutline" slot="start" color="success"></ion-icon>
              <ion-label>Créer des signalements</ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="checkmarkCircleOutline" slot="start" color="success"></ion-icon>
              <ion-label>Suivre vos signalements</ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="checkmarkCircleOutline" slot="start" color="success"></ion-icon>
              <ion-label>Recevoir des notifications</ion-label>
            </ion-item>
          </div>
        </div>
      </template>
    </ion-content>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonBadge,
  IonToggle,
  alertController,
  toastController,
} from '@ionic/vue';
import {
  personCircle,
  personCircleOutline,
  logOutOutline,
  logInOutline,
  statsChartOutline,
  listOutline,
  addCircleOutline,
  moonOutline,
  notificationsOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

import { useAuthStore } from '@/stores/authStore';
import { useSignalementStore } from '@/stores/signalementStore';
import { ROLES_LABELS } from '@/utils/constants';

// Router
const router = useRouter();

// Stores
const authStore = useAuthStore();
const signalementStore = useSignalementStore();

// Refs
const isDarkMode = ref(false);
const notificationsEnabled = ref(true);

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);
const userName = computed(() => authStore.userName);
const userRole = computed(() => authStore.userRole);
const canCreateSignalement = computed(() => authStore.canCreateSignalement);

const myStats = computed(() => {
  if (!user.value) return { total: 0, nouveau: 0, enCours: 0, termine: 0 };
  
  const mySignalements = signalementStore.signalements.filter(
    s => s.createdBy?.id === user.value.id
  );
  
  return {
    total: mySignalements.length,
    nouveau: mySignalements.filter(s => s.statut === 'NOUVEAU').length,
    enCours: mySignalements.filter(s => s.statut === 'EN_COURS').length,
    termine: mySignalements.filter(s => s.statut === 'TERMINE').length,
  };
});

// Lifecycle
onMounted(() => {
  // Détecter le mode sombre
  isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
});

// Methods
function getRoleColor(role) {
  const colors = {
    ADMIN: 'danger',
    MANAGER: 'warning',
    VISITEUR: 'primary',
  };
  return colors[role] || 'medium';
}

function getRoleLabel(role) {
  return ROLES_LABELS[role] || role;
}

function goToMySignalements() {
  signalementStore.setFilterMyOnly(true);
  router.push('/tabs/signalements');
}

function goToCreate() {
  router.push({ name: 'CreateSignalement' });
}

function goToLogin() {
  router.push('/login');
}

function toggleDarkMode(event) {
  isDarkMode.value = event.detail.checked;
  document.body.classList.toggle('dark', isDarkMode.value);
}

function toggleNotifications(event) {
  notificationsEnabled.value = event.detail.checked;
  // TODO: Implémenter la gestion des notifications
}

async function handleLogout() {
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Voulez-vous vraiment vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
      },
      {
        text: 'Déconnexion',
        handler: async () => {
          await authStore.logout();
          
          const toast = await toastController.create({
            message: 'Vous avez été déconnecté',
            duration: 2000,
            color: 'medium',
          });
          await toast.present();

          router.replace('/tabs/map');
        },
      },
    ],
  });

  await alert.present();
}
</script>

<style scoped>
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  color: white;
}

.avatar {
  margin-bottom: 16px;
}

.avatar ion-icon {
  font-size: 100px;
  opacity: 0.9;
}

.profile-header h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

.profile-header ion-badge {
  margin-bottom: 8px;
}

.profile-header .email {
  margin: 0;
  opacity: 0.85;
  font-size: 0.95rem;
}

.stats-card {
  margin: -24px 16px 16px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stats-card ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
  padding: 8px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ion-text-color);
}

.stat-value.text-danger { color: var(--ion-color-danger); }
.stat-value.text-warning { color: var(--ion-color-warning); }
.stat-value.text-success { color: var(--ion-color-success); }

.stat-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

ion-list-header {
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.logout-section {
  padding: 24px 16px 48px;
}

/* Guest content */
.guest-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.guest-icon ion-icon {
  font-size: 120px;
  color: var(--ion-color-medium);
  opacity: 0.5;
}

.guest-content h2 {
  margin: 16px 0 8px;
  font-weight: 700;
}

.guest-content > p {
  margin: 0 0 24px;
  color: var(--ion-color-medium);
}

.login-btn {
  width: 100%;
  max-width: 300px;
  --border-radius: 12px;
  height: 52px;
  font-weight: 600;
}

.guest-features {
  margin-top: 32px;
  width: 100%;
  max-width: 300px;
  text-align: left;
}

.guest-features h4 {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.guest-features ion-item {
  --padding-start: 0;
  --min-height: 40px;
}
</style>
