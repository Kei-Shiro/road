/**
 * Configuration du routeur Vue avec Ionic
 * Définit les routes et la navigation de l'application
 */
import { createRouter, createWebHistory } from '@ionic/vue-router';

// Layouts
import TabsLayout from '@/layouts/TabsLayout.vue';

// Pages
const routes = [
  {
    path: '/',
    redirect: '/tabs/map',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: {
      title: 'Connexion',
      requiresGuest: true,
    },
  },
  {
    path: '/tabs/',
    component: TabsLayout,
    children: [
      {
        path: '',
        redirect: '/tabs/map',
      },
      {
        path: 'map',
        name: 'Map',
        component: () => import('@/views/MapPage.vue'),
        meta: {
          title: 'Carte',
          icon: 'map',
        },
      },
      {
        path: 'signalements',
        name: 'Signalements',
        component: () => import('@/views/SignalementsPage.vue'),
        meta: {
          title: 'Signalements',
          icon: 'list',
        },
      },
      {
        path: 'stats',
        name: 'Stats',
        component: () => import('@/views/StatsPage.vue'),
        meta: {
          title: 'Statistiques',
          icon: 'stats-chart',
        },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfilePage.vue'),
        meta: {
          title: 'Profil',
          icon: 'person',
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/signalement/:id',
    name: 'SignalementDetail',
    component: () => import('@/views/SignalementDetailPage.vue'),
    meta: {
      title: 'Détail du signalement',
    },
  },
  {
    path: '/create-signalement',
    name: 'CreateSignalement',
    component: () => import('@/views/CreateSignalementPage.vue'),
    meta: {
      title: 'Nouveau signalement',
      requiresAuth: true,
    },
  },
  {
    path: '/edit-signalement/:id',
    name: 'EditSignalement',
    component: () => import('@/views/EditSignalementPage.vue'),
    meta: {
      title: 'Modifier le signalement',
      requiresAuth: true,
    },
  },
  // Route 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tabs/map',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Garde de navigation pour l'authentification
router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('@/stores/authStore');
  const authStore = useAuthStore();
  
  // Attendre l'initialisation de l'auth
  if (!authStore.initialized) {
    await authStore.initAuth();
  }
  
  // Routes réservées aux invités (ex: login)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/tabs/map');
    return;
  }
  
  // Routes nécessitant une authentification
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }
  
  next();
});

export default router;
