import api from './api'

export const mapService = {
  async getConfig() {
    const response = await api.get('/map/config')
    return response.data
  },

  getTileUrl(z, x, y) {
    return `http://localhost:8080/api/map/tiles/${z}/${x}/${y}`
  },

  async preloadTiles(minZoom = 12, maxZoom = 15) {
    const response = await api.post('/map/preload', null, {
      params: { minZoom, maxZoom }
    })
    return response.data
  }
}

export default mapService

