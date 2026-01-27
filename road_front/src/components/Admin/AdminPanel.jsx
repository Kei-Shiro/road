import { useState, useEffect } from 'react';
import { signalementService } from '../../services/signalementService';
import { formatDate } from '../../utils/helpers';
import { STATUT_LABELS } from '../../utils/constants';
import './AdminPanel.css';

const AdminPanel = ({ signalements, onUpdate, showToast }) => {
  const [activeTab, setActiveTab] = useState('signalements');
  const [users, setUsers] = useState([]);
  const [editingSignalement, setEditingSignalement] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Formulaire de création d'utilisateur
  const [newUserForm, setNewUserForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'VISITEUR'
  });

  // Formulaire d'édition de signalement
  const [editForm, setEditForm] = useState({
    statut: '',
    surfaceImpactee: '',
    budget: '',
    entrepriseResponsable: ''
  });

  // Mock users pour la démonstration
  useEffect(() => {
    setUsers([
      { id: 1, nom: 'Rakoto', prenom: 'Jean', email: 'jean.rakoto@email.mg', role: 'VISITEUR', status: 'actif', createdAt: '2025-10-15' },
      { id: 2, nom: 'Andria', prenom: 'Marie', email: 'marie.andria@email.mg', role: 'VISITEUR', status: 'actif', createdAt: '2025-11-02' },
      { id: 3, nom: 'Rabe', prenom: 'Paul', email: 'paul.rabe@email.mg', role: 'VISITEUR', status: 'bloque', createdAt: '2025-09-20' },
    ]);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (onUpdate) onUpdate();
      if (showToast) showToast('success', 'Synchronisation terminée !');
    } catch {
      if (showToast) showToast('error', 'Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleEditSignalement = (signalement) => {
    setEditingSignalement(signalement);
    setEditForm({
      statut: signalement.statut || 'NOUVEAU',
      surfaceImpactee: signalement.surfaceImpactee || '',
      budget: signalement.budget || '',
      entrepriseResponsable: signalement.entrepriseResponsable || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      await signalementService.update(editingSignalement.id, {
        ...editingSignalement,
        ...editForm,
        surfaceImpactee: editForm.surfaceImpactee ? parseFloat(editForm.surfaceImpactee) : null,
        budget: editForm.budget ? parseFloat(editForm.budget) : null
      });
      setEditingSignalement(null);
      if (onUpdate) onUpdate();
      if (showToast) showToast('success', 'Signalement mis à jour !');
    } catch {
      if (showToast) showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSignalement = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      try {
        await signalementService.delete(id);
        if (onUpdate) onUpdate();
        if (showToast) showToast('success', 'Signalement supprimé !');
      } catch {
        if (showToast) showToast('error', 'Erreur lors de la suppression');
      }
    }
  };

  const handleBlockUser = (userId) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, status: u.status === 'bloque' ? 'actif' : 'bloque' } : u
    ));
    const user = users.find(u => u.id === userId);
    if (showToast) {
      showToast('success', `Utilisateur ${user.status === 'bloque' ? 'débloqué' : 'bloqué'} !`);
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: users.length + 1,
      ...newUserForm,
      status: 'actif',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, newUser]);
    setNewUserForm({ nom: '', prenom: '', email: '', password: '', role: 'VISITEUR' });
    if (showToast) showToast('success', `Compte créé pour ${newUserForm.prenom} ${newUserForm.nom} !`);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2><i className="fas fa-cogs"></i> Panneau d'administration</h2>
        <button
          className={`btn btn-primary ${syncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={syncing}
        >
          <i className={`fas fa-sync-alt ${syncing ? 'fa-spin' : ''}`}></i>
          {syncing ? ' Synchronisation...' : ' Synchroniser'}
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'signalements' ? 'active' : ''}`}
          onClick={() => setActiveTab('signalements')}
        >
          <i className="fas fa-map-marker-alt"></i> Signalements
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
                  <th>Surface (m²)</th>
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
                    <td>{sig.surfaceImpactee || '-'}</td>
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

      {/* Tab Utilisateurs */}
      {activeTab === 'utilisateurs' && (
        <div className="tab-content">
          <div className="table-container">
            <h3>Gestion des utilisateurs</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date inscription</th>
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
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status === 'actif' ? 'Actif' : 'Bloqué'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.status === 'bloque' ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => handleBlockUser(user.id)}
                      >
                        {user.status === 'bloque' ? (
                          <><i className="fas fa-unlock"></i> Débloquer</>
                        ) : (
                          <><i className="fas fa-ban"></i> Bloquer</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  required
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-user-tag"></i> Rôle</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                >
                  <option value="VISITEUR">Visiteur</option>
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
                  <option value="NOUVEAU">Nouveau</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
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
                <label>Budget (Ariary)</label>
                <input
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({...editForm, budget: e.target.value})}
                />
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

