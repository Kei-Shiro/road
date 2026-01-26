<template>
  <div class="map-view">
    <div class="map-controls">
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Rechercher un signalement..."
          @keyup.enter="handleSearch"
        />
      </div>

      <div class="filter-buttons">
        <button
          :class="['filter-btn', { active: activeFilter === null }]"
          @click="setFilter(null)"
        >
          Tous
        </button>
        <button
          :class="['filter-btn nouveau', { active: activeFilter === 'NOUVEAU' }]"
          @click="setFilter('NOUVEAU')"
        >
          Nouveaux
        </button>
        <button
          :class="['filter-btn en-cours', { active: activeFilter === 'EN_COURS' }]"
          @click="setFilter('EN_COURS')"
        >
          En cours
        </button>
        <button
          :class="['filter-btn termine', { active: activeFilter === 'TERMINE' }]"
          @click="setFilter('TERMINE')"
        >
          Terminés
        </button>
      </div>

      <button v-if="isAuthenticated" class="add-btn" @click="startAddingSignalement">
        ➕ Ajouter
      </button>
    </div>

    <div class="map-container" ref="mapContainer">
      <div id="map" ref="mapEl"></div>
    </div>

    <div class="coordinates-display" v-if="currentCoords">
      📍 {{ currentCoords.lat.toFixed(6) }}, {{ currentCoords.lng.toFixed(6) }}
    </div>

    <!-- Popup de signalement -->
    <div v-if="selectedSignalement" class="signalement-popup">
      <button class="close-popup" @click="selectedSignalement = null">×</button>
      <h3>{{ selectedSignalement.titre }}</h3>
      <p class="status" :class="selectedSignalement.statut.toLowerCase()">
        {{ formatStatus(selectedSignalement.statut) }}
      </p>
      <p v-if="selectedSignalement.description">{{ selectedSignalement.description }}</p>
      <div class="popup-details">
        <p v-if="selectedSignalement.entrepriseResponsable">
          <strong>Entreprise:</strong> {{ selectedSignalement.entrepriseResponsable }}
        </p>
        <p v-if="selectedSignalement.surfaceImpactee">
          <strong>Surface:</strong> {{ selectedSignalement.surfaceImpactee }} m²
        </p>
        <p v-if="selectedSignalement.budget">
          <strong>Budget:</strong> {{ formatCurrency(selectedSignalement.budget) }} Ar
        </p>
        <p v-if="selectedSignalement.pourcentageAvancement !== undefined">
          <strong>Avancement:</strong> {{ selectedSignalement.pourcentageAvancement }}%
        </p>
      </div>
      <router-link
        :to="`/signalement/${selectedSignalement.id}`"
        class="view-details-btn"
      >
        Voir les détails
      </router-link>
    </div>

    <!-- Modal pour ajouter un signalement -->
    <div v-if="isAdding" class="add-modal">
      <div class="modal-content">
        <h3>Nouveau signalement</h3>
        <p class="instruction">Cliquez sur la carte pour placer le marqueur</p>
        <p v-if="newSignalementCoords">
          Position: {{ newSignalementCoords.lat.toFixed(6) }}, {{ newSignalementCoords.lng.toFixed(6) }}
        </p>
        <div class="modal-actions">
          <button @click="cancelAdding" class="cancel-btn">Annuler</button>
          <button
            @click="confirmLocation"
            class="confirm-btn"
            :disabled="!newSignalementCoords"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSignalementStore } from '@/stores/signalement'
import { useMapStore } from '@/stores/map'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const authStore = useAuthStore()
const signalementStore = useSignalementStore()
const mapStore = useMapStore()

const mapEl = ref(null)
const map = ref(null)
const markers = ref([])
const searchQuery = ref('')
const activeFilter = ref(null)
const currentCoords = ref(null)
const selectedSignalement = ref(null)
const isAdding = ref(false)
const newSignalementCoords = ref(null)
const tempMarker = ref(null)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const signalements = computed(() => signalementStore.signalements)

const formatStatus = (status) => {
  const map = {
    'NOUVEAU': 'Nouveau',
    'EN_COURS': 'En cours',
    'TERMINE': 'Terminé'
  }
  return map[status] || status
}

const formatCurrency = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const getMarkerColor = (statut) => {
  const colors = {
    'NOUVEAU': '#17a2b8',
    'EN_COURS': '#ffc107',
    'TERMINE': '#28a745'
  }
  return colors[statut] || '#6c757d'
}

const createCustomIcon = (statut) => {
  const color = getMarkerColor(statut)
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

const initMap = () => {
  if (map.value) return

  map.value = L.map(mapEl.value).setView(mapStore.center, mapStore.zoom)

  // Couche de tuiles - utiliser OSM directement ou le serveur local
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map.value)

  // Événements de la carte
  map.value.on('mousemove', (e) => {
    currentCoords.value = { lat: e.latlng.lat, lng: e.latlng.lng }
  })

  map.value.on('click', (e) => {
    if (isAdding.value) {
      newSignalementCoords.value = { lat: e.latlng.lat, lng: e.latlng.lng }

      if (tempMarker.value) {
        map.value.removeLayer(tempMarker.value)
      }

      tempMarker.value = L.marker([e.latlng.lat, e.latlng.lng], {
        icon: L.divIcon({
          className: 'temp-marker',
          html: '<div style="background-color: #dc3545; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map.value)
    }
  })

  map.value.on('moveend', () => {
    const bounds = map.value.getBounds()
    mapStore.setBounds({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast()
    })
  })
}

const updateMarkers = () => {
  // Supprimer les anciens marqueurs
  markers.value.forEach(m => map.value.removeLayer(m))
  markers.value = []

  // Filtrer les signalements
  let filtered = signalements.value
  if (activeFilter.value) {
    filtered = filtered.filter(s => s.statut === activeFilter.value)
  }

  // Ajouter les nouveaux marqueurs
  filtered.forEach(sig => {
    if (sig.latitude && sig.longitude) {
      const marker = L.marker([sig.latitude, sig.longitude], {
        icon: createCustomIcon(sig.statut)
      })
        .addTo(map.value)
        .on('click', () => {
          selectedSignalement.value = sig
        })

      // Tooltip au survol
      marker.bindTooltip(sig.titre, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      })

      markers.value.push(marker)
    }
  })
}

const setFilter = (filter) => {
  activeFilter.value = filter
  updateMarkers()
}

const handleSearch = () => {
  // Recherche simple dans les signalements
  const query = searchQuery.value.toLowerCase()
  const found = signalements.value.find(s =>
    s.titre.toLowerCase().includes(query) ||
    s.description?.toLowerCase().includes(query)
  )
  if (found && found.latitude && found.longitude) {
    map.value.setView([found.latitude, found.longitude], 16)
    selectedSignalement.value = found
  }
}

const startAddingSignalement = () => {
  isAdding.value = true
  newSignalementCoords.value = null
}

const cancelAdding = () => {
  isAdding.value = false
  newSignalementCoords.value = null
  if (tempMarker.value) {
    map.value.removeLayer(tempMarker.value)
    tempMarker.value = null
  }
}

const confirmLocation = () => {
  if (newSignalementCoords.value) {
    router.push({
      name: 'signalement-new',
      query: {
        lat: newSignalementCoords.value.lat,
        lng: newSignalementCoords.value.lng
      }
    })
  }
}

watch(signalements, () => {
  if (map.value) {
    updateMarkers()
  }
})

onMounted(async () => {
  await mapStore.fetchConfig()
  await signalementStore.fetchSignalements()

  // Petit délai pour s'assurer que le DOM est prêt
  setTimeout(() => {
    initMap()
    updateMarkers()
  }, 100)
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
}

.map-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
  flex-wrap: wrap;
}

.search-box input {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  width: 250px;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #333;
  color: white;
  border-color: #333;
}

.filter-btn.nouveau.active {
  background: #17a2b8;
  border-color: #17a2b8;
}

.filter-btn.en-cours.active {
  background: #ffc107;
  border-color: #ffc107;
  color: #333;
}

.filter-btn.termine.active {
  background: #28a745;
  border-color: #28a745;
}

.add-btn {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.add-btn:hover {
  background: #0056b3;
}

.map-container {
  flex: 1;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}

.coordinates-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255,255,255,0.9);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  z-index: 1000;
}

.signalement-popup {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  max-width: 350px;
  z-index: 1000;
}

.close-popup {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.signalement-popup h3 {
  margin: 0 0 0.5rem 0;
  padding-right: 2rem;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.status.nouveau {
  background: #e7f5f8;
  color: #17a2b8;
}

.status.en_cours {
  background: #fff8e1;
  color: #856404;
}

.status.termine {
  background: #e8f5e9;
  color: #28a745;
}

.popup-details {
  margin: 1rem 0;
  font-size: 0.9rem;
}

.popup-details p {
  margin: 0.25rem 0;
}

.view-details-btn {
  display: block;
  text-align: center;
  padding: 0.5rem;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
}

.add-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 100px;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.instruction {
  color: #666;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.cancel-btn, .confirm-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.confirm-btn {
  background: #28a745;
  color: white;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

