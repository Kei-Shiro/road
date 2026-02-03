/**
 * Service de géolocalisation
 * Utilise Capacitor Geolocation pour le natif et l'API Web en fallback
 */
import { Geolocation } from '@capacitor/geolocation';

export const locationService = {
  /**
   * Vérifie et demande les permissions de localisation
   * @returns {Promise<boolean>} true si les permissions sont accordées
   */
  async checkPermissions() {
    try {
      // En développement web, Capacitor n'est pas disponible
      // Vérifier d'abord si on est en environnement natif
      if (typeof window !== 'undefined' && !window.capacitor) {
        return await this.checkWebPermissions();
      }

      const status = await Geolocation.checkPermissions();
      
      if (status.location === 'granted') {
        return true;
      }
      
      if (status.location === 'denied') {
        return false;
      }

      // Demander les permissions si non définies
      const requested = await Geolocation.requestPermissions();
      return requested.location === 'granted';
    } catch (error) {
      console.warn('Erreur Capacitor permissions:', error);
      // Fallback sur l'API Web
      return await this.checkWebPermissions();
    }
  },

  /**
   * Vérifie les permissions via l'API Web
   */
  async checkWebPermissions() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve(false);
          } else {
            resolve(true); // Autre erreur, mais permissions OK
          }
        },
        { timeout: 5000 }
      );
    });
  },

  /**
   * Obtient la position actuelle de l'utilisateur
   * @param {Object} options - Options de géolocalisation
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
   */
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      // Essayer d'abord avec Capacitor
      const position = await Geolocation.getCurrentPosition(mergedOptions);
      
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };
    } catch (error) {
      console.warn('Capacitor Geolocation failed, trying Web API:', error);
      
      // Fallback sur l'API Web
      return await this.getWebPosition(mergedOptions);
    }
  },

  /**
   * Obtient la position via l'API Web
   */
  async getWebPosition(options) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          let message = 'Erreur de géolocalisation';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permission de localisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Position indisponible';
              break;
            case error.TIMEOUT:
              message = 'Délai de localisation dépassé';
              break;
          }
          
          reject(new Error(message));
        },
        options
      );
    });
  },

  /**
   * Surveille les changements de position
   * @param {Function} callback - Fonction appelée à chaque mise à jour
   * @param {Function} errorCallback - Fonction appelée en cas d'erreur
   * @param {Object} options - Options de géolocalisation
   * @returns {Promise<string>} ID du watcher pour l'arrêter
   */
  async watchPosition(callback, errorCallback = null, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const watchId = await Geolocation.watchPosition(mergedOptions, (position, error) => {
        if (error) {
          if (errorCallback) {
            errorCallback(error);
          }
          return;
        }

        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      });

      return watchId;
    } catch (error) {
      console.warn('Capacitor watch failed, using Web API:', error);
      return this.watchWebPosition(callback, errorCallback, mergedOptions);
    }
  },

  /**
   * Surveille la position via l'API Web
   */
  watchWebPosition(callback, errorCallback, options) {
    if (!navigator.geolocation) {
      if (errorCallback) {
        errorCallback(new Error('Géolocalisation non supportée'));
      }
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        if (errorCallback) {
          errorCallback(error);
        }
      },
      options
    );

    return `web-${watchId}`;
  },

  /**
   * Arrête la surveillance de position
   * @param {string} watchId - ID retourné par watchPosition
   */
  async clearWatch(watchId) {
    if (!watchId) return;

    if (watchId.startsWith('web-')) {
      // Watcher Web
      const numericId = parseInt(watchId.replace('web-', ''));
      navigator.geolocation.clearWatch(numericId);
    } else {
      // Watcher Capacitor
      await Geolocation.clearWatch({ id: watchId });
    }
  },

  /**
   * Calcule la distance entre deux points en mètres
   * @param {number} lat1 - Latitude point 1
   * @param {number} lon1 - Longitude point 1
   * @param {number} lat2 - Latitude point 2
   * @param {number} lon2 - Longitude point 2
   * @returns {number} Distance en mètres
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  },

  /**
   * Convertit les degrés en radians
   */
  toRad(deg) {
    return deg * (Math.PI / 180);
  },

  /**
   * Formate la distance pour l'affichage
   * @param {number} meters - Distance en mètres
   * @returns {string} Distance formatée
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }
};
