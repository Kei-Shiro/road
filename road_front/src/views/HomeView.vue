<template>
  <div class="home-view">
    <header class="hero">
      <p>Application de signalisation des travaux routiers - Antananarivo</p>
      <h1>🚧 Road Signaling</h1>
    </header>

    <section class="stats-section" v-if="stats">
      <h2>Statistiques en temps réel</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Signalements</span>
          <span class="stat-value">{{ stats.totalSignalements }}</span>
        </div>

        <div class="stat-card nouveau">
          <span class="stat-label">Nouveaux</span>
          <span class="stat-value">{{ stats.nouveaux }}</span>
        </div>

        <div class="stat-card en-cours">
          <span class="stat-label">En cours</span>
          <span class="stat-value">{{ stats.enCours }}</span>
        </div>

        <div class="stat-card termine">
          <span class="stat-label">Terminés</span>
          <span class="stat-value">{{ stats.termines }}</span>
        </div>
      </div>

      <div class="stats-details">
        <div class="detail-item">
          <strong>Budget total:</strong>
          {{ formatCurrency(stats.budgetTotal) }} Ar
        </div>

        <div class="detail-item">
          <strong>Surface totale impactée:</strong>
          {{ formatNumber(stats.surfaceTotale) }} m²
        </div>

        <div class="detail-item">
          <strong>Taux d'avancement moyen:</strong>
          {{ stats.tauxAvancementMoyen?.toFixed(1) }}%
        </div>
      </div>
    </section>

    <section class="actions-section">
      <router-link v-if="isAuthenticated" to="/signalement/new" class="action-btn secondary">
        ➕ Nouveau signalement
      </router-link>

      <router-link to="/map" class="action-btn primary">
        🗺️ Voir la carte
      </router-link>

      <router-link v-if="!isAuthenticated" to="/login" class="action-btn secondary">
        🔐 Se connecter
      </router-link>
    </section>

    <section class="online-status">
      <span :class="['status-indicator', isOnline ? 'online' : 'offline']"></span>
      {{ isOnline ? 'En ligne' : 'Hors ligne' }}
      <span v-if="unsyncedCount > 0" class="unsynced-badge">
        {{ unsyncedCount }} non synchronisé(s)
      </span>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSignalementStore } from '@/stores/signalement'

const authStore = useAuthStore()
const signalementStore = useSignalementStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isOnline = computed(() => signalementStore.isOnline)
const unsyncedCount = computed(() => signalementStore.unsyncedCount)
const stats = computed(() => signalementStore.stats)

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatCurrency = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

onMounted(async () => {
  await signalementStore.fetchStats()
  signalementStore.setupOnlineListener()
})
</script>

<style scoped>
.home-view {
  padding: 2rem;
  margin: 0 auto;
  max-width: 1200px;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  color: #333;
}

.hero p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stats-section {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.stats-section h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card.nouveau {
  border-left: 4px solid #17a2b8;
}

.stat-card.en-cours {
  border-left: 4px solid #ffc107;
}

.stat-card.termine {
  border-left: 4px solid #28a745;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  display: block;
  font-size: 2rem;
  color: #333;
  font-weight: bold;
}

.stats-details {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.detail-item {
  color: #555;
}

.actions-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.online-status {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-indicator.online {
  background: #28a745;
}

.status-indicator.offline {
  background: #dc3545;
}

.unsynced-badge {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #ffc107;
  color: #333;
  font-size: 0.8rem;
}
</style>
