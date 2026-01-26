import Dexie from 'dexie'

// Base de données IndexedDB pour le stockage offline
const db = new Dexie('RoadSignalingDB')

db.version(1).stores({
  signalements: '++id, syncId, statut, latitude, longitude, isSynced, localUpdatedAt',
  pendingSync: '++id, type, data, createdAt',
  mapTiles: '[z+x+y], data, cachedAt',
  settings: 'key'
})

export const offlineDb = {
  // Signalements
  async saveSignalement(signalement) {
    const existing = await db.signalements.where('syncId').equals(signalement.syncId).first()
    if (existing) {
      return await db.signalements.update(existing.id, signalement)
    }
    return await db.signalements.add(signalement)
  },

  async getAllSignalements() {
    return await db.signalements.toArray()
  },

  async getSignalementBySyncId(syncId) {
    return await db.signalements.where('syncId').equals(syncId).first()
  },

  async deleteSignalement(syncId) {
    return await db.signalements.where('syncId').equals(syncId).delete()
  },

  async getUnsyncedSignalements() {
    return await db.signalements.where('isSynced').equals(false).toArray()
  },

  async markAsSynced(syncId) {
    const sig = await db.signalements.where('syncId').equals(syncId).first()
    if (sig) {
      await db.signalements.update(sig.id, { isSynced: true })
    }
  },

  async bulkSaveSignalements(signalements) {
    await db.signalements.bulkPut(signalements)
  },

  async clearSignalements() {
    await db.signalements.clear()
  },

  // Pending Sync Queue
  async addToPendingSync(type, data) {
    return await db.pendingSync.add({
      type,
      data,
      createdAt: new Date().toISOString()
    })
  },

  async getPendingSync() {
    return await db.pendingSync.toArray()
  },

  async removePendingSync(id) {
    return await db.pendingSync.delete(id)
  },

  async clearPendingSync() {
    await db.pendingSync.clear()
  },

  // Map Tiles Cache
  async cacheTile(z, x, y, data) {
    return await db.mapTiles.put({
      z, x, y, data,
      cachedAt: new Date().toISOString()
    })
  },

  async getCachedTile(z, x, y) {
    return await db.mapTiles.get([z, x, y])
  },

  async clearOldTiles(maxAgeDays = 7) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - maxAgeDays)
    await db.mapTiles.where('cachedAt').below(cutoff.toISOString()).delete()
  },

  // Settings
  async setSetting(key, value) {
    await db.settings.put({ key, value })
  },

  async getSetting(key) {
    const setting = await db.settings.get(key)
    return setting?.value
  },

  async getLastSyncTime() {
    return await this.getSetting('lastSyncTime')
  },

  async setLastSyncTime(time) {
    await this.setSetting('lastSyncTime', time)
  }
}

export default offlineDb

