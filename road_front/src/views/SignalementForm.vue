<template>
  <div class="signalement-form">
    <div class="form-card">
      <h1>{{ isEditing ? 'Modifier le signalement' : 'Nouveau signalement' }}</h1>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="titre">Titre *</label>
          <input
            type="text"
            id="titre"
            v-model="form.titre"
            required
            placeholder="Titre du signalement"
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="Description des travaux"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="latitude">Latitude *</label>
            <input
              type="number"
              id="latitude"
              v-model.number="form.latitude"
              required
              step="any"
            />
          </div>

          <div class="form-group">
            <label for="longitude">Longitude *</label>
            <input
              type="number"
              id="longitude"
              v-model.number="form.longitude"
              required
              step="any"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="adresse">Adresse</label>
          <input
            type="text"
            id="adresse"
            v-model="form.adresse"
            placeholder="Adresse ou quartier"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="statut">Statut</label>
            <select id="statut" v-model="form.statut">
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>

          <div class="form-group">
            <label for="type">Type</label>
            <select id="type" v-model="form.type">
              <option value="">-- Sélectionner --</option>
              <option value="REPARATION">Réparation</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="ENTRETIEN">Entretien</option>
              <option value="EXTENSION">Extension</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="priorite">Priorité</label>
            <select id="priorite" v-model="form.priorite">
              <option value="">-- Sélectionner --</option>
              <option value="BASSE">Basse</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div class="form-group">
            <label for="pourcentageAvancement">Avancement (%)</label>
            <input
              type="number"
              id="pourcentageAvancement"
              v-model.number="form.pourcentageAvancement"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="entrepriseResponsable">Entreprise responsable</label>
          <input
            type="text"
            id="entrepriseResponsable"
            v-model="form.entrepriseResponsable"
            placeholder="Nom de l'entreprise"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="surfaceImpactee">Surface impactée (m²)</label>
            <input
              type="number"
              id="surfaceImpactee"
              v-model.number="form.surfaceImpactee"
              min="0"
              step="0.01"
            />
          </div>

          <div class="form-group">
            <label for="budget">Budget (Ar)</label>
            <input
              type="number"
              id="budget"
              v-model.number="form.budget"
              min="0"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="dateDebut">Date de début</label>
            <input
              type="date"
              id="dateDebut"
              v-model="form.dateDebut"
            />
          </div>

          <div class="form-group">
            <label for="dateFinPrevue">Date de fin prévue</label>
            <input
              type="date"
              id="dateFinPrevue"
              v-model="form.dateFinPrevue"
            />
          </div>
        </div>

        <div class="form-group" v-if="isEditing && form.statut === 'TERMINE'">
          <label for="dateFinReelle">Date de fin réelle</label>
          <input
            type="date"
            id="dateFinReelle"
            v-model="form.dateFinReelle"
          />
        </div>

        <div class="form-actions">
          <router-link to="/map" class="btn secondary">Annuler</router-link>
          <button type="submit" class="btn primary" :disabled="loading">
            {{ loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSignalementStore } from '@/stores/signalement'

const route = useRoute()
const router = useRouter()
const signalementStore = useSignalementStore()

const isEditing = computed(() => !!route.params.id)
const loading = computed(() => signalementStore.loading)
const error = ref('')

const form = ref({
  titre: '',
  description: '',
  latitude: null,
  longitude: null,
  adresse: '',
  statut: 'NOUVEAU',
  type: '',
  priorite: '',
  pourcentageAvancement: 0,
  entrepriseResponsable: '',
  surfaceImpactee: null,
  budget: null,
  dateDebut: '',
  dateFinPrevue: '',
  dateFinReelle: ''
})

const handleSubmit = async () => {
  error.value = ''

  try {
    if (isEditing.value) {
      await signalementStore.updateSignalement(route.params.id, form.value)
    } else {
      await signalementStore.createSignalement(form.value)
    }
    router.push('/map')
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement'
  }
}

onMounted(async () => {
  // Récupérer les coordonnées depuis la query string
  if (route.query.lat && route.query.lng) {
    form.value.latitude = parseFloat(route.query.lat)
    form.value.longitude = parseFloat(route.query.lng)
  }

  // Mode édition: charger le signalement existant
  if (isEditing.value) {
    await signalementStore.fetchSignalementById(route.params.id)
    const sig = signalementStore.currentSignalement
    if (sig) {
      form.value = {
        titre: sig.titre || '',
        description: sig.description || '',
        latitude: sig.latitude,
        longitude: sig.longitude,
        adresse: sig.adresse || '',
        statut: sig.statut || 'NOUVEAU',
        type: sig.type || '',
        priorite: sig.priorite || '',
        pourcentageAvancement: sig.pourcentageAvancement || 0,
        entrepriseResponsable: sig.entrepriseResponsable || '',
        surfaceImpactee: sig.surfaceImpactee,
        budget: sig.budget,
        dateDebut: sig.dateDebut || '',
        dateFinPrevue: sig.dateFinPrevue || '',
        dateFinReelle: sig.dateFinReelle || '',
        syncId: sig.syncId
      }
    }
  }
})
</script>

<style scoped>
.signalement-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.form-card h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.error-message {
  background: #ffe6e6;
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn.primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover {
  background: #545b62;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

