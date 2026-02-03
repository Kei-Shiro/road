import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header/Header';
import MapView from './components/Map/MapView';
import MapLegend from './components/Map/MapLegend';
import StatsPanel from './components/Stats/StatsPanel';
import Dashboard from './components/Dashboard/Dashboard';
import AdminPanel from './components/Admin/AdminPanel';
import LoginModal from './components/Auth/LoginModal';
import RegisterModal from './components/Auth/RegisterModal';
import SignalementModal from './components/Signalement/SignalementModal';
import Toast from './components/Toast/Toast';
import ErrorMessage from './components/Error/ErrorMessage';
import { signalementService } from './services/signalementService';
import './App.css';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('carte');
  const [signalements, setSignalements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSignalementModal, setShowSignalementModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toasts, setToasts] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSignalements();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'login') {
        setShowLoginModal(true);
      } else if (hash === 'register') {
        setShowRegisterModal(true);
      } else if (hash === 'dashboard') {
        setCurrentPage('dashboard');
        setShowLoginModal(false);
        setShowRegisterModal(false);
      } else if (hash === 'admin') {
        setCurrentPage('admin');
        setShowLoginModal(false);
        setShowRegisterModal(false);
      } else if (hash === 'carte' || hash === '') {
        setCurrentPage('carte');
        setShowLoginModal(false);
        setShowRegisterModal(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadSignalements = async () => {
    try {
      setLoading(true);
      setError(null);
      const [signalementsResponse, statsResponse] = await Promise.all([
        signalementService.getAll(0, 100),
        signalementService.getStats().catch(() => null)
      ]);
      setSignalements(signalementsResponse.content || []);
      if (statsResponse) {
        setStats(statsResponse);
      }
    } catch (error) {
      console.error('Erreur de chargement des signalements:', error);
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setError('Le serveur backend n\'est pas accessible. Veuillez le démarrer.');
      } else {
        showToast('error', 'Impossible de charger les signalements');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (isAuthenticated && user?.role !== 'ADMIN') {
      setSelectedLocation(latlng);
      setShowSignalementModal(true);
    }
  };

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSignalementSuccess = () => {
    loadSignalements();
    showToast('success', 'Signalement créé avec succès !');
  };

  if (error && signalements.length === 0) {
    return <ErrorMessage message={error} onRetry={loadSignalements} />;
  }

  return (
    <div className="app">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="main-content">
        {currentPage === 'carte' && (
          <div className="page-carte">
            {loading ? (
              <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i> Chargement...
              </div>
            ) : (
              <>
                <MapView
                  signalements={signalements}
                  onMapClick={handleMapClick}
                />
                <StatsPanel signalements={signalements} />
                <MapLegend />

                {isAuthenticated && user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && (
                  <button
                    className="fab-button"
                    onClick={() => showToast('info', 'Cliquez sur la carte pour signaler un problème')}
                    title="Signaler un problème"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {currentPage === 'dashboard' && (
          <Dashboard signalements={signalements} />
        )}

        {currentPage === 'admin' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <AdminPanel
            signalements={signalements}
            stats={stats}
            onUpdate={loadSignalements}
            showToast={showToast}
          />
        )}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          window.location.hash = '';
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          window.location.hash = '';
        }}
      />

      <SignalementModal
        isOpen={showSignalementModal}
        onClose={() => {
          setShowSignalementModal(false);
          setSelectedLocation(null);
        }}
        location={selectedLocation}
        onSuccess={handleSignalementSuccess}
      />

      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

