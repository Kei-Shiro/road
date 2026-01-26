import { defineStore } from 'pinia'
import { ref } from 'vue'
import mapService from '@/services/mapService'

export const useMapStore = defineStore('map', () => {
  // State
  const config = ref(null)
  const center = ref([-18.8792, 47.5079]) // Antananarivo
  const zoom = ref(13)
  const bounds = ref(null)
  const loading = ref(false)

  // Actions
  async function fetchConfig() {
    loading.value = true
    try {
      config.value = await mapService.getConfig()
      if (config.value) {
        center.value = [config.value.centerLat, config.value.centerLng]
        zoom.value = config.value.defaultZoom
      }
    } catch (err) {
      console.error('Erreur chargement config carte:', err)
    } finally {
      loading.value = false
    }
  }

  function setCenter(lat, lng) {
    center.value = [lat, lng]
  }

  function setZoom(level) {
    zoom.value = level
  }

  function setBounds(newBounds) {
    bounds.value = newBounds
  }

  function getTileUrl() {
    return 'http://localhost:8080/api/map/tiles/{z}/{x}/{y}'
  }

  return {
    // State
    config,
    center,
    zoom,
    bounds,
    loading,
    // Actions
    fetchConfig,
    setCenter,
    setZoom,
    setBounds,
    getTileUrl
  }
})

