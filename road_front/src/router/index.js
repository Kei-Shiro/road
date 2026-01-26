import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import des vues
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MapView from '@/views/MapView.vue'
import ProfileView from '@/views/ProfileView.vue'
import ManagerDashboard from '@/views/ManagerDashboard.vue'
import SignalementForm from '@/views/SignalementForm.vue'
import SignalementDetail from '@/views/SignalementDetail.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { guest: true }
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView,
        meta: { guest: true }
    },
    {
        path: '/map',
        name: 'map',
        component: MapView
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
        meta: { requiresAuth: true }
    },
    {
        path: '/signalement/:id',
        name: 'signalement-detail',
        component: SignalementDetail
    },
    {
        path: '/signalement/new',
        name: 'signalement-new',
        component: SignalementForm,
        meta: { requiresAuth: true }
    },
    {
        path: '/signalement/edit/:id',
        name: 'signalement-edit',
        component: SignalementForm,
        meta: { requiresAuth: true }
    },
    {
        path: '/manager',
        name: 'manager',
        component: ManagerDashboard,
        meta: { requiresAuth: true, requiresManager: true }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // Route nécessitant une authentification
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    // Route nécessitant le rôle MANAGER
    if (to.meta.requiresManager && authStore.user?.role !== 'MANAGER') {
        return next({ name: 'home' })
    }

    // Route réservée aux visiteurs (login/register)
    if (to.meta.guest && authStore.isAuthenticated) {
        return next({ name: 'home' })
    }

    next()
})

export default router
