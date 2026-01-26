<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'

const reportStore = useReportStore()

const searchQuery = ref('')
const statusFilter = ref('')

const stats = computed(() => reportStore.stats)
const formatBudget = (amount) => reportStore.formatBudget(amount)
const formatDate = (dateStr) => reportStore.formatDate(dateStr)

const getStatusLabel = (status) => {
    const labels = {
        NOUVEAU: 'Nouveau',
        EN_COURS: 'En cours',
        TERMINE: 'Terminé'
    }
    return labels[status] || status
}

const filteredReports = computed(() => {
    return reportStore.reports.filter(report => {
        const matchSearch = !searchQuery.value ||
            report.address.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            (report.company && report.company.toLowerCase().includes(searchQuery.value.toLowerCase()))
        const matchStatus = !statusFilter.value || report.status === statusFilter.value
        return matchSearch && matchStatus
    })
})

onMounted(async () => {
    await reportStore.fetchReports()
    await reportStore.fetchStats()
})
</script>

<template>
    <div class="dashboard-page">
        <div class="dashboard-container">
            <h2><i class="fas fa-tachometer-alt"></i> Tableau de bord</h2>

            <div class="dashboard-stats">
                <div class="dashboard-card">
                    <div class="card-icon new"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="card-content">
                        <span class="card-value">{{ stats?.nouveau || 0 }}</span>
                        <span class="card-label">Nouveaux signalements</span>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-icon in-progress"><i class="fas fa-hard-hat"></i></div>
                    <div class="card-content">
                        <span class="card-value">{{ stats?.enCours || 0 }}</span>
                        <span class="card-label">En cours de travaux</span>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-icon completed"><i class="fas fa-check-circle"></i></div>
                    <div class="card-content">
                        <span class="card-value">{{ stats?.termine || 0 }}</span>
                        <span class="card-label">Travaux terminés</span>
                    </div>
                </div>
                <div class="dashboard-card">
                    <div class="card-icon budget"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="card-content">
                        <span class="card-value">{{ formatBudget(stats?.totalBudget) }}</span>
                        <span class="card-label">Budget total alloué</span>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3>Liste des signalements</h3>
                    <div class="table-actions">
                        <input
                            type="text"
                            class="search-input"
                            placeholder="Rechercher..."
                            v-model="searchQuery"
                        >
                        <select class="filter-select" v-model="statusFilter">
                            <option value="">Tous les statuts</option>
                            <option value="NOUVEAU">Nouveau</option>
                            <option value="EN_COURS">En cours</option>
                            <option value="TERMINE">Terminé</option>
                        </select>
                    </div>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Localisation</th>
                            <th>Date</th>
                            <th>Statut</th>
                            <th>Surface</th>
                            <th>Budget</th>
                            <th>Entreprise</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="report in filteredReports" :key="report.id">
                            <td>#{{ report.id }}</td>
                            <td>{{ report.address }}</td>
                            <td>{{ formatDate(report.date) }}</td>
                            <td>
                                <span :class="['status-badge', report.status]">
                                    {{ getStatusLabel(report.status) }}
                                </span>
                            </td>
                            <td>{{ report.surface ? report.surface + ' m²' : '-' }}</td>
                            <td>{{ formatBudget(report.budget) }}</td>
                            <td>{{ report.company || '-' }}</td>
                        </tr>
                    </tbody>
                </table>

                <p v-if="filteredReports.length === 0" class="no-data">
                    Aucun signalement trouvé.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-page {
    padding: 24px;
}

.dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
}

.dashboard-container h2 {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    color: var(--text-primary);
}

.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.dashboard-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
}

.card-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
}

.card-icon.new { background: #fee2e2; color: #ef4444; }
.card-icon.in-progress { background: #fef3c7; color: #f59e0b; }
.card-icon.completed { background: #d1fae5; color: #10b981; }
.card-icon.budget { background: #dbeafe; color: #2563eb; }

.card-content {
    display: flex;
    flex-direction: column;
}

.card-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
}

.card-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.table-container {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 16px;
}

.table-header h3 {
    color: var(--text-primary);
}

.table-actions {
    display: flex;
    gap: 12px;
}

.search-input, .filter-select {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
}

.search-input:focus, .filter-select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.data-table th {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.data-table td {
    color: var(--text-primary);
}

.no-data {
    text-align: center;
    color: var(--text-secondary);
    padding: 40px;
}
</style>

