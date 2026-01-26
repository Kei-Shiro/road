<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isManager = computed(() => authStore.isManager)
const user = computed(() => authStore.user)

onMounted(async () => {
  await authStore.init()
})
</script>

<template>
  <div id="app">
    <!-- Navigation -->
    <nav class="navbar">
      <div class="nav-brand">
        <router-link to="/">🚧 Road Signaling</router-link>
      </div>

      <div class="nav-links">
        <router-link to="/">Accueil</router-link>
        <router-link to="/map">Carte</router-link>
        <router-link v-if="isManager" to="/manager">Manager</router-link>
      </div>

      <div class="nav-auth">
        <template v-if="isAuthenticated">
          <router-link to="/profile" class="user-link">
            👤 {{ user?.prenom || 'Profil' }}
          </router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="btn-login">Connexion</router-link>
          <router-link to="/register" class="btn-register">Inscription</router-link>
        </template>
      </div>
    </nav>

    <!-- Contenu principal -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>© 2026 Road Signaling - Antananarivo</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-brand a {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: #555;
  text-decoration: none;
  padding: 0.5rem;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #007bff;
}

.nav-auth {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.user-link {
  color: #333;
  text-decoration: none;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 20px;
}

.btn-login,
.btn-register {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
}

.btn-login {
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-register {
  background: #007bff;
  color: white;
}

.main-content {
  flex: 1;
}

.footer {
  text-align: center;
  padding: 1rem;
  background: #333;
  color: white;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
