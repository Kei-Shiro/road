<template>
  <div class="profile-view">
    <div class="profile-card">
      <h1>Mon Profil</h1>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
      </div>

      <div class="user-info">
        <p><strong>Rôle:</strong> {{ formatRole(user?.role) }}</p>
        <p><strong>Inscrit le:</strong> {{ formatDate(user?.createdAt) }}</p>
        <p><strong>Dernière connexion:</strong> {{ formatDate(user?.lastLogin) }}</p>
      </div>

      <form @submit.prevent="handleUpdate">
        <div class="form-row">
          <div class="form-group">
            <label for="prenom">Prénom</label>
            <input v-model="form.prenom" id="prenom" type="text" />
          </div>

          <div class="form-group">
            <label for="nom">Nom</label>
            <input v-model="form.nom" id="nom" type="text" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="email">Email</label>
            <input v-model="form.email" id="email" type="email" />
          </div>

          <div class="form-group">
            <label for="telephone">Téléphone</label>
            <input v-model="form.telephone" id="telephone" type="tel" />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
          <input v-model="form.password" id="password" type="password" placeholder="Nouveau mot de passe" />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Mise à jour...' : 'Mettre à jour' }}
        </button>
      </form>

      <button @click="handleLogout" class="logout-btn">
        🚪 Se déconnecter
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)
const loading = computed(() => authStore.loading)

const error = ref('')
const success = ref('')

const form = ref({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  password: ''
})

const roles = {
  MANAGER: 'Manager',
  UTILISATEUR: 'Utilisateur',
  VISITEUR: 'Visiteur'
}

const formatRole = (role) => {
  return roles[role] || role
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  if (user.value) {
    form.value.prenom = user.value.prenom || ''
    form.value.nom = user.value.nom || ''
    form.value.email = user.value.email || ''
    form.value.telephone = user.value.telephone || ''
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const handleUpdate = async () => {
  success.value = ''
  error.value = ''

  const updateData = {}
  if (form.value.prenom) updateData.prenom = form.value.prenom
  if (form.value.nom) updateData.nom = form.value.nom
  if (form.value.email) updateData.email = form.value.email
  if (form.value.telephone) updateData.telephone = form.value.telephone
  if (form.value.password) updateData.password = form.value.password

  try {
    await authStore.updateProfile(updateData)
    form.value.password = ''
    success.value = 'Profil mis à jour avec succès'
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la mise à jour'
  }
}
</script>

<style scoped>
.profile-view {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.profile-card {
  max-width: 500px;
  width: 100%;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.profile-card h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.user-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.user-info p {
  color: #666;
  margin: 0.5rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  font-size: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  background: #007bff;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.logout-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  background: #dc3545;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}

.error-message {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #ffe6e6;
  color: #dc3545;
}

.success-message {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #d4edda;
  color: #155724;
}
</style>
