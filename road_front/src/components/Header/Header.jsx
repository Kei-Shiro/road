import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = ({ currentPage, onPageChange }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState(currentPage || 'carte');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'carte';
      setActivePage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentPage && currentPage !== activePage) {
      setActivePage(currentPage);
    }
  }, [currentPage, activePage]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.hash = '#carte';
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    window.location.hash = `#${page}`;
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => handleNavClick('carte')} style={{ cursor: 'pointer' }}>
          <i className="fas fa-road"></i>
          <span>TravauxTana</span>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-link ${activePage === 'carte' || activePage === '' ? 'active' : ''}`}
            onClick={() => handleNavClick('carte')}
          >
            <i className="fas fa-map-marked-alt"></i> Carte
          </button>

          <button
            className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <i className="fas fa-chart-bar"></i> Tableau de bord
          </button>

          {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <button
              className={`nav-link ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              <i className="fas fa-cogs"></i> Administration
            </button>
          )}
        </nav>

        {isAuthenticated ? (
          <div className="user-menu">
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.prenom} {user?.nom}
                </span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Déconnexion
            </button>
          </div>
        ) : (
          <div className="user-actions">
            <button className="btn btn-outline" onClick={() => (window.location.hash = '#login')}>
              <i className="fas fa-sign-in-alt"></i> Connexion
            </button>
            <button className="btn btn-primary" onClick={() => (window.location.hash = '#register')}>
              <i className="fas fa-user-plus"></i> Inscription
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
