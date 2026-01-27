import { STATUT_COLORS, STATUT_LABELS } from '../../utils/constants';
import './MapLegend.css';

const MapLegend = () => {
  return (
    <div className="map-legend">
      <h4>Légende</h4>
      <div className="legend-item">
        <span className="legend-marker" style={{ backgroundColor: STATUT_COLORS.NOUVEAU }}></span>
        <span>{STATUT_LABELS.NOUVEAU}</span>
      </div>
      <div className="legend-item">
        <span className="legend-marker" style={{ backgroundColor: STATUT_COLORS.EN_COURS }}></span>
        <span>{STATUT_LABELS.EN_COURS}</span>
      </div>
      <div className="legend-item">
        <span className="legend-marker" style={{ backgroundColor: STATUT_COLORS.TERMINE }}></span>
        <span>{STATUT_LABELS.TERMINE}</span>
      </div>
    </div>
  );
};

export default MapLegend;

