import './ErrorBoundary.css';

const ErrorMessage = ({ message, onRetry }) => {
  return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>

          <h2>Connexion au serveur impossible</h2>

          <p>
            {message ||
                'Impossible de se connecter au backend. Assurez-vous que le serveur est démarré sur le port 8080.'}
          </p>

          <div className="error-actions">
            <button className="btn btn-primary" onClick={onRetry}>
              <i className="fas fa-sync-alt"></i> Réessayer
            </button>

            <a
                href="http://localhost:8080/swagger-ui.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
            >
              <i className="fas fa-book"></i> Documentation API
            </a>
          </div>

          <div className="error-help">
            <h4>Pour démarrer le backend :</h4>
            <ol>
              <li>Ouvrir un terminal dans le dossier <code>road_back</code></li>
              <li>Exécuter : <code>mvnw spring-boot:run</code></li>
              <li>Attendre le message <code>Started RoadBackApplication</code></li>
              <li>Cliquer sur « Réessayer » ci-dessus</li>
            </ol>
          </div>
        </div>
      </div>
  );
};

export default ErrorMessage;
