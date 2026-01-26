import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import signalementService from '@/services/signalementService'
import offlineDb from '@/services/offlineDb'
import { v4 as uuidv4 } from 'uuid'

export const useSignalementStore = defineStore('signalement', () => {
  // State
  const signalements = ref([])
  const currentSignalement = ref(null)
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const isOnline = ref(navigator.onLine)
  const lastSyncTime = ref(null)

  // Getters
  const nouveaux = computed(() => signalements.value.filter(s => s.statut === 'NOUVEAU'))
  const enCours = computed(() => signalements.value.filter(s => s.statut === 'EN_COURS'))
  const termines = computed(() => signalements.value.filter(s => s.statut === 'TERMINE'))
  const unsyncedCount = computed(() => signalements.value.filter(s => !s.isSynced).length)

  // Actions
  async function fetchSignalements(params = {}) {
    loading.value = true
    error.value = null
    try {
      if (isOnline.value) {
        const response = await signalementService.getAll(params)
        signalements.value = response.content || response
        // Sauvegarder en local
        await offlineDb.bulkSaveSignalements(signalements.value.map(s => ({ ...s, isSynced: true })))
      } else {
        // Mode offline
        signalements.value = await offlineDb.getAllSignalements()
      }
    } catch (err) {
      error.value = err.message
      // Fallback sur les données locales
      signalements.value = await offlineDb.getAllSignalements()
    } finally {
      loading.value = false
    }
  }

  async function fetchSignalementById(id) {
    loading.value = true
    try {
      if (isOnline.value) {
        currentSignalement.value = await signalementService.getById(id)
      } else {
        const all = await offlineDb.getAllSignalements()
        currentSignalement.value = all.find(s => s.id === id || s.syncId === id)
      }
      return currentSignalement.value
    } finally {
      loading.value = false
    }
  }

  async function fetchByBounds(bounds) {
    if (isOnline.value) {
      try {
        const response = await signalementService.getByBounds(bounds)
        return response
      } catch (err) {
        console.error('Erreur chargement par bounds:', err)
        return []
      }
    }
    return signalements.value.filter(s =>
      s.latitude >= bounds.minLat && s.latitude <= bounds.maxLat &&
      s.longitude >= bounds.minLng && s.longitude <= bounds.maxLng
    )
  }

  async function createSignalement(data) {
    const signalement = {
      ...data,
      syncId: uuidv4(),
      isSynced: false,
      localUpdatedAt: new Date().toISOString()
    }

    if (isOnline.value) {
      try {
        const created = await signalementService.create(signalement)
        signalements.value.push(created)
        await offlineDb.saveSignalement({ ...created, isSynced: true })
        return created
      } catch (err) {
        // Sauvegarder en local en cas d'erreur
        await offlineDb.saveSignalement(signalement)
        signalements.value.push(signalement)
        throw err
      }
    } else {
      // Mode offline
      await offlineDb.saveSignalement(signalement)
      signalements.value.push(signalement)
      return signalement
    }
  }

  async function updateSignalement(id, data) {
    const updateData = {
      ...data,
      localUpdatedAt: new Date().toISOString(),
      isSynced: false
    }

    if (isOnline.value) {
      try {
        const updated = await signalementService.update(id, updateData)
        const index = signalements.value.findIndex(s => s.id === id)
        if (index !== -1) {
          signalements.value[index] = updated
        }
        await offlineDb.saveSignalement({ ...updated, isSynced: true })
        return updated
      } catch (err) {
        // Sauvegarder en local
        await offlineDb.saveSignalement(updateData)
        throw err
      }
    } else {
      await offlineDb.saveSignalement(updateData)
      const index = signalements.value.findIndex(s => s.id === id || s.syncId === data.syncId)
      if (index !== -1) {
        signalements.value[index] = { ...signalements.value[index], ...updateData }
      }
      return updateData
    }
  }

  async function deleteSignalement(id) {
    if (isOnline.value) {
      await signalementService.delete(id)
    }
    const sig = signalements.value.find(s => s.id === id)
    if (sig?.syncId) {
      await offlineDb.deleteSignalement(sig.syncId)
    }
    signalements.value = signalements.value.filter(s => s.id !== id)
  }

  async function fetchStats() {
    if (isOnline.value) {
      try {
        stats.value = await signalementService.getStats()
      } catch (err) {
        console.error('Erreur chargement stats:', err)
      }
    }
    return stats.value
  }

  async function syncWithServer() {
    if (!isOnline.value) return

    loading.value = true
    try {
      const unsyncedSignalements = await offlineDb.getUnsyncedSignalements()
      const lastSync = await offlineDb.getLastSyncTime()

      const syncRequest = {
        lastSyncTime: lastSync,
        signalements: unsyncedSignalements,
        deletedSyncIds: []
      }

      const response = await signalementService.sync(syncRequest)

      // Mettre à jour les signalements locaux avec les données serveur
      if (response.serverChanges) {
        for (const sig of response.serverChanges) {
          await offlineDb.saveSignalement({ ...sig, isSynced: true })
        }
      }

      // Marquer les signalements comme synchronisés
      for (const sig of unsyncedSignalements) {
        await offlineDb.markAsSynced(sig.syncId)
      }

      // Sauvegarder le timestamp de synchronisation
      await offlineDb.setLastSyncTime(response.syncTime)
      lastSyncTime.value = response.syncTime

      // Recharger les signalements
      await fetchSignalements()

      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Écouter les changements de connectivité
  function setupOnlineListener() {
    window.addEventListener('online', () => {
      isOnline.value = true
      syncWithServer()
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }

  return {
    // State
    signalements,
    currentSignalement,
    stats,
    loading,
    error,
    isOnline,
    lastSyncTime,
    // Getters
    nouveaux,
    enCours,
    termines,
    unsyncedCount,
    // Actions
    fetchSignalements,
    fetchSignalementById,
    fetchByBounds,
    createSignalement,
    updateSignalement,
    deleteSignalement,
    fetchStats,
    syncWithServer,
    setupOnlineListener
  }
})

