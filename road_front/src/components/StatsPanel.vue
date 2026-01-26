<template>
  <div class="stats-panel">
    <h3><i class="fas fa-chart-pie"></i> Récapitulatif</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ stats?.total || 0 }}</span>
        <span class="stat-label">Points signalés</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats?.totalSurface?.toLocaleString() || 0 }} m²</span>
        <span class="stat-label">Surface totale</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats?.progress || 0 }}%</span>
        <span class="stat-label">Avancement</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatBudget(stats?.totalBudget) }}</span>
        <span class="stat-label">Budget total</span>
      </div>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: (stats?.progress || 0) + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
    stats: Object
})

const formatBudget = (amount) => {
    if (!amount) return '0 Ar'
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(0) + 'M Ar'
    }
    return amount.toLocaleString() + ' Ar'
}
</script>

<style scoped>
.stats-panel {
    position: absolute;
    bottom: 24px;
    left: 24px;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 500;
    min-width: 320px;
}

.stats-panel h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 16px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.stat-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.progress-bar-container {
    height: 8px;
    background: var(--bg-primary);
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--success-color), var(--primary-color));
    border-radius: 4px;
    transition: width 0.3s ease;
}
</style>
