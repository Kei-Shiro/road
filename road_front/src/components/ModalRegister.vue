<script setup>
import { ref } from 'vue'
import userService from '@/services/userService'

const emit = defineEmits(['close'])

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
    error.value = ''

    if (password.value !== passwordConfirm.value) {
        error.value = 'Les mots de passe ne correspondent pas'
        return
    }

    loading.value = true

    try {
        await userService.createUser({
            name: name.value,
            email: email.value,
            password: password.value,
            role: 'MANAGER'
        })
        alert('Compte Manager créé avec succès ! Vous pouvez maintenant vous connecter.')
        emit('close')
    } catch (err) {
        error.value = 'Erreur lors de la création du compte'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-user-plus"></i> Inscription Manager</h3>
                <button class="modal-close" @click="emit('close')">&times;</button>
            </div>

            <form @submit.prevent="handleRegister">
                <div class="form-group">
                    <label for="name">Nom complet</label>
                    <input type="text" id="name" v-model="name" placeholder="Jean Rakoto" required>
                </div>

                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" v-model="email" placeholder="votre@email.com" required>
                </div>

                <div class="form-group">
                    <label for="password">Mot de passe</label>
                    <input type="password" id="password" v-model="password" placeholder="••••••••" required>
                </div>

                <div class="form-group">
                    <label for="passwordConfirm">Confirmer le mot de passe</label>
                    <input type="password" id="passwordConfirm" v-model="passwordConfirm" placeholder="••••••••" required>
                </div>

                <p v-if="error" class="error-message">{{ error }}</p>

                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    {{ loading ? 'Création...' : 'Créer mon compte Manager' }}
                </button>
            </form>
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
</style>

