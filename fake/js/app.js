// ============================================
// TRAVAUX TANA - Application JavaScript
// Application de suivi des travaux routiers
// ============================================

// État de l'application
let currentUser = null;
let map = null;
let markers = [];
let reports = [...mockReports];
let users = [...mockUsers];
let selectedLocation = null;
let filterMyReports = false;

// ============================================
// Initialisation
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeEventListeners();
    updateUI();
    renderDashboardTable();
});

// ============================================
// Carte Leaflet
// ============================================

function initializeMap() {
    // Créer la carte
    map = L.map('map').setView(TANA_CENTER, TANA_ZOOM);

    // Ajouter le layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Ajouter les marqueurs
    renderMarkers();

    // Événement de clic sur la carte (pour les utilisateurs connectés)
    map.on('click', onMapClick);
}

function renderMarkers(filtered = false) {
    // Supprimer les marqueurs existants
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // Filtrer si nécessaire
    let reportsToShow = reports;
    if (filtered && filterMyReports && currentUser) {
        reportsToShow = reports.filter(r => r.reportedBy === currentUser.id);
    }

    // Ajouter les nouveaux marqueurs
    reportsToShow.forEach(report => {
        const marker = createMarker(report);
        markers.push(marker);
        marker.addTo(map);
    });

    // Mettre à jour les stats
    updateStats(reportsToShow);
}

function createMarker(report) {
    // Créer l'icône personnalisée
    const statusClass = report.status === 'nouveau' ? 'marker-new'
        : report.status === 'en_cours' ? 'marker-in-progress'
        : 'marker-completed';

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker ${statusClass}">
                   <i class="fas ${problemTypes[report.type]?.icon || 'fa-exclamation'}"></i>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });

    // Créer le marqueur
    const marker = L.marker([report.lat, report.lng], { icon });

    // Ajouter le popup
    const popupContent = createPopupContent(report);
    marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'custom-popup'
    });

    return marker;
}

function createPopupContent(report) {
    const statusLabel = statuses[report.status]?.label || report.status;
    const statusColor = statuses[report.status]?.color || '#666';

    return `
        <div class="popup-content">
            <div class="popup-header">
                <span class="status-badge ${report.status}">${statusLabel}</span>
                <h4>${report.address}</h4>
            </div>
            <div class="popup-details">
                <div class="popup-detail">
                    <span class="popup-detail-label">Date de signalement</span>
                    <span class="popup-detail-value">${formatDate(report.date)}</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">Type</span>
                    <span class="popup-detail-value">${problemTypes[report.type]?.label || 'Autre'}</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">Surface</span>
                    <span class="popup-detail-value">${report.surface ? report.surface + ' m²' : 'Non mesurée'}</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">Budget alloué</span>
                    <span class="popup-detail-value">${formatBudget(report.budget)}</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">Entreprise</span>
                    <span class="popup-detail-value">${report.company || 'Non assignée'}</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-detail-label">Signalé par</span>
                    <span class="popup-detail-value">${report.reportedByName}</span>
                </div>
            </div>
        </div>
    `;
}

function onMapClick(e) {
    if (!currentUser || currentUser.role === 'manager') return;

    selectedLocation = {
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6)
    };

    document.getElementById('reportLat').value = selectedLocation.lat;
    document.getElementById('reportLng').value = selectedLocation.lng;

    openModal('modalReport');
}

function updateStats(reportsData = reports) {
    const stats = calculateStats(reportsData);

    document.getElementById('statPoints').textContent = stats.total;
    document.getElementById('statSurface').textContent = stats.totalSurface.toLocaleString() + ' m²';
    document.getElementById('statProgress').textContent = stats.progress + '%';
    document.getElementById('statBudget').textContent = formatBudget(stats.totalBudget);
    document.getElementById('progressBar').style.width = stats.progress + '%';
}

// ============================================
// Gestion des événements
// ============================================

function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });

    // Boutons d'authentification
    document.getElementById('btnLogin').addEventListener('click', () => openModal('modalLogin'));
    document.getElementById('btnRegister').addEventListener('click', () => openModal('modalRegister'));
    document.getElementById('btnLogout').addEventListener('click', logout);

    // Formulaires
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('reportForm').addEventListener('submit', handleReport);
    document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);
    document.getElementById('editReportForm').addEventListener('submit', handleEditReport);

    // Fermeture des modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.close;
            closeModal(modalId);
        });
    });

    // Fermeture modal sur fond
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Lien vers inscription
    document.getElementById('linkToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('modalLogin');
        showToast('info', 'Contactez un manager pour créer un compte utilisateur.');
    });

    // Bouton FAB pour signalement
    document.getElementById('btnAddReport').addEventListener('click', () => {
        showToast('info', 'Cliquez sur la carte pour sélectionner l\'emplacement du problème.');
    });

    // Filtre utilisateur
    document.getElementById('filterMyReports').addEventListener('change', (e) => {
        filterMyReports = e.target.checked;
        renderMarkers(true);
    });

    // Tabs Manager
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Bouton synchronisation
    document.getElementById('btnSync').addEventListener('click', handleSync);

    // Filtres tableau
    document.getElementById('searchInput').addEventListener('input', filterDashboardTable);
    document.getElementById('statusFilter').addEventListener('change', filterDashboardTable);
}

// ============================================
// Navigation
// ============================================

function navigateTo(page) {
    // Mise à jour des liens
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Afficher la bonne page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (page === 'map') {
        document.getElementById('pageCarte').classList.add('active');
        setTimeout(() => map.invalidateSize(), 100);
    } else if (page === 'dashboard') {
        document.getElementById('pageDashboard').classList.add('active');
    } else if (page === 'manager') {
        document.getElementById('pageManager').classList.add('active');
        renderManagerTables();
    }
}

// ============================================
// Authentification
// ============================================

function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Vérifier si c'est le manager
    if (email === mockManager.email && password === mockManager.password) {
        currentUser = mockManager;
        closeModal('modalLogin');
        showToast('success', 'Bienvenue, Admin !');
        updateUI();
        return;
    }

    // Vérifier les utilisateurs
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        if (user.status === 'bloque') {
            showToast('error', 'Votre compte est bloqué. Contactez un administrateur.');
            return;
        }
        currentUser = user;
        closeModal('modalLogin');
        showToast('success', `Bienvenue, ${user.name} !`);
        updateUI();
        return;
    }

    showToast('error', 'Email ou mot de passe incorrect.');
}

function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    if (password !== passwordConfirm) {
        showToast('error', 'Les mots de passe ne correspondent pas.');
        return;
    }

    // Simuler la création du compte manager
    const newManager = {
        id: 'manager_' + Date.now(),
        name: name,
        email: email,
        role: 'manager'
    };

    currentUser = newManager;
    closeModal('modalRegister');
    showToast('success', 'Compte Manager créé avec succès !');
    updateUI();
}

function logout() {
    currentUser = null;
    filterMyReports = false;
    document.getElementById('filterMyReports').checked = false;
    updateUI();
    navigateTo('map');
    showToast('info', 'Vous êtes déconnecté.');
}

function updateUI() {
    const userActions = document.querySelector('.user-actions');
    const userMenu = document.getElementById('userMenu');
    const fabButton = document.getElementById('btnAddReport');
    const userFilters = document.getElementById('userFilters');

    if (currentUser) {
        userActions.classList.add('hidden');
        userMenu.classList.remove('hidden');
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role === 'manager' ? 'Manager' : 'Utilisateur';

        // Afficher le bouton FAB pour les utilisateurs (pas les managers)
        if (currentUser.role !== 'manager') {
            fabButton.classList.remove('hidden');
            userFilters.classList.remove('hidden');
        } else {
            fabButton.classList.add('hidden');
            userFilters.classList.add('hidden');
        }

        // Ajouter le menu manager
        updateNavigation();
    } else {
        userActions.classList.remove('hidden');
        userMenu.classList.add('hidden');
        fabButton.classList.add('hidden');
        userFilters.classList.add('hidden');
        updateNavigation();
    }

    renderMarkers(filterMyReports);
}

function updateNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    const managerLink = navMenu.querySelector('[data-page="manager"]');

    if (currentUser && currentUser.role === 'manager') {
        if (!managerLink) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.dataset.page = 'manager';
            link.innerHTML = '<i class="fas fa-cogs"></i> Administration';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('manager');
            });
            navMenu.appendChild(link);
        }
    } else {
        if (managerLink) {
            managerLink.remove();
        }
    }
}

// ============================================
// Signalements
// ============================================

function handleReport(e) {
    e.preventDefault();

    const newReport = {
        id: reports.length + 1,
        lat: parseFloat(document.getElementById('reportLat').value),
        lng: parseFloat(document.getElementById('reportLng').value),
        address: document.getElementById('reportAddress').value,
        type: document.getElementById('reportType').value,
        description: document.getElementById('reportDescription').value,
        status: 'nouveau',
        date: new Date().toISOString().split('T')[0],
        surface: null,
        budget: null,
        company: null,
        reportedBy: currentUser.id,
        reportedByName: currentUser.name
    };

    reports.push(newReport);
    closeModal('modalReport');
    document.getElementById('reportForm').reset();

    renderMarkers(filterMyReports);
    renderDashboardTable();

    showToast('success', 'Signalement envoyé avec succès !');
}

// ============================================
// Tableau de bord
// ============================================

function renderDashboardTable() {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';

    reports.forEach(report => {
        const row = createTableRow(report);
        tbody.appendChild(row);
    });
}

function createTableRow(report) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>#${report.id}</td>
        <td>${report.address}</td>
        <td>${formatDate(report.date)}</td>
        <td><span class="status-badge ${report.status}">${statuses[report.status]?.label}</span></td>
        <td>${report.surface ? report.surface + ' m²' : '-'}</td>
        <td>${formatBudget(report.budget)}</td>
        <td>${report.company || '-'}</td>
    `;
    return tr;
}

function filterDashboardTable() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    const filtered = reports.filter(report => {
        const matchSearch = report.address.toLowerCase().includes(search) ||
                          report.company?.toLowerCase().includes(search);
        const matchStatus = !status || report.status === status;
        return matchSearch && matchStatus;
    });

    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';
    filtered.forEach(report => {
        tbody.appendChild(createTableRow(report));
    });
}

// ============================================
// Administration (Manager)
// ============================================

function switchTab(tab) {
    // Mettre à jour les boutons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Afficher le bon contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const tabContent = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

function renderManagerTables() {
    renderManagerReportsTable();
    renderUsersTable();
}

function renderManagerReportsTable() {
    const tbody = document.getElementById('managerReportsTable');
    tbody.innerHTML = '';

    reports.forEach(report => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${report.id}</td>
            <td>${report.address}</td>
            <td>${formatDate(report.date)}</td>
            <td><span class="status-badge ${report.status}">${statuses[report.status]?.label}</span></td>
            <td>${report.surface || '-'}</td>
            <td>${report.budget ? report.budget.toLocaleString() : '-'}</td>
            <td>${report.company || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-icon" onclick="editReport(${report.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deleteReport(${report.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${formatDate(user.dateCreated)}</td>
            <td><span class="status-badge ${user.status}">${user.status === 'actif' ? 'Actif' : 'Bloqué'}</span></td>
            <td>
                <div class="action-buttons">
                    ${user.status === 'bloque' ? 
                        `<button class="btn btn-success btn-sm" onclick="unblockUser('${user.id}')">
                            <i class="fas fa-unlock"></i> Débloquer
                        </button>` :
                        `<button class="btn btn-warning btn-sm" onclick="blockUser('${user.id}')">
                            <i class="fas fa-ban"></i> Bloquer
                        </button>`
                    }
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editReport(id) {
    const report = reports.find(r => r.id === id);
    if (!report) return;

    document.getElementById('editReportId').value = report.id;
    document.getElementById('editReportAddress').value = report.address;
    document.getElementById('editReportStatus').value = report.status;
    document.getElementById('editReportSurface').value = report.surface || '';
    document.getElementById('editReportBudget').value = report.budget || '';
    document.getElementById('editReportCompany').value = report.company || '';
    document.getElementById('editReportNotes').value = '';

    openModal('modalEditReport');
}

function handleEditReport(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editReportId').value);
    const report = reports.find(r => r.id === id);

    if (report) {
        report.address = document.getElementById('editReportAddress').value;
        report.status = document.getElementById('editReportStatus').value;
        report.surface = parseFloat(document.getElementById('editReportSurface').value) || null;
        report.budget = parseInt(document.getElementById('editReportBudget').value) || null;
        report.company = document.getElementById('editReportCompany').value || null;

        closeModal('modalEditReport');
        renderManagerTables();
        renderMarkers();
        renderDashboardTable();
        showToast('success', 'Signalement mis à jour avec succès !');
    }
}

function deleteReport(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
        reports = reports.filter(r => r.id !== id);
        renderManagerTables();
        renderMarkers();
        renderDashboardTable();
        showToast('success', 'Signalement supprimé.');
    }
}

function blockUser(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        user.status = 'bloque';
        renderUsersTable();
        showToast('warning', `Utilisateur ${user.name} bloqué.`);
    }
}

function unblockUser(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        user.status = 'actif';
        renderUsersTable();
        showToast('success', `Utilisateur ${user.name} débloqué.`);
    }
}

function handleCreateUser(e) {
    e.preventDefault();

    const newUser = {
        id: 'user' + (users.length + 1),
        name: document.getElementById('newUserName').value,
        email: document.getElementById('newUserEmail').value,
        role: document.getElementById('newUserRole').value,
        status: 'actif',
        dateCreated: new Date().toISOString().split('T')[0],
        reportsCount: 0
    };

    users.push(newUser);
    document.getElementById('createUserForm').reset();
    renderUsersTable();
    showToast('success', `Compte créé pour ${newUser.name} !`);
}

function handleSync() {
    const btn = document.getElementById('btnSync');
    btn.classList.add('btn-sync-active');
    btn.disabled = true;

    // Simuler la synchronisation
    setTimeout(() => {
        btn.classList.remove('btn-sync-active');
        btn.disabled = false;
        showToast('success', 'Synchronisation terminée ! Données mises à jour.');
    }, 2000);
}

// ============================================
// Modals
// ============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(type, message) {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        warning: 'fa-exclamation',
        info: 'fa-info'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Fermeture au clic
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto-fermeture après 4 secondes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Exposer certaines fonctions globalement pour les onclick
window.editReport = editReport;
window.deleteReport = deleteReport;
window.blockUser = blockUser;
window.unblockUser = unblockUser;

