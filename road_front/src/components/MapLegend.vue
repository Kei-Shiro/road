<template>
  <div class="map-legend">
    <h4>Légende</h4>
    <div class="legend-item">
      <span class="legend-marker new"></span>
      <span>Nouveau</span>
    </div>
    <div class="legend-item">
      <span class="legend-marker in-progress"></span>
      <span>En cours</span>
    </div>
    <div class="legend-item">
      <span class="legend-marker completed"></span>
      <span>Terminé</span>
    </div>
  </div>
</template>

<style scoped>
.map-legend {
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 500;
}

.map-legend h4 {
  font-size: 0.875rem;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-marker {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.legend-marker.new {
  background: var(--danger-color);
}

.legend-marker.in-progress {
  background: var(--warning-color);
}

.legend-marker.completed {
  background: var(--success-color);
}
</style>
