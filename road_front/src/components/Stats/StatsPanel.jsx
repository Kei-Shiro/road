import { formatBudget, calculateProgress } from '../../utils/helpers';
import { STATUT_LABELS } from '../../utils/constants';
import './StatsPanel.css';

const StatsPanel = ({ signalements }) => {
  const stats = {
    total: signalements.length,
    nouveau: signalements.filter((s) => s.statut === 'NOUVEAU').length,
    enCours: signalements.filter((s) => s.statut === 'EN_COURS').length,
    termine: signalements.filter((s) => s.statut === 'TERMINE').length,
    totalSurface: signalements.reduce((sum, s) => sum + (s.surfaceImpactee || 0), 0),
    totalBudget: signalements.reduce((sum, s) => sum + Number(s.budget || 0), 0),
  };

  const progress = calculateProgress(signalements);

  return (
    <div className="stats-panel">
      <h3>
        <i className="fas fa-chart-pie"></i> Récapitulatif
      </h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Points signalés</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalSurface.toLocaleString()} m²</span>
          <span className="stat-label">Surface totale</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{progress}%</span>
          <span className="stat-label">Avancement</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{formatBudget(stats.totalBudget)}</span>
          <span className="stat-label">Budget total</span>
        </div>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default StatsPanel;

