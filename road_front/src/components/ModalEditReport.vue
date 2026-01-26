<template>
    <div class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Modifier le signalement</h3>
                <button class="modal-close" @click="emit('close')">&times;</button>
            </div>

            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label for="address">Localisation</label>
                    <input type="text" id="address" v-model="address" required>
                </div>

                <div class="form-group">
                    <label for="status">Statut</label>
                    <select id="status" v-model="status" required>
                        <option value="NOUVEAU">Nouveau</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="TERMINE">Terminé</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="surface">Surface (m²)</label>
                        <input type="number" id="surface" v-model="surface" min="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label for="budget">Budget (Ariary)</label>
                        <input type="number" id="budget" v-model="budget" min="0">
                    </div>
                </div>

                <div class="form-group">
                    <label for="company">Entreprise assignée</label>
                    <select id="company" v-model="company">
                        <option value="">Non assignée</option>
                        <option value="COLAS Madagascar">COLAS Madagascar</option>
                        <option value="SOGEA SATOM">SOGEA SATOM</option>
                        <option value="ENTREPRISE RAZAFY">ENTREPRISE RAZAFY</option>
                        <option value="TRAVAUX PUBLICS MADA">TRAVAUX PUBLICS MADA</option>
                        <option value="BTP CONSTRUCTION">BTP CONSTRUCTION</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    <i class="fas fa-save"></i>
                    {{ loading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const props = defineProps({
    report: Object
})

const emit = defineEmits(['close', 'updated'])

const reportStore = useReportStore()

const address = ref('')
const status = ref('')
const surface = ref('')
const budget = ref('')
const company = ref('')
const loading = ref(false)

watch(() => props.report, (newReport) => {
    if (newReport) {
        address.value = newReport.address || ''
        status.value = newReport.status || ''
        surface.value = newReport.surface || ''
        budget.value = newReport.budget || ''
        company.value = newReport.company || ''
    }
}, { immediate: true })

const handleSubmit = async () => {
    loading.value = true
    try {
        await reportStore.updateReport(props.report.id, {
            address: address.value,
            status: status.value,
            surface: surface.value ? parseFloat(surface.value) : null,
            budget: budget.value ? parseInt(budget.value) : null,
            company: company.value || null
        })
        emit('updated')
        emit('close')
    } catch (err) {
        alert('Erreur lors de la mise à jour')
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
.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
</style>
