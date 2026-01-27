import { formatBudget, formatDate } from '../../utils/helpers';
import { STATUT_LABELS } from '../../utils/constants';
import './Dashboard.css';

const Dashboard = ({ signalements = [] }) => {
  const stats = {
    nouveau: signalements.filter((s) => s.statut === 'NOUVEAU').length,
    enCours: signalements.filter((s) => s.statut === 'EN_COURS').length,
    termine: signalements.filter((s) => s.statut === 'TERMINE').length,
    totalBudget: signalements.reduce(
        (sum, s) => sum + Number(s.budget || 0),
        0
    ),
  };

  return (
      <div className="dashboard-container">
        <h2>
          <i className="fas fa-tachometer-alt"></i> Tableau de bord
        </h2>

        {/* ================= STATS ================= */}
        <div className="dashboard-stats">
          <div className="dashboard-card">
            <div className="card-icon nouveau">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <div className="card-content">
              <span className="card-value">{stats.nouveau}</span>
              <span className="card-label">Nouveaux signalements</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon en-cours">
              <i className="fas fa-hard-hat"></i>
            </div>
            <div className="card-content">
              <span className="card-value">{stats.enCours}</span>
              <span className="card-label">En cours de travaux</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon termine">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="card-content">
              <span className="card-value">{stats.termine}</span>
              <span className="card-label">Travaux terminés</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-icon budget">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="card-content">
            <span className="card-value">
              {formatBudget(stats.totalBudget)}
            </span>
              <span className="card-label">Budget total alloué</span>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="table-container">
          <div className="table-header">
            <h3>Liste des signalements</h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Adresse</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Surface</th>
                <th>Budget</th>
                <th>Entreprise</th>
              </tr>
              </thead>

              <tbody>
              {signalements.map((sig) => (
                  <tr key={sig.id}>
                    <td>#{sig.id}</td>
                    <td>{sig.titre}</td>
                    <td>{sig.adresse || '-'}</td>
                    <td>{formatDate(sig.createdAt)}</td>
                    <td>
                    <span
                        className={`status-badge ${sig.statut.toLowerCase()}`}
                    >
                      {STATUT_LABELS[sig.statut]}
                    </span>
                    </td>
                    <td>
                      {sig.surfaceImpactee
                          ? `${sig.surfaceImpactee} m²`
                          : '-'}
                    </td>
                    <td>{formatBudget(sig.budget)}</td>
                    <td>{sig.entrepriseResponsable || '-'}</td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;
