<script setup>
import { ref, onMounted } from 'vue'
import { useReportStore } from '@/stores/reportStore'
import { useUserStore } from '@/stores/userStore'
import ModalEditReport from '@/components/ModalEditReport.vue'

const reportStore = useReportStore()
const userStore = useUserStore()

const activeTab = ref('signalements')
const syncing = ref(false)

const showEditModal = ref(false)
const editingReport = ref(null)

const newUserName = ref('')
const newUserEmail = ref('')
const newUserPassword = ref('')
const newUserRole = ref('UTILISATEUR')

const reports = ref([])
const users = ref([])

const formatDate = (dateStr) => reportStore.formatDate(dateStr)

const getStatusLabel = (status) => {
    const labels = {
        NOUVEAU: 'Nouveau',
        EN_COURS: 'En cours',
        TERMINE: 'Terminé',
        ACTIF: 'Actif',
        BLOQUE: 'Bloqué'
    }
    return labels[status] || status
}

const handleSync = async () => {
    syncing.value = true
    await reportStore.fetchReports()
    await reportStore.fetchStats()
    await userStore.fetchUsers()
    reports.value = reportStore.reports
    users.value = userStore.users
    setTimeout(() => {
        syncing.value = false
        alert('Synchronisation terminée !')
    }, 1000)
}

const editReport = (report) => {
    editingReport.value = report
    showEditModal.value = true
}

const handleReportUpdated = () => {
    reports.value = reportStore.reports
}

const deleteReport = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
        await reportStore.deleteReport(id)
        reports.value = reportStore.reports
    }
}

const blockUser = async (id) => {
    await userStore.blockUser(id)
    users.value = userStore.users
}

const unblockUser = async (id) => {
    await userStore.unblockUser(id)
    users.value = userStore.users
}

const createUser = async () => {
    try {
        await userStore.createUser({
            name: newUserName.value,
            email: newUserEmail.value,
            password: newUserPassword.value,
            role: newUserRole.value
        })
        newUserName.value = ''
        newUserEmail.value = ''
        newUserPassword.value = ''
        newUserRole.value = 'UTILISATEUR'
        users.value = userStore.users
        alert('Utilisateur créé avec succès !')
    } catch (err) {
        alert('Erreur lors de la création')
    }
}

onMounted(async () => {
    await reportStore.fetchReports()
    await userStore.fetchUsers()
    reports.value = reportStore.reports
    users.value = userStore.users
})
</script>

<template>
    <div class="admin-page">
        <div class="admin-container">
            <div class="admin-header">
                <h2><i class="fas fa-cogs"></i> Panneau d'administration</h2>
                <button class="btn btn-primary" @click="handleSync">
                    <i class="fas fa-sync-alt" :class="{ 'fa-spin': syncing }"></i> Synchroniser
                </button>
            </div>

            <div class="admin-tabs">
                <button class="tab-btn" :class="{ active: activeTab === 'signalements' }" @click="activeTab = 'signalements'">
                    <i class="fas fa-map-marker-alt"></i> Signalements
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'utilisateurs' }" @click="activeTab = 'utilisateurs'">
                    <i class="fas fa-users"></i> Utilisateurs
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'comptes' }" @click="activeTab = 'comptes'">
                    <i class="fas fa-user-plus"></i> Créer un compte
                </button>
            </div>

            <!-- Tab: Signalements -->
            <div class="tab-content" v-if="activeTab === 'signalements'">
                <div class="table-container">
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="report in reports" :key="report.id">
                                <td>#{{ report.id }}</td>
                                <td>{{ report.address }}</td>
                                <td>{{ formatDate(report.date) }}</td>
                                <td>
                                    <span :class="['status-badge', report.status]">
                                        {{ getStatusLabel(report.status) }}
                                    </span>
                                </td>
                                <td>{{ report.surface || '-' }}</td>
                                <td>{{ report.budget ? report.budget.toLocaleString() + ' Ar' : '-' }}</td>
                                <td>{{ report.company || '-' }}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-primary btn-sm" @click="editReport(report)">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" @click="deleteReport(report.id)">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tab: Utilisateurs -->
            <div class="tab-content" v-if="activeTab === 'utilisateurs'">
                <div class="table-container">
                    <h3>Gestion des utilisateurs</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Date inscription</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>{{ user.id }}</td>
                                <td>{{ user.name }}</td>
                                <td>{{ user.email }}</td>
                                <td>{{ user.role }}</td>
                                <td>{{ formatDate(user.dateCreated) }}</td>
                                <td>
                                    <span :class="['status-badge', user.status]">
                                        {{ getStatusLabel(user.status) }}
                                    </span>
                                </td>
                                <td>
                                    <button v-if="user.status === 'BLOQUE'" class="btn btn-success btn-sm" @click="unblockUser(user.id)">
                                        <i class="fas fa-unlock"></i> Débloquer
                                    </button>
                                    <button v-else class="btn btn-warning btn-sm" @click="blockUser(user.id)">
                                        <i class="fas fa-ban"></i> Bloquer
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tab: Créer compte -->
            <div class="tab-content" v-if="activeTab === 'comptes'">
                <div class="form-container">
                    <h3>Créer un nouveau compte utilisateur</h3>
                    <form @submit.prevent="createUser">
                        <div class="form-group">
                            <label for="newUserName">Nom complet</label>
                            <input type="text" id="newUserName" v-model="newUserName" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserEmail">Email</label>
                            <input type="email" id="newUserEmail" v-model="newUserEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserPassword">Mot de passe</label>
                            <input type="password" id="newUserPassword" v-model="newUserPassword" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserRole">Rôle</label>
                            <select id="newUserRole" v-model="newUserRole">
                                <option value="UTILISATEUR">Utilisateur</option>
                                <option value="MANAGER">Manager</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-user-plus"></i> Créer le compte
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <ModalEditReport
            v-if="showEditModal"
            :report="editingReport"
            @close="showEditModal = false"
            @updated="handleReportUpdated"
        />
    </div>
</template>

<style scoped>
.admin-page {
    padding: 24px;
}

.admin-container {
    max-width: 1400px;
    margin: 0 auto;
}

.admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.admin-header h2 {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-primary);
}

.admin-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 16px;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: all 0.2s;
}

.tab-btn:hover {
    background: var(--bg-primary);
    color: var(--primary-color);
}

.tab-btn.active {
    background: var(--primary-color);
    color: white;
}

.tab-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
}

.table-container h3 {
    margin-bottom: 20px;
    color: var(--text-primary);
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

.action-buttons {
    display: flex;
    gap: 8px;
}

.form-container {
    max-width: 500px;
}

.form-container h3 {
    margin-bottom: 24px;
    color: var(--text-primary);
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
}
</style>

