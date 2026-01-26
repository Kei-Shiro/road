<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import ModalLogin from './ModalLogin.vue'
import ModalRegister from './ModalRegister.vue'

const authStore = useAuthStore()
const router = useRouter()

const showLoginModal = ref(false)
const showRegisterModal = ref(false)

const logout = () => {
    authStore.logout()
    router.push('/')
}
</script>

<template>
    <header class="header">
        <div class="header-content">
            <router-link to="/" class="logo">
                <i class="fas fa-road"></i>
                <span>TravauxTana</span>
            </router-link>

            <nav class="nav-menu">
                <router-link to="/" class="nav-link" active-class="active">
                    <i class="fas fa-map-marked-alt"></i> Carte
                </router-link>
                <router-link to="/dashboard" class="nav-link" active-class="active">
                    <i class="fas fa-chart-bar"></i> Tableau de bord
                </router-link>
                <router-link v-if="authStore.isManager" to="/admin" class="nav-link" active-class="active">
                    <i class="fas fa-cogs"></i> Administration
                </router-link>
            </nav>

            <div class="user-actions" v-if="!authStore.isAuthenticated">
                <button class="btn btn-outline" @click="showLoginModal = true">
                    <i class="fas fa-sign-in-alt"></i> Connexion
                </button>
                <button class="btn btn-primary" @click="showRegisterModal = true">
                    <i class="fas fa-user-plus"></i> Inscription
                </button>
            </div>

            <div class="user-menu" v-else>
                <div class="user-info">
                    <div class="user-avatar"><i class="fas fa-user"></i></div>
                    <div class="user-details">
                        <span class="user-name">{{ authStore.currentUser?.name }}</span>
                        <span class="user-role">{{ authStore.isManager ? 'Manager' : 'Utilisateur' }}</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm" @click="logout">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </button>
            </div>
        </div>

        <ModalLogin v-if="showLoginModal" @close="showLoginModal = false" />
        <ModalRegister v-if="showRegisterModal" @close="showRegisterModal = false" />
    </header>
</template>

<style scoped>
.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    border-bottom: 1px solid var(--border-color);
    z-index: 1000;
    box-shadow: var(--shadow-sm);
}

.header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
    text-decoration: none;
}

.logo i { font-size: 1.75rem; }

.nav-menu {
    display: flex;
    gap: 8px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
}

.nav-link:hover, .nav-link.active {
    color: var(--primary-color);
    background: rgba(37, 99, 235, 0.1);
}

.user-actions {
    display: flex;
    gap: 12px;
}

.user-menu {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.user-details {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9rem;
}

.user-role {
    font-size: 0.7rem;
    color: var(--text-light);
}
</style>

