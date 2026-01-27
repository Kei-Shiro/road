// ============================================
// TRAVAUX TANA - Données Fictives
// Application de suivi des travaux routiers
// ============================================

// Coordonnées centre Antananarivo
const TANA_CENTER = [-18.8792, 47.5079];
const TANA_ZOOM = 14;

// Données des signalements fictifs
const mockReports = [
    {
        id: 1,
        lat: -18.8750,
        lng: 47.5200,
        address: "Avenue de l'Indépendance",
        type: "nid_poule",
        description: "Plusieurs nids de poule profonds sur la voie principale",
        status: "en_cours",
        date: "2026-01-15",
        surface: 45.5,
        budget: 15000000,
        company: "COLAS Madagascar",
        reportedBy: "user1",
        reportedByName: "Jean Rakoto"
    },
    {
        id: 2,
        lat: -18.8820,
        lng: 47.5150,
        address: "Rue Ravoninahitriniarivo",
        type: "fissure",
        description: "Grande fissure traversant la route sur 20 mètres",
        status: "nouveau",
        date: "2026-01-18",
        surface: 120.0,
        budget: null,
        company: null,
        reportedBy: "user2",
        reportedByName: "Marie Andria"
    },
    {
        id: 3,
        lat: -18.8700,
        lng: 47.5050,
        address: "Boulevard de l'Europe, Isoraka",
        type: "effondrement",
        description: "Effondrement partiel de la chaussée suite aux pluies",
        status: "en_cours",
        date: "2026-01-10",
        surface: 85.0,
        budget: 25000000,
        company: "SOGEA SATOM",
        reportedBy: "user1",
        reportedByName: "Jean Rakoto"
    },
    {
        id: 4,
        lat: -18.8680,
        lng: 47.5180,
        address: "Analakely - Place du marché",
        type: "inondation",
        description: "Zone régulièrement inondée, drainage défaillant",
        status: "termine",
        date: "2025-12-20",
        surface: 200.0,
        budget: 35000000,
        company: "ENTREPRISE RAZAFY",
        reportedBy: "user3",
        reportedByName: "Paul Rabe"
    },
    {
        id: 5,
        lat: -18.8850,
        lng: 47.5100,
        address: "Pont de Behoririka",
        type: "fissure",
        description: "Fissures multiples sur le tablier du pont",
        status: "nouveau",
        date: "2026-01-17",
        surface: 65.0,
        budget: null,
        company: null,
        reportedBy: "user2",
        reportedByName: "Marie Andria"
    },
    {
        id: 6,
        lat: -18.8760,
        lng: 47.5250,
        address: "67 Ha, près du stade",
        type: "nid_poule",
        description: "Série de nids de poule dangereux",
        status: "en_cours",
        date: "2026-01-08",
        surface: 55.0,
        budget: 12000000,
        company: "TRAVAUX PUBLICS MADA",
        reportedBy: "user1",
        reportedByName: "Jean Rakoto"
    },
    {
        id: 7,
        lat: -18.8900,
        lng: 47.5180,
        address: "Lac Anosy - Boulevard",
        type: "autre",
        description: "Revêtement complètement dégradé sur 50m",
        status: "termine",
        date: "2025-12-15",
        surface: 180.0,
        budget: 28000000,
        company: "COLAS Madagascar",
        reportedBy: "user3",
        reportedByName: "Paul Rabe"
    },
    {
        id: 8,
        lat: -18.8720,
        lng: 47.5120,
        address: "Gare Soarano",
        type: "effondrement",
        description: "Affaissement de la route près de la gare",
        status: "en_cours",
        date: "2026-01-12",
        surface: 75.0,
        budget: 18000000,
        company: "BTP CONSTRUCTION",
        reportedBy: "user2",
        reportedByName: "Marie Andria"
    },
    {
        id: 9,
        lat: -18.8800,
        lng: 47.5220,
        address: "Ambohijatovo",
        type: "nid_poule",
        description: "Nids de poule sur la montée",
        status: "nouveau",
        date: "2026-01-19",
        surface: 40.0,
        budget: null,
        company: null,
        reportedBy: "user1",
        reportedByName: "Jean Rakoto"
    },
    {
        id: 10,
        lat: -18.8650,
        lng: 47.5090,
        address: "Tsaralalana",
        type: "inondation",
        description: "Problème de drainage récurrent",
        status: "en_cours",
        date: "2026-01-05",
        surface: 150.0,
        budget: 22000000,
        company: "SOGEA SATOM",
        reportedBy: "user3",
        reportedByName: "Paul Rabe"
    },
    {
        id: 11,
        lat: -18.8780,
        lng: 47.5030,
        address: "Anosy - Route circulaire",
        type: "fissure",
        description: "Fissures longitudinales importantes",
        status: "termine",
        date: "2025-11-28",
        surface: 95.0,
        budget: 15000000,
        company: "ENTREPRISE RAZAFY",
        reportedBy: "user2",
        reportedByName: "Marie Andria"
    },
    {
        id: 12,
        lat: -18.8830,
        lng: 47.5070,
        address: "Ampefiloha",
        type: "autre",
        description: "Marquage au sol effacé et bordures cassées",
        status: "nouveau",
        date: "2026-01-20",
        surface: 110.0,
        budget: null,
        company: null,
        reportedBy: "user1",
        reportedByName: "Jean Rakoto"
    }
];

// Données des utilisateurs fictifs
const mockUsers = [
    {
        id: "user1",
        name: "Jean Rakoto",
        email: "jean.rakoto@email.mg",
        password: "user123",
        role: "utilisateur",
        status: "actif",
        dateCreated: "2025-10-15",
        reportsCount: 5
    },
    {
        id: "user2",
        name: "Marie Andria",
        email: "marie.andria@email.mg",
        password: "user123",
        role: "utilisateur",
        status: "actif",
        dateCreated: "2025-11-02",
        reportsCount: 4
    },
    {
        id: "user3",
        name: "Paul Rabe",
        email: "paul.rabe@email.mg",
        password: "user123",
        role: "utilisateur",
        status: "bloque",
        dateCreated: "2025-09-20",
        reportsCount: 3
    },
    {
        id: "user4",
        name: "Hery Razafindrakoto",
        email: "hery.razaf@email.mg",
        password: "user123",
        role: "utilisateur",
        status: "actif",
        dateCreated: "2025-12-01",
        reportsCount: 0
    },
    {
        id: "user5",
        name: "Nirina Rasoamanana",
        email: "nirina.rasoa@email.mg",
        password: "user123",
        role: "utilisateur",
        status: "bloque",
        dateCreated: "2025-08-15",
        reportsCount: 2
    }
];

// Manager par défaut
const mockManager = {
    id: "manager1",
    name: "Admin TravauxTana",
    email: "admin@travauxana.mg",
    password: "admin123",
    role: "manager"
};

// Entreprises partenaires
const companies = [
    "COLAS Madagascar",
    "SOGEA SATOM",
    "ENTREPRISE RAZAFY",
    "TRAVAUX PUBLICS MADA",
    "BTP CONSTRUCTION"
];

// Types de problèmes
const problemTypes = {
    nid_poule: { label: "Nid de poule", icon: "fa-circle-exclamation" },
    fissure: { label: "Fissure", icon: "fa-road-barrier" },
    effondrement: { label: "Effondrement", icon: "fa-triangle-exclamation" },
    inondation: { label: "Zone inondable", icon: "fa-water" },
    autre: { label: "Autre", icon: "fa-question-circle" }
};

// Statuts
const statuses = {
    nouveau: { label: "Nouveau", color: "#ef4444" },
    en_cours: { label: "En cours", color: "#f59e0b" },
    termine: { label: "Terminé", color: "#10b981" }
};

// Fonction pour formater le budget
function formatBudget(amount) {
    if (!amount) return "Non défini";
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(0) + "M Ar";
    }
    return amount.toLocaleString() + " Ar";
}

// Fonction pour formater la date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Calcul des statistiques
function calculateStats(reports) {
    const stats = {
        total: reports.length,
        nouveau: 0,
        en_cours: 0,
        termine: 0,
        totalSurface: 0,
        totalBudget: 0
    };

    reports.forEach(report => {
        stats[report.status]++;
        stats.totalSurface += report.surface || 0;
        stats.totalBudget += report.budget || 0;
    });

    stats.progress = stats.total > 0
        ? Math.round((stats.termine / stats.total) * 100)
        : 0;

    return stats;
}

