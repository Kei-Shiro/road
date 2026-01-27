import { useState } from 'react';
import { signalementService } from '../../services/signalementService';
import '../Auth/LoginModal.css';

const SignalementModal = ({ isOpen, onClose, onSuccess, location }) => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    latitude: location?.lat || '',
    longitude: location?.lng || '',
    adresse: '',
    type: 'REPARATION',
    priorite: 'MOYENNE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signalementService.create({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du signalement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouveau signalement</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="titre">
              <i className="fas fa-heading"></i> Titre
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Ex: Nid de poule sur Avenue de l'Indépendance"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <i className="fas fa-align-left"></i> Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez le problème..."
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adresse">
              <i className="fas fa-map-marker-alt"></i> Adresse
            </label>
            <input
              type="text"
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Ex: Avenue de l'Indépendance, Analakely"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">
                <i className="fas fa-location-arrow"></i> Latitude
              </label>
              <input
                type="number"
                step="any"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">
                <i className="fas fa-location-arrow"></i> Longitude
              </label>
              <input
                type="number"
                step="any"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">
                <i className="fas fa-tools"></i> Type de travaux
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="REPARATION">Réparation</option>
                <option value="CONSTRUCTION">Construction</option>
                <option value="ENTRETIEN">Entretien</option>
                <option value="EXTENSION">Extension</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priorite">
                <i className="fas fa-exclamation-triangle"></i> Priorité
              </label>
              <select
                id="priorite"
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
              >
                <option value="BASSE">Basse</option>
                <option value="MOYENNE">Moyenne</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Envoi...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Envoyer le signalement
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignalementModal;

