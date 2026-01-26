<template>
  <div class="register-view">
    <div class="register-card">
      <h1>Inscription</h1>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-row">
          <div class="form-group">
            <label for="prenom">Prénom</label>
            <input
              type="text"
              id="prenom"
              v-model="form.prenom"
              required
              placeholder="Votre prénom"
            />
          </div>

          <div class="form-group">
            <label for="nom">Nom</label>
            <input
              type="text"
              id="nom"
              v-model="form.nom"
              required
              placeholder="Votre nom"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
            placeholder="votre@email.com"
          />
        </div>

        <div class="form-group">
          <label for="telephone">Téléphone</label>
          <input
            type="tel"
            id="telephone"
            v-model="form.telephone"
            placeholder="+261 34 00 000 00"
          />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
            minlength="6"
            placeholder="Minimum 6 caractères"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Retapez votre mot de passe"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading || !passwordsMatch">
          {{ loading ? 'Inscription...' : "S'inscrire" }}
        </button>
      </form>

      <div class="login-link">
        Déjà un compte ?
        <router-link to="/login">Se connecter</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  password: ''
})

const confirmPassword = ref('')

const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)
const passwordsMatch = computed(() => form.value.password === confirmPassword.value)

const handleRegister = async () => {
  if (!passwordsMatch.value) {
    return
  }

  try {
    await authStore.register(form.value)
    router.push('/')
  } catch (err) {
    console.error("Erreur d'inscription:", err)
  }
}
</script>

<style scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 500px;
}

.register-card h1 {
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>

