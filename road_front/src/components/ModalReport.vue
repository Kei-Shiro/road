<template>
    <div class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Nouveau signalement</h3>
                <button class="modal-close" @click="emit('close')">&times;</button>
            </div>

            <form @submit.prevent="handleSubmit">
                <div class="form-row">
                    <div class="form-group">
                        <label>Latitude</label>
                        <input type="text" :value="location.lat" readonly>
                    </div>
                    <div class="form-group">
                        <label>Longitude</label>
                        <input type="text" :value="location.lng" readonly>
                    </div>
                </div>

                <div class="form-group">
                    <label for="address">Adresse / Localisation</label>
                    <input type="text" id="address" v-model="address" placeholder="Ex: Avenue de l'Indépendance" required>
                </div>

                <div class="form-group">
                    <label for="type">Type de problème</label>
                    <select id="type" v-model="type" required>
                        <option value="">Sélectionner...</option>
                        <option value="NID_POULE">Nid de poule</option>
                        <option value="FISSURE">Fissure</option>
                        <option value="EFFONDREMENT">Effondrement</option>
                        <option value="INONDATION">Zone inondable</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="description">Description du problème</label>
                    <textarea id="description" v-model="description" rows="3" placeholder="Décrivez le problème..." required></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    <i class="fas fa-paper-plane"></i>
                    {{ loading ? 'Envoi...' : 'Envoyer le signalement' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps({
    location: Object
})

const emit = defineEmits(['close', 'created'])

const reportStore = useReportStore()
const authStore = useAuthStore()

const address = ref('')
const description = ref('')
const type = ref('')
const loading = ref(false)

const handleSubmit = async () => {
    loading.value = true
    try {
        await reportStore.createReport({
            lat: parseFloat(props.location.lat),
            lng: parseFloat(props.location.lng),
            address: address.value,
            type: type.value,
            description: description.value,
            reportedById: authStore.currentUser.id
        })
        emit('created')
        emit('close')
    } catch (err) {
        alert('Erreur lors de la création du signalement')
    } finally {
        loading.value = false
    }
}
</script>

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
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    max-height: 90vh;
    overflow-y: auto;
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

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
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

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group input[readonly] {
    background: var(--bg-primary);
    color: var(--text-secondary);
}
</style>
