<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import AppHeader from '@/components/AppHeader.vue'
import ToastNotifications from '@/components/ToastNotifications.vue'

const authStore = useAuthStore()

onMounted(() => {
    authStore.initFromStorage()
})
</script>

<template>
    <div class="app-container">
        <AppHeader />
        <main class="main-content">
            <router-view />
        </main>
        <ToastNotifications />
    </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-light: #3b82f6;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    --info-color: #06b6d4;
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-dark: #1e293b;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-light: #94a3b8;
    --border-color: #e2e8f0;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    min-height: 100vh;
}

.app-container {
    min-height: 100vh;
}

.main-content {
    margin-top: 64px;
    min-height: calc(100vh - 64px);
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: white;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.4);
}

.btn-outline {
    background: transparent;
    border: 1.5px solid var(--border-color);
    color: var(--text-primary);
}

.btn-outline:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.btn-success { background: var(--success-color); color: white; }
.btn-warning { background: var(--warning-color); color: white; }
.btn-danger { background: var(--danger-color); color: white; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.btn-block { width: 100%; }

.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-badge.NOUVEAU, .status-badge.nouveau { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
.status-badge.EN_COURS, .status-badge.en_cours { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
.status-badge.TERMINE, .status-badge.termine { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
.status-badge.ACTIF, .status-badge.actif { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
.status-badge.BLOQUE, .status-badge.bloque { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }

.hidden { display: none !important; }
</style>
