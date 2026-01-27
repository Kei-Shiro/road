import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <i className="fas fa-road"></i>
                    <span>TravauxTana</span>
                </div>

                <nav className="nav-menu">
                    <a href="#carte" className="nav-link active">
                        <i className="fas fa-map-marked-alt"></i> Carte
                    </a>

                    <a href="#dashboard" className="nav-link">
                        <i className="fas fa-chart-bar"></i> Tableau de bord
                    </a>

                    {user && user.role === 'ADMIN' && (
                        <a href="#admin" className="nav-link">
                            <i className="fas fa-cogs"></i> Administration
                        </a>
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

                        <button
                            className="btn btn-outline btn-sm"
                            onClick={handleLogout}
                        >
                            <i className="fas fa-sign-out-alt"></i> Déconnexion
                        </button>
                    </div>
                ) : (
                    <div className="user-actions">
                        <button
                            className="btn btn-outline"
                            onClick={() => (window.location.hash = '#login')}
                        >
                            <i className="fas fa-sign-in-alt"></i> Connexion
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={() => (window.location.hash = '#register')}
                        >
                            <i className="fas fa-user-plus"></i> Inscription
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
