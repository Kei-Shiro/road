<template>
  <div class="manager-dashboard">
    <h1>🎛️ Tableau de bord Manager</h1>

    <!-- Statut de synchronisation -->
    <div class="sync-bar">
      <div class="sync-status">
        <span :class="['indicator', isOnline ? 'online' : 'offline']"></span>
        {{ isOnline ? 'En ligne' : 'Hors ligne' }}
        <span v-if="unsyncedCount > 0" class="unsync-badge">
          {{ unsyncedCount }} en attente
        </span>
      </div>
      <button @click="handleSync" class="sync-btn" :disabled="!isOnline || syncing">
        {{ syncing ? 'Synchronisation...' : '🔄 Synchroniser' }}
      </button>
    </div>

    <!-- Statistiques -->
    <section class="stats-section" v-if="stats">
      <h2>📊 Statistiques</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.totalSignalements }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card nouveau">
          <span class="stat-value">{{ stats.nouveaux }}</span>
          <span class="stat-label">Nouveaux</span>
        </div>
        <div class="stat-card en-cours">
          <span class="stat-value">{{ stats.enCours }}</span>
          <span class="stat-label">En cours</span>
        </div>
        <div class="stat-card termine">
          <span class="stat-value">{{ stats.termines }}</span>
          <span class="stat-label">Terminés</span>
        </div>
      </div>

      <div class="stats-summary">
        <div class="summary-item">
          <strong>Surface totale:</strong>
          {{ formatNumber(stats.surfaceTotale) }} m²
        </div>
        <div class="summary-item">
          <strong>Budget total:</strong>
          {{ formatCurrency(stats.budgetTotal) }} Ar
        </div>
        <div class="summary-item">
          <strong>Avancement moyen:</strong>
          {{ stats.tauxAvancementMoyen?.toFixed(1) }}%
        </div>
      </div>
    </section>

    <!-- Tableau des signalements -->
    <section class="table-section">
      <div class="table-header">
        <h2>📋 Signalements</h2>
        <div class="table-filters">
          <select v-model="filterStatut" @change="applyFilters">
            <option value="">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
          </select>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Rechercher..."
            @input="applyFilters"
          />
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Statut</th>
              <th>Entreprise</th>
              <th>Avancement</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sig in filteredSignalements" :key="sig.id">
              <td>
                <strong>{{ sig.titre }}</strong>
                <br>
                <small class="text-muted">{{ sig.adresse || 'Pas d\'adresse' }}</small>
              </td>
              <td>
                <select
                  :value="sig.statut"
                  @change="updateStatus(sig.id, $event.target.value)"
                  :class="['status-select', sig.statut.toLowerCase()]"
                >
                  <option value="NOUVEAU">Nouveau</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                </select>
              </td>
              <td>{{ sig.entrepriseResponsable || '-' }}</td>
              <td>
                <div class="progress-cell">
                  <div class="mini-progress">
                    <div
                      class="mini-bar"
                      :style="{ width: (sig.pourcentageAvancement || 0) + '%' }"
                    ></div>
                  </div>
                  <span>{{ sig.pourcentageAvancement || 0 }}%</span>
                </div>
              </td>
              <td>{{ sig.budget ? formatCurrency(sig.budget) + ' Ar' : '-' }}</td>
              <td class="actions-cell">
                <router-link :to="`/signalement/${sig.id}`" class="action-btn view">
                  👁️
                </router-link>
                <router-link :to="`/signalement/edit/${sig.id}`" class="action-btn edit">
                  ✏️
                </router-link>
                <button @click="handleDelete(sig.id)" class="action-btn delete">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredSignalements.length === 0" class="no-results">
        Aucun signalement trouvé
      </div>
    </section>

    <!-- Section entreprises -->
    <section class="entreprises-section" v-if="stats?.parEntreprise?.length > 0">
      <h2>🏢 Par entreprise</h2>
      <div class="entreprise-list">
        <div
          v-for="ent in stats.parEntreprise"
          :key="ent.nom"
          class="entreprise-item"
        >
          <span class="entreprise-name">{{ ent.nom }}</span>
          <span class="entreprise-count">{{ ent.count }} projet(s)</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSignalementStore } from '@/stores/signalement'

const signalementStore = useSignalementStore()

const filterStatut = ref('')
const searchQuery = ref('')
const syncing = ref(false)

const signalements = computed(() => signalementStore.signalements)
const stats = computed(() => signalementStore.stats)
const isOnline = computed(() => signalementStore.isOnline)
const unsyncedCount = computed(() => signalementStore.unsyncedCount)

const filteredSignalements = computed(() => {
  let result = [...signalements.value]

  if (filterStatut.value) {
    result = result.filter(s => s.statut === filterStatut.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.titre?.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query) ||
      s.entrepriseResponsable?.toLowerCase().includes(query) ||
      s.adresse?.toLowerCase().includes(query)
    )
  }

  return result
})

const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatCurrency = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}

const applyFilters = () => {
  // Les filtres sont réactifs via computed
}

const updateStatus = async (id, newStatus) => {
  try {
    await signalementStore.updateSignalement(id, { statut: newStatus })
    await signalementStore.fetchStats()
  } catch (err) {
    alert('Erreur lors de la mise à jour du statut')
  }
}

const handleDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
    try {
      await signalementStore.deleteSignalement(id)
      await signalementStore.fetchStats()
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }
}

const handleSync = async () => {
  syncing.value = true
  try {
    await signalementStore.syncWithServer()
    await signalementStore.fetchStats()
    alert('Synchronisation réussie !')
  } catch (err) {
    alert('Erreur lors de la synchronisation')
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  await signalementStore.fetchSignalements()
  await signalementStore.fetchStats()
})
</script>

<style scoped>
.manager-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.manager-dashboard h1 {
  margin-bottom: 1.5rem;
  color: #333;
}

.sync-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.indicator.online {
  background: #28a745;
}

.indicator.offline {
  background: #dc3545;
}

.unsync-badge {
  background: #ffc107;
  color: #333;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.sync-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.sync-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.stats-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stats-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
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

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stats-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.summary-item {
  color: #555;
}

.table-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-header h2 {
  margin: 0;
  color: #333;
}

.table-filters {
  display: flex;
  gap: 0.5rem;
}

.table-filters select,
.table-filters input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.text-muted {
  color: #999;
}

.status-select {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 0.85rem;
}

.status-select.nouveau {
  background: #e7f5f8;
}

.status-select.en_cours {
  background: #fff8e1;
}

.status-select.termine {
  background: #e8f5e9;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini-progress {
  width: 60px;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.mini-bar {
  height: 100%;
  background: #28a745;
}

.actions-cell {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
}

.action-btn.view {
  background: #e7f5f8;
}

.action-btn.edit {
  background: #fff8e1;
}

.action-btn.delete {
  background: #ffe6e6;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.entreprises-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.entreprises-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.entreprise-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.entreprise-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.entreprise-name {
  font-weight: 500;
}

.entreprise-count {
  color: #666;
}
</style>

