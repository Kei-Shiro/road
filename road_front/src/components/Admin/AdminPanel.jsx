import { useState, useEffect, useCallback } from 'react';
import { signalementService } from '../../services/signalementService';
import { authService } from '../../services/authService';
import { STATUT_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import TraitementStats from '../Stats/TraitementStats';
import './AdminPanel.css';

const AdminPanel = ({ signalements, stats, onUpdate, showToast }) => {
  const [activeTab, setActiveTab] = useState('signalements');
  const [users, setUsers] = useState([]);
  const [editingSignalement, setEditingSignalement] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [prixParM2, setPrixParM2] = useState('50000');
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Formulaire de création d'utilisateur
  const [newUserForm, setNewUserForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    role: 'UTILISATEUR'
  });

  // Formulaire d'édition de signalement
  const [editForm, setEditForm] = useState({
    statut: '',
    surfaceImpactee: '',
    niveau: 1,
    entrepriseResponsable: ''
  });

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const usersData = await authService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      if (showToast) showToast('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Charger le prix par m² depuis l'API
  const loadPrixParM2 = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const response = await signalementService.getPrixParM2();
      setPrixParM2(response.prixParM2?.toString() || '50000');
    } catch (error) {
      console.error('Erreur lors du chargement du prix par m²:', error);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadPrixParM2();
  }, [loadPrixParM2]);

  const handleEditSignalement = (signalement) => {
    setEditingSignalement(signalement);
    setEditForm({
      statut: signalement.statut || 'NOUVEAU',
      surfaceImpactee: signalement.surfaceImpactee || '',
      niveau: signalement.niveau || 1,
      entrepriseResponsable: signalement.entrepriseResponsable || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      await signalementService.update(editingSignalement.id, {
        ...editingSignalement,
        ...editForm,
        surfaceImpactee: editForm.surfaceImpactee ? parseFloat(editForm.surfaceImpactee) : null,
        niveau: editForm.niveau ? parseInt(editForm.niveau) : 1
      });
      setEditingSignalement(null);
      if (onUpdate) onUpdate();
      if (showToast) showToast('success', 'Signalement mis à jour !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      if (showToast) showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSignalement = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      try {
        await signalementService.delete(id);
        if (onUpdate) onUpdate();
        if (showToast) showToast('success', 'Signalement supprimé !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        if (showToast) showToast('error', 'Erreur lors de la suppression');
      }
    }
  };

  const handleUpdatePrixParM2 = async (e) => {
    e.preventDefault();
    try {
      await signalementService.updatePrixParM2(prixParM2);
      if (showToast) showToast('success', 'Prix par m² mis à jour !');
      if (onUpdate) onUpdate(); // Recalculer les budgets
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix par m²:', error);
      if (showToast) showToast('error', 'Erreur lors de la mise à jour du prix par m²');
    }
  };

  const handleUnlockUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.isLocked) {
      try {
        await authService.unlockAccountById(userId);
        await loadUsers();
        if (showToast) showToast('success', `Utilisateur ${user.prenom} ${user.nom} débloqué !`);
      } catch (error) {
        console.error('Erreur lors du déblocage:', error);
        if (showToast) showToast('error', 'Erreur lors du déblocage de l\'utilisateur');
      }
    } else {
      if (showToast) showToast('info', 'Le blocage manuel n\'est pas disponible. Le blocage se fait automatiquement après 3 tentatives échouées.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await authService.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        nom: newUserForm.nom,
        prenom: newUserForm.prenom,
        telephone: newUserForm.telephone || null,
        role: newUserForm.role
      });
      await loadUsers();
      setNewUserForm({ nom: '', prenom: '', email: '', password: '', telephone: '', role: 'UTILISATEUR' });
      if (showToast) showToast('success', `Compte créé pour ${newUserForm.prenom} ${newUserForm.nom} !`);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      const message = error.response?.data?.message || 'Erreur lors de la création du compte';
      if (showToast) showToast('error', message);
    }
  };

  return (
    <div className="admin-panel">
      <h2><i className="fas fa-cogs"></i> Panel d'administration</h2>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'signalements' ? 'active' : ''}`}
          onClick={() => setActiveTab('signalements')}
        >
          <i className="fas fa-map-marker-alt"></i> Signalements
        </button>
        <button
          className={`tab-btn ${activeTab === 'traitement' ? 'active' : ''}`}
          onClick={() => setActiveTab('traitement')}
        >
          <i className="fas fa-chart-line"></i> Statistiques
        </button>
        <button
          className={`tab-btn ${activeTab === 'utilisateurs' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilisateurs')}
        >
          <i className="fas fa-users"></i> Utilisateurs
        </button>
        <button
          className={`tab-btn ${activeTab === 'comptes' ? 'active' : ''}`}
          onClick={() => setActiveTab('comptes')}
        >
          <i className="fas fa-user-plus"></i> Créer un compte
        </button>
        <button
          className={`tab-btn ${activeTab === 'configuration' ? 'active' : ''}`}
          onClick={() => setActiveTab('configuration')}
        >
          <i className="fas fa-sliders-h"></i> Configuration
        </button>
      </div>

      {/* Tab Signalements */}
      {activeTab === 'signalements' && (
        <div className="tab-content">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Adresse</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Avancement</th>
                  <th>Surface (m²)</th>
                  <th>Niveau</th>
                  <th>Budget (Ar)</th>
                  <th>Entreprise</th>
                  <th>Actions</th>
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
                      <span className={`status-badge ${sig.statut?.toLowerCase()}`}>
                        {STATUT_LABELS[sig.statut] || sig.statut}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <span className="progress-text">{sig.pourcentageAvancement || 0}%</span>
                      </div>
                    </td>
                    <td>{sig.surfaceImpactee || '-'}</td>
                    <td>
                      <span className="niveau-badge">{sig.niveau || 1}/10</span>
                    </td>
                    <td>{sig.budget ? Number(sig.budget).toLocaleString() : '-'}</td>
                    <td>{sig.entrepriseResponsable || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-primary btn-icon"
                          onClick={() => handleEditSignalement(sig)}
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => handleDeleteSignalement(sig.id)}
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Statistiques de Traitement */}
      {activeTab === 'traitement' && (
        <div className="tab-content">
          <TraitementStats stats={stats} signalements={signalements} />
        </div>
      )}

      {/* Tab Utilisateurs */}
      {activeTab === 'utilisateurs' && (
        <div className="tab-content">
          <div className="table-container">
            <h3>Gestion des utilisateurs</h3>
            {loadingUsers ? (
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i> Chargement...
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Date inscription</th>
                    <th>Tentatives</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{user.prenom} {user.nom}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{user.loginAttempts || 0}</td>
                      <td>
                        <span className={`status-badge ${user.isLocked ? 'bloque' : 'actif'}`}>
                          {user.isLocked ? 'Bloqué' : 'Actif'}
                        </span>
                      </td>
                      <td>
                        {user.isLocked && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleUnlockUser(user.id)}
                          >
                            <i className="fas fa-unlock"></i> Débloquer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab Créer compte */}
      {activeTab === 'comptes' && (
        <div className="tab-content">
          <div className="form-container">
            <h3>Créer un nouveau compte utilisateur</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-row">
                <div className="form-group">
                  <label><i className="fas fa-user"></i> Prénom</label>
                  <input
                    type="text"
                    value={newUserForm.prenom}
                    onChange={(e) => setNewUserForm({...newUserForm, prenom: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-user"></i> Nom</label>
                  <input
                    type="text"
                    value={newUserForm.nom}
                    onChange={(e) => setNewUserForm({...newUserForm, nom: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-lock"></i> Mot de passe</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  minLength={6}
                  required
                />
                <small>Minimum 6 caractères</small>
              </div>
              <div className="form-group">
                <label><i className="fas fa-phone"></i> Téléphone</label>
                <input
                  type="tel"
                  value={newUserForm.telephone}
                  onChange={(e) => setNewUserForm({...newUserForm, telephone: e.target.value})}
                  placeholder="034 00 000 00"
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-user-tag"></i> Rôle</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                >
                  <option value="UTILISATEUR">Utilisateur Mobile</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                <i className="fas fa-user-plus"></i> Créer le compte
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Configuration */}
      {activeTab === 'configuration' && (
        <div className="tab-content">
          <div className="form-container config-container">
            <h3><i className="fas fa-sliders-h"></i> Configuration du système</h3>

            <div className="config-section">
              <h4>Calcul du budget</h4>
              <p className="config-description">
                Le budget est calculé automatiquement selon la formule:<br/>
                <code>Budget = Prix par m² × Niveau × Surface (m²)</code>
              </p>

              <form onSubmit={handleUpdatePrixParM2}>
                <div className="form-group">
                  <label><i className="fas fa-coins"></i> Prix forfaitaire par m² (Ariary)</label>
                  <input
                    type="number"
                    value={prixParM2}
                    onChange={(e) => setPrixParM2(e.target.value)}
                    min="0"
                    required
                  />
                  <small>Ce prix est multiplié par le niveau (1-10) et la surface pour calculer le budget total</small>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loadingConfig}>
                  <i className="fas fa-save"></i> Enregistrer
                </button>
              </form>
            </div>

            <div className="config-section">
              <h4>Niveaux de réparation</h4>
              <p className="config-description">
                Les niveaux de réparation vont de 1 à 10 et permettent de catégoriser la complexité des travaux:
              </p>
              <ul className="niveau-list">
                <li><strong>Niveau 1-3:</strong> Réparations légères (nids de poule, fissures superficielles)</li>
                <li><strong>Niveau 4-6:</strong> Réparations moyennes (resurfaçage partiel, drainage)</li>
                <li><strong>Niveau 7-9:</strong> Réparations importantes (reconstruction partielle)</li>
                <li><strong>Niveau 10:</strong> Reconstruction complète de la chaussée</li>
              </ul>
            </div>

            <div className="config-section">
              <h4>Exemple de calcul</h4>
              <div className="calculation-example">
                <p>Pour une surface de <strong>100 m²</strong> avec un niveau <strong>5</strong>:</p>
                <p className="calculation-formula">
                  {Number(prixParM2).toLocaleString()} Ar × 5 × 100 m² = <strong>{Number(prixParM2 * 5 * 100).toLocaleString()} Ar</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de signalement */}
      {editingSignalement && (
        <div className="modal-overlay" onClick={() => setEditingSignalement(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modifier le signalement #{editingSignalement.id}</h3>
              <button className="modal-close" onClick={() => setEditingSignalement(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Statut</label>
                <select
                  value={editForm.statut}
                  onChange={(e) => setEditForm({...editForm, statut: e.target.value})}
                >
                  <option value="NOUVEAU">Nouveau (0%)</option>
                  <option value="EN_COURS">En cours (50%)</option>
                  <option value="TERMINE">Terminé (100%)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Surface impactée (m²)</label>
                <input
                  type="number"
                  value={editForm.surfaceImpactee}
                  onChange={(e) => setEditForm({...editForm, surfaceImpactee: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Niveau de réparation (1-10)</label>
                <select
                  value={editForm.niveau}
                  onChange={(e) => setEditForm({...editForm, niveau: parseInt(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>Niveau {n}</option>
                  ))}
                </select>
                <small className="form-hint">
                  Budget calculé automatiquement: {prixParM2} Ar × {editForm.niveau || 1} × {editForm.surfaceImpactee || 0} m²
                  = <strong>{Number(prixParM2 * (editForm.niveau || 1) * (editForm.surfaceImpactee || 0)).toLocaleString()} Ar</strong>
                </small>
              </div>
              <div className="form-group">
                <label>Entreprise responsable</label>
                <select
                  value={editForm.entrepriseResponsable}
                  onChange={(e) => setEditForm({...editForm, entrepriseResponsable: e.target.value})}
                >
                  <option value="">Sélectionner une entreprise</option>
                  <option value="COLAS Madagascar">COLAS Madagascar</option>
                  <option value="SOGEA SATOM">SOGEA SATOM</option>
                  <option value="Madagascar TP">Madagascar TP</option>
                  <option value="ENTREPRISE RAZAFY">ENTREPRISE RAZAFY</option>
                  <option value="TRAVAUX PUBLICS MADA">TRAVAUX PUBLICS MADA</option>
                  <option value="BTP CONSTRUCTION">BTP CONSTRUCTION</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setEditingSignalement(null)}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={handleSaveEdit}>
                  <i className="fas fa-save"></i> Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

