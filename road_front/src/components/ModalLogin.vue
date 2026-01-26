<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
    error.value = ''
    loading.value = true

    const result = await authStore.login(email.value, password.value)

    loading.value = false

    if (result.success) {
        emit('close')
    } else {
        error.value = result.error || 'Erreur de connexion'
    }
}
</script>

<template>
    <div class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-sign-in-alt"></i> Connexion</h3>
                <button class="modal-close" @click="emit('close')">&times;</button>
            </div>

            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" v-model="email" placeholder="votre@email.com" required>
                </div>

                <div class="form-group">
                    <label for="password">Mot de passe</label>
                    <input type="password" id="password" v-model="password" placeholder="••••••••" required>
                </div>

                <p v-if="error" class="error-message">{{ error }}</p>

                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    {{ loading ? 'Connexion...' : 'Se connecter' }}
                </button>
            </form>

            <div class="modal-footer">
                <p>Comptes de test :</p>
                <small>Manager: admin@travauxana.mg / admin123</small><br>
                <small>Utilisateur: jean.rakoto@email.mg / user123</small>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.modal-header h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-primary);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--text-primary);
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 1rem;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.error-message {
    color: var(--danger-color);
    font-size: 0.875rem;
    margin-bottom: 16px;
}

.modal-footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.85rem;
}
</style>

