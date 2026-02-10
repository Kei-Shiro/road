/**
 * Composable pour la gestion des marqueurs Leaflet
 * Centralise la logique de création et manipulation des marqueurs
 */
import L from 'leaflet';
import { STATUT_COLORS, STATUT_LABELS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';

export function useMapMarkers(map) {
  const markers = [];

  /**
   * Crée une icône personnalisée pour un marqueur
   * @param {string} color - Couleur du marqueur
   * @returns {L.DivIcon} Icône Leaflet
   */
  function createMarkerIcon(color) {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="custom-marker" style="background-color: ${color}; border: 3px solid white; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);">
          ⚠️
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  }

  /**
   * Crée le contenu HTML d'un popup de marqueur
   * @param {Object} signalement - Données du signalement
   * @returns {string} HTML du popup
   */
  function createPopupContent(signalement) {
    return `
      <div class="popup-content">
        <div class="popup-header">
          <span class="status-badge ${signalement.statut.toLowerCase()}">${STATUT_LABELS[signalement.statut]}</span>
          <h4>${signalement.titre}</h4>
        </div>
        <div class="popup-body">
          <p><strong>Adresse:</strong> ${signalement.adresse || 'Non renseignée'}</p>
          <p><strong>Date:</strong> ${formatDate(signalement.createdAt)}</p>
          ${signalement.description ? `<p>${signalement.description.substring(0, 100)}...</p>` : ''}
        </div>
        <div class="popup-footer">
          <button class="popup-detail-btn" data-id="${signalement.id}">Voir les détails →</button>
        </div>
      </div>
    `;
  }

  /**
   * Ajoute un marqueur pour un signalement
   * @param {Object} signalement - Données du signalement
   * @param {Function} onMarkerClick - Callback au clic
   * @returns {L.Marker} Le marqueur créé
   */
  function addMarker(signalement, onMarkerClick) {
    if (!signalement.latitude || !signalement.longitude || !map) return null;

    const color = STATUT_COLORS[signalement.statut] || '#6b7280';
    const icon = createMarkerIcon(color);

    const marker = L.marker([signalement.latitude, signalement.longitude], { icon })
      .addTo(map)
      .bindPopup(createPopupContent(signalement), {
        maxWidth: 300,
        className: 'signalement-popup',
      });

    // Gestionnaire de clic sur le marqueur
    marker.on('click', () => {
      setTimeout(() => {
        const detailButton = document.querySelector(`.popup-detail-btn[data-id="${signalement.id}"]`);
        if (detailButton) {
          detailButton.addEventListener('click', () => {
            if (onMarkerClick) {
              onMarkerClick(signalement.id);
            }
          });
        }
      }, 100);
    });

    markers.push(marker);
    return marker;
  }

  /**
   * Crée l'icône de position utilisateur
   * @returns {L.DivIcon} Icône de localisation
   */
  function createUserLocationIcon() {
    return L.divIcon({
      className: 'user-location-icon',
      html: `
        <div class="user-marker">
          <div class="user-marker-pulse"></div>
          <div class="user-marker-dot"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  /**
   * Efface tous les marqueurs
   */
  function clearMarkers() {
    markers.forEach(marker => {
      marker.remove();
    });
    markers.length = 0;
  }

  /**
   * Met à jour les marqueurs
   * @param {Array} signalements - Liste des signalements
   * @param {Function} onMarkerClick - Callback au clic
   */
  function updateMarkers(signalements, onMarkerClick) {
    clearMarkers();
    signalements.forEach(signalement => {
      addMarker(signalement, onMarkerClick);
    });
  }

  /**
   * Obtient tous les marqueurs
   * @returns {Array} Liste des marqueurs
   */
  function getMarkers() {
    return [...markers];
  }

  return {
    markers,
    addMarker,
    clearMarkers,
    updateMarkers,
    getMarkers,
    createUserLocationIcon,
    createMarkerIcon,
    createPopupContent,
  };
}

