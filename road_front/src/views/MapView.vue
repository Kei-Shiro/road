<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useReportStore } from '@/stores/reportStore'
import { useAuthStore } from '@/stores/authStore'
import StatsPanel from '@/components/StatsPanel.vue'
import MapLegend from '@/components/MapLegend.vue'
import ModalReport from '@/components/ModalReport.vue'

// Fix pour les icônes Leaflet par défaut
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})

const TANA_CENTER = [-18.8792, 47.5079]
const TANA_ZOOM = 14

const reportStore = useReportStore()
const authStore = useAuthStore()

const mapContainer = ref(null)
let map = null
let markers = []

const filterMyReports = ref(false)
const showReportModal = ref(false)
const selectedLocation = ref({ lat: 0, lng: 0 })

const problemTypes = {
    NID_POULE: { label: 'Nid de poule', icon: 'fa-circle-exclamation' },
    FISSURE: { label: 'Fissure', icon: 'fa-road-barrier' },
    EFFONDREMENT: { label: 'Effondrement', icon: 'fa-triangle-exclamation' },
    INONDATION: { label: 'Zone inondable', icon: 'fa-water' },
    AUTRE: { label: 'Autre', icon: 'fa-question-circle' }
}

const statuses = {
    NOUVEAU: { label: 'Nouveau', color: '#ef4444' },
    EN_COURS: { label: 'En cours', color: '#f59e0b' },
    TERMINE: { label: 'Terminé', color: '#10b981' }
}

const filteredReports = computed(() => {
    if (filterMyReports.value && authStore.isAuthenticated) {
        return reportStore.reports.filter(r => r.reportedById === authStore.currentUser?.id)
    }
    return reportStore.reports
})

const initMap = () => {
    map = L.map('map').setView(TANA_CENTER, TANA_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map)

    map.on('click', onMapClick)

    renderMarkers()
}

const renderMarkers = () => {
    markers.forEach(m => map.removeLayer(m))
    markers = []

    filteredReports.value.forEach(report => {
        const marker = createMarker(report)
        markers.push(marker)
        marker.addTo(map)
    })
}

const createMarker = (report) => {
    const statusClass = report.status === 'NOUVEAU' ? 'marker-new'
        : report.status === 'EN_COURS' ? 'marker-in-progress'
        : 'marker-completed'

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker ${statusClass}">
                   <i class="fas ${problemTypes[report.type]?.icon || 'fa-exclamation'}"></i>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    })

    const marker = L.marker([report.lat, report.lng], { icon })
    const popupContent = createPopupContent(report)
    marker.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' })

    return marker
}

const createPopupContent = (report) => {
    const statusLabel = statuses[report.status]?.label || report.status
    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('fr-FR')
    }
    const formatBudget = (amount) => {
        if (!amount) return 'Non défini'
        if (amount >= 1000000) return (amount / 1000000).toFixed(0) + 'M Ar'
        return amount.toLocaleString() + ' Ar'
    }

    return `
    <div class="popup-content">
      <div class="popup-header">
        <span class="status-badge ${report.status.toLowerCase()}">${statusLabel}</span>
        <h4>${report.address}</h4>
      </div>
      <div class="popup-details">
        <div class="popup-detail">
          <span class="popup-detail-label">Date</span>
          <span class="popup-detail-value">${formatDate(report.date)}</span>
        </div>
        <div class="popup-detail">
          <span class="popup-detail-label">Type</span>
          <span class="popup-detail-value">${problemTypes[report.type]?.label || 'Autre'}</span>
        </div>
        <div class="popup-detail">
          <span class="popup-detail-label">Surface</span>
          <span class="popup-detail-value">${report.surface ? report.surface + ' m²' : '-'}</span>
        </div>
        <div class="popup-detail">
          <span class="popup-detail-label">Budget</span>
          <span class="popup-detail-value">${formatBudget(report.budget)}</span>
        </div>
        <div class="popup-detail">
          <span class="popup-detail-label">Entreprise</span>
          <span class="popup-detail-value">${report.company || '-'}</span>
        </div>
        <div class="popup-detail">
          <span class="popup-detail-label">Signalé par</span>
          <span class="popup-detail-value">${report.reportedByName || '-'}</span>
        </div>
      </div>
    </div>
  `
}

const onMapClick = (e) => {
    if (!authStore.isAuthenticated || authStore.isManager) return

    selectedLocation.value = {
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6)
    }

    showReportModal.value = true
}

const showReportInfo = () => {
    alert('Cliquez sur la carte pour sélectionner l\'emplacement du problème.')
}

const handleReportCreated = () => {
    renderMarkers()
}

watch(filteredReports, () => {
    if (map) {
        renderMarkers()
    }
}, { deep: true })

onMounted(async () => {
    await reportStore.fetchReports()
    await reportStore.fetchStats()
    // Attendre que le DOM soit prêt avant d'initialiser la carte
    await nextTick()
    setTimeout(() => {
        initMap()
    }, 100)
})
</script>

<template>
    <div class="map-page">
        <div ref="mapContainer" id="map"></div>

        <div class="map-filters" v-if="authStore.isAuthenticated && !authStore.isManager">
            <label class="filter-checkbox">
                <input type="checkbox" v-model="filterMyReports">
                <span>Afficher uniquement mes signalements</span>
            </label>
        </div>

        <button
            class="fab-button"
            v-if="authStore.isAuthenticated && !authStore.isManager"
            @click="showReportInfo"
            title="Signaler un problème"
        >
            <i class="fas fa-plus"></i>
        </button>

        <StatsPanel :stats="reportStore.stats" />

        <MapLegend />

        <ModalReport
            v-if="showReportModal"
            :location="selectedLocation"
            @close="showReportModal = false"
            @created="handleReportCreated"
        />
    </div>
</template>

<style>
.map-page {
    position: relative;
    height: calc(100vh - 64px);
    width: 100%;
}

#map {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.map-filters {
    position: absolute;
    top: 20px;
    left: 20px;
    background: white;
    padding: 12px 16px;
    border-radius: 10px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    z-index: 500;
}

.filter-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
}

.filter-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
}

.fab-button {
    position: absolute;
    bottom: 30px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    z-index: 500;
    transition: all 200ms ease;
}

.fab-button:hover {
    transform: scale(1.1);
}

/* Custom Marker Styles */
.custom-marker {
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.custom-marker i {
    transform: rotate(45deg);
}

.marker-new {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

.marker-in-progress {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.marker-completed {
    background: linear-gradient(135deg, #10b981, #059669);
}

/* Popup Styles */
.custom-popup .leaflet-popup-content-wrapper {
    border-radius: 12px;
    padding: 0;
}

.popup-content {
    padding: 16px;
}

.popup-header {
    margin-bottom: 12px;
}

.popup-header h4 {
    margin: 8px 0 0;
    color: #1e293b;
    font-size: 1rem;
}

.popup-details {
    display: grid;
    gap: 8px;
}

.popup-detail {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
}

.popup-detail-label {
    color: #64748b;
}

.popup-detail-value {
    color: #1e293b;
    font-weight: 500;
}
</style>

