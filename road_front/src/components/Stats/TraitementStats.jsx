import { formatDateTime } from '../../utils/helpers';
import './TraitementStats.css';

const TraitementStats = ({ stats, signalements }) => {
  const traitement = stats?.traitement || {};

  // Fonction pour formater le temps en heures/jours
  const formatDuree = (heures) => {
    if (!heures || heures === 0) return '-';
    if (heures < 24) {
      return `${Math.round(heures)}h`;
    }
    const jours = Math.floor(heures / 24);
    const heuresRestantes = Math.round(heures % 24);
    if (heuresRestantes === 0) {
      return `${jours}j`;
    }
    return `${jours}j ${heuresRestantes}h`;
  };

  // Filtrer les signalements par statut pour le tableau détaillé
  const signalementsTermines = signalements?.filter(s => s.statut === 'TERMINE') || [];
  const signalementsEnCours = signalements?.filter(s => s.statut === 'EN_COURS') || [];
  const signalementsNouveau = signalements?.filter(s => s.statut === 'NOUVEAU') || [];

  // Calcul local du temps de traitement si les données backend ne sont pas disponibles
  const calculerTempsTraitement = (sig) => {
    if (!sig.dateNouveau || !sig.dateTermine) return null;
    const debut = new Date(sig.dateNouveau);
    const fin = new Date(sig.dateTermine);
    const diffMs = fin - debut;
    return diffMs / (1000 * 60 * 60); // Convertir en heures
  };

  return (
    <div className="traitement-stats-container">
      <h3>
        <i className="fas fa-chart-line"></i> Statistiques de Traitement des Travaux
      </h3>

      {/* Cartes de résumé */}
      <div className="traitement-summary-grid">
        <div className="traitement-card nouveau">
          <div className="traitement-card-icon">
            <i className="fas fa-plus-circle"></i>
          </div>
          <div className="traitement-card-content">
            <span className="traitement-card-value">{signalementsNouveau.length}</span>
            <span className="traitement-card-label">Nouveau (0%)</span>
          </div>
        </div>

        <div className="traitement-card en-cours">
          <div className="traitement-card-icon">
            <i className="fas fa-spinner"></i>
          </div>
          <div className="traitement-card-content">
            <span className="traitement-card-value">{signalementsEnCours.length}</span>
            <span className="traitement-card-label">En cours (50%)</span>
          </div>
        </div>

        <div className="traitement-card termine">
          <div className="traitement-card-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="traitement-card-content">
            <span className="traitement-card-value">{signalementsTermines.length}</span>
            <span className="traitement-card-label">Terminé (100%)</span>
          </div>
        </div>
      </div>

      {/* Statistiques de temps moyen */}
      <div className="temps-moyen-section">
        <h4><i className="fas fa-clock"></i> Temps Moyen de Traitement</h4>
        <div className="temps-moyen-grid">
          <div className="temps-moyen-item">
            <div className="temps-moyen-arrow">
              <span className="statut-label nouveau">Nouveau</span>
              <i className="fas fa-arrow-right"></i>
              <span className="statut-label en-cours">En cours</span>
            </div>
            <span className="temps-moyen-value">
              {formatDuree(traitement.tempsNouveauAEnCours)}
            </span>
          </div>

          <div className="temps-moyen-item">
            <div className="temps-moyen-arrow">
              <span className="statut-label en-cours">En cours</span>
              <i className="fas fa-arrow-right"></i>
              <span className="statut-label termine">Terminé</span>
            </div>
            <span className="temps-moyen-value">
              {formatDuree(traitement.tempsEnCoursATermine)}
            </span>
          </div>

          <div className="temps-moyen-item total">
            <div className="temps-moyen-arrow">
              <span className="statut-label nouveau">Nouveau</span>
              <i className="fas fa-long-arrow-alt-right"></i>
              <span className="statut-label termine">Terminé</span>
            </div>
            <span className="temps-moyen-value">
              {formatDuree(traitement.tempsTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau détaillé des travaux */}
      <div className="traitement-table-section">
        <h4><i className="fas fa-table"></i> Détail des Travaux par Étape</h4>
        <div className="table-container">
          <table className="traitement-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Date Création</th>
                <th>Date En Cours</th>
                <th>Date Terminé</th>
                <th>Avancement</th>
                <th>Durée Totale</th>
                <th>Entreprise</th>
              </tr>
            </thead>
            <tbody>
              {signalements?.map((sig) => {
                const tempsTraitement = calculerTempsTraitement(sig);
                return (
                  <tr key={sig.id} className={`row-${sig.statut?.toLowerCase()}`}>
                    <td>#{sig.id}</td>
                    <td>{sig.titre}</td>
                    <td>
                      <div className="date-cell">
                        {formatDateTime(sig.dateNouveau || sig.createdAt)}
                        <span className="date-label">0%</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {sig.dateEnCours ? formatDateTime(sig.dateEnCours) : '-'}
                        {sig.dateEnCours && <span className="date-label">50%</span>}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {sig.dateTermine ? formatDateTime(sig.dateTermine) : '-'}
                        {sig.dateTermine && <span className="date-label">100%</span>}
                      </div>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div
                          className="mini-progress-bar"
                          style={{ '--progress': `${sig.pourcentageAvancement || 0}%` }}
                        >
                          <div className="mini-progress-fill"></div>
                        </div>
                        <span className="progress-text">{sig.pourcentageAvancement || 0}%</span>
                      </div>
                    </td>
                    <td>{tempsTraitement ? formatDuree(tempsTraitement) : '-'}</td>
                    <td>{sig.entrepriseResponsable || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TraitementStats;

