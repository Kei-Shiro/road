<template>
  <div class="signalement-detail">
    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else-if="signalement" class="detail-card">
      <div class="header">
        <h1>{{ signalement.titre }}</h1>
        <span :class="['status', signalement.statut.toLowerCase()]">
          {{ formatStatus(signalement.statut) }}
        </span>
      </div>

      <p v-if="signalement.description" class="description">
        {{ signalement.description }}
      </p>

      <div class="info-grid">
        <div class="info-item">
          <strong>📍 Position</strong>
          <p>{{ signalement.latitude?.toFixed(6) }}, {{ signalement.longitude?.toFixed(6) }}</p>
        </div>

        <div class="info-item" v-if="signalement.adresse">
          <strong>🏠 Adresse</strong>
          <p>{{ signalement.adresse }}</p>
        </div>

        <div class="info-item" v-if="signalement.entrepriseResponsable">
          <strong>🏢 Entreprise</strong>
          <p>{{ signalement.entrepriseResponsable }}</p>
        </div>

        <div class="info-item" v-if="signalement.surfaceImpactee">
          <strong>📐 Surface</strong>
          <p>{{ formatNumber(signalement.surfaceImpactee) }} m²</p>
        </div>

        <div class="info-item" v-if="signalement.budget">
          <strong>💰 Budget</strong>
          <p>{{ formatCurrency(signalement.budget) }} Ar</p>
        </div>

        <div class="info-item" v-if="signalement.type">
          <strong>🔧 Type</strong>
          <p>{{ signalement.type }}</p>
        </div>

        <div class="info-item" v-if="signalement.priorite">
          <strong>⚡ Priorité</strong>
          <p>{{ signalement.priorite }}</p>
        </div>

        <div class="info-item">
          <strong>📈 Avancement</strong>
          <div class="progress-bar">
            <div
              class="progress"
              :style="{ width: (signalement.pourcentageAvancement || 0) + '%' }"
            ></div>
          </div>
          <p>{{ signalement.pourcentageAvancement || 0 }}%</p>
        </div>
      </div>

      <div class="dates">
        <div v-if="signalement.dateDebut">
          <strong>Début:</strong> {{ formatDate(signalement.dateDebut) }}
        </div>
        <div v-if="signalement.dateFinPrevue">
          <strong>Fin prévue:</strong> {{ formatDate(signalement.dateFinPrevue) }}
        </div>
        <div v-if="signalement.dateFinReelle">
          <strong>Fin réelle:</strong> {{ formatDate(signalement.dateFinReelle) }}
        </div>
      </div>

      <div class="meta">
        <p v-if="signalement.createdBy">
          Créé par: {{ signalement.createdBy.prenom }} {{ signalement.createdBy.nom }}
        </p>
        <p>Créé le: {{ formatDateTime(signalement.createdAt) }}</p>
        <p v-if="signalement.updatedAt">
          Modifié le: {{ formatDateTime(signalement.updatedAt) }}
        </p>
      </div>

      <div class="actions">
        <router-link to="/map" class="btn secondary">
          ← Retour à la carte
        </router-link>
        <router-link
          v-if="canEdit"
          :to="`/signalement/edit/${signalement.id}`"
          class="btn primary"
        >
          ✏️ Modifier
        </router-link>
        <button
          v-if="isManager"
          @click="handleDelete"
          class="btn danger"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>

    <div v-else class="not-found">
      Signalement non trouvé
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSignalementStore } from '@/stores/signalement'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const signalementStore = useSignalementStore()

const signalement = computed(() => signalementStore.currentSignalement)
const loading = computed(() => signalementStore.loading)
const isManager = computed(() => authStore.isManager)
const canEdit = computed(() => authStore.isAuthenticated)

const formatStatus = (status) => {
  const map = {
    'NOUVEAU': 'Nouveau',
    'EN_COURS': 'En cours',
    'TERMINE': 'Terminé'
  }
  return map[status] || status
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatCurrency = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleDelete = async () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
    try {
      await signalementStore.deleteSignalement(signalement.value.id)
      router.push('/map')
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }
}

onMounted(async () => {
  await signalementStore.fetchSignalementById(route.params.id)
})
</script>

<style scoped>
.signalement-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.detail-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.header h1 {
  margin: 0;
  color: #333;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status.nouveau {
  background: #e7f5f8;
  color: #17a2b8;
}

.status.en_cours {
  background: #fff8e1;
  color: #856404;
}

.status.termine {
  background: #e8f5e9;
  color: #28a745;
}

.description {
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item strong {
  display: block;
  color: #666;
  margin-bottom: 0.25rem;
}

.info-item p {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.progress-bar {
  background: #e9ecef;
  border-radius: 10px;
  height: 10px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.progress {
  background: #28a745;
  height: 100%;
  transition: width 0.3s;
}

.dates {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.meta {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.meta p {
  margin: 0.25rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.danger {
  background: #dc3545;
  color: white;
}

.not-found {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>

