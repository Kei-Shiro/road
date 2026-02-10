import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { formatBudget, formatDate } from '../../utils/helpers';
import { TANA_CENTER, TANA_ZOOM, STATUT_COLORS, TILE_SERVER } from '../../utils/constants';

import 'leaflet/dist/leaflet.css';
import './MapView.css';

// ===============================
// Vérifier si le serveur offline est disponible
// ===============================
const checkOfflineServer = async () => {
  try {
    const response = await fetch(TILE_SERVER.OFFLINE_URL.replace('{z}/{x}/{y}', 'health'), {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true;
  } catch (error) {
    console.warn('Serveur de tuiles offline non disponible, utilisation du serveur en ligne');
    return false;
  }
};

// ===============================
// Fix icônes Leaflet par défaut
// ===============================
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ===============================
// Icône personnalisée selon statut
// ===============================
const createCustomIcon = (statut) => {
  const color = STATUT_COLORS[statut] || '#6b7280';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="custom-marker" style="background-color: ${color}">
        <i class="fas fa-exclamation"></i>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// ===============================
// Gestion du clic sur la carte
// ===============================
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });

  return null;
};

// ===============================
// Composant principal
// ===============================
const MapView = ({ signalements = [], onMapClick }) => {
  const [tileUrl, setTileUrl] = useState(TILE_SERVER.ONLINE_URL);
  const [isOffline, setIsOffline] = useState(false);

  // Vérifier la disponibilité du serveur offline au démarrage
  useEffect(() => {
    const checkServer = async () => {
      try {
        // Essayer de charger une tuile du serveur offline
        const testUrl = 'http://localhost:8081/health';
        const response = await fetch(testUrl, {
          method: 'GET',
          cache: 'no-cache',
        });
        if (response.ok) {
          setTileUrl(TILE_SERVER.OFFLINE_URL);
          setIsOffline(true);
          console.log('✅ Serveur de tuiles offline disponible');
        }
      } catch (error) {
        console.log('ℹ️ Serveur offline non disponible, utilisation OSM en ligne');
        setTileUrl(TILE_SERVER.ONLINE_URL);
        setIsOffline(false);
      }
    };
    checkServer();
  }, []);

  return (
      <div className="map-container">
        {/* Indicateur du mode de carte */}
        <div className={`map-mode-indicator ${isOffline ? 'offline' : 'online'}`}>
          <i className={`fas ${isOffline ? 'fa-database' : 'fa-wifi'}`}></i>
          {isOffline ? 'Carte Offline' : 'Carte Online'}
        </div>

        <MapContainer
            center={TANA_CENTER}
            zoom={TANA_ZOOM}
            className="leaflet-map"
        >
          <TileLayer
              url={tileUrl}
              attribution={TILE_SERVER.ATTRIBUTION}
              errorTileUrl={TILE_SERVER.ONLINE_URL.replace('{s}', 'a')}
          />

          <MapClickHandler onMapClick={onMapClick} />

          {signalements.map((sig) => (
              <Marker
                  key={sig.id}
                  position={[sig.latitude, sig.longitude]}
                  icon={createCustomIcon(sig.statut)}
              >
                <Popup className="custom-popup">
                  <div className="popup-content">
                    <div className="popup-header">
                  <span className={`status-badge ${sig.statut.toLowerCase()}`}>
                    {sig.statut}
                  </span>
                      <h4>{sig.titre}</h4>
                    </div>

                    <div className="popup-details">
                      <div className="popup-detail">
                        <span className="popup-detail-label">Adresse</span>
                        <span className="popup-detail-value">
                      {sig.adresse || 'Non renseignée'}
                    </span>
                      </div>

                      <div className="popup-detail">
                    <span className="popup-detail-label">
                      Date de signalement
                    </span>
                        <span className="popup-detail-value">
                      {formatDate(sig.createdAt)}
                    </span>
                      </div>

                      <div className="popup-detail">
                        <span className="popup-detail-label">Surface</span>
                        <span className="popup-detail-value">
                      {sig.surfaceImpactee
                          ? `${sig.surfaceImpactee} m²`
                          : 'Non mesurée'}
                    </span>
                      </div>

                      <div className="popup-detail">
                        <span className="popup-detail-label">Budget</span>
                        <span className="popup-detail-value">
                      {formatBudget(sig.budget)}
                    </span>
                      </div>

                      <div className="popup-detail">
                        <span className="popup-detail-label">Niveau</span>
                        <span className="popup-detail-value niveau-badge">
                          {sig.niveau || 1} / 10
                        </span>
                      </div>

                      {sig.entrepriseResponsable && (
                          <div className="popup-detail">
                            <span className="popup-detail-label">Entreprise</span>
                            <span className="popup-detail-value">
                        {sig.entrepriseResponsable}
                      </span>
                          </div>
                      )}

                      {sig.createdBy && (
                          <div className="popup-detail">
                            <span className="popup-detail-label">Signalé par</span>
                            <span className="popup-detail-value">
                        {sig.createdBy.prenom} {sig.createdBy.nom}
                      </span>
                          </div>
                      )}

                      {/* Lien vers les photos */}
                      <div className="popup-detail popup-photos">
                        <span className="popup-detail-label">Photo</span>
                        {sig.photoUrl ? (
                          <a
                            href={sig.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="popup-photo-link"
                          >
                            <i className="fas fa-camera"></i> Voir la photo
                          </a>
                        ) : (
                          <span className="popup-detail-value no-photo">
                            <i className="fas fa-image"></i> Aucune photo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
          ))}
        </MapContainer>
      </div>
  );
};

export default MapView;
