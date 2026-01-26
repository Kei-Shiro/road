import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import reportService from '@/services/reportService';

// Données fictives pour le mode hors-ligne
const mockReports = [
    { id: 1, lat: -18.8750, lng: 47.5200, address: "Avenue de l'Indépendance", type: "NID_POULE", description: "Plusieurs nids de poule profonds", status: "EN_COURS", date: "2026-01-15", surface: 45.5, budget: 15000000, company: "COLAS Madagascar", reportedById: 1, reportedByName: "Jean Rakoto" },
    { id: 2, lat: -18.8820, lng: 47.5150, address: "Rue Ravoninahitriniarivo", type: "FISSURE", description: "Grande fissure traversant la route", status: "NOUVEAU", date: "2026-01-18", surface: 120.0, budget: null, company: null, reportedById: 2, reportedByName: "Marie Andria" },
    { id: 3, lat: -18.8700, lng: 47.5050, address: "Boulevard de l'Europe, Isoraka", type: "EFFONDREMENT", description: "Effondrement partiel de la chaussée", status: "EN_COURS", date: "2026-01-10", surface: 85.0, budget: 25000000, company: "SOGEA SATOM", reportedById: 1, reportedByName: "Jean Rakoto" },
    { id: 4, lat: -18.8680, lng: 47.5180, address: "Analakely - Place du marché", type: "INONDATION", description: "Zone régulièrement inondée", status: "TERMINE", date: "2025-12-20", surface: 200.0, budget: 35000000, company: "ENTREPRISE RAZAFY", reportedById: 3, reportedByName: "Paul Rabe" },
    { id: 5, lat: -18.8850, lng: 47.5100, address: "Pont de Behoririka", type: "FISSURE", description: "Fissures multiples sur le tablier", status: "NOUVEAU", date: "2026-01-17", surface: 65.0, budget: null, company: null, reportedById: 2, reportedByName: "Marie Andria" },
    { id: 6, lat: -18.8760, lng: 47.5250, address: "67 Ha, près du stade", type: "NID_POULE", description: "Série de nids de poule dangereux", status: "EN_COURS", date: "2026-01-08", surface: 55.0, budget: 12000000, company: "TRAVAUX PUBLICS MADA", reportedById: 1, reportedByName: "Jean Rakoto" },
    { id: 7, lat: -18.8900, lng: 47.5180, address: "Lac Anosy - Boulevard", type: "AUTRE", description: "Revêtement dégradé sur 50m", status: "TERMINE", date: "2025-12-15", surface: 180.0, budget: 28000000, company: "COLAS Madagascar", reportedById: 3, reportedByName: "Paul Rabe" },
    { id: 8, lat: -18.8720, lng: 47.5120, address: "Gare Soarano", type: "EFFONDREMENT", description: "Affaissement de la route", status: "EN_COURS", date: "2026-01-12", surface: 75.0, budget: 18000000, company: "BTP CONSTRUCTION", reportedById: 2, reportedByName: "Marie Andria" },
];

const mockStats = { total: 8, nouveau: 2, enCours: 4, termine: 2, totalSurface: 825.5, totalBudget: 133000000, progress: 25 };

export const useReportStore = defineStore('reports', () => {
    const reports = ref([]);
    const stats = ref(null);
    const loading = ref(false);

    const problemTypes = {
        NID_POULE: { label: 'Nid de poule', icon: 'fa-circle-exclamation' },
        FISSURE: { label: 'Fissure', icon: 'fa-road-barrier' },
        EFFONDREMENT: { label: 'Effondrement', icon: 'fa-triangle-exclamation' },
        INONDATION: { label: 'Zone inondable', icon: 'fa-water' },
        AUTRE: { label: 'Autre', icon: 'fa-question-circle' }
    };

    const statuses = {
        NOUVEAU: { label: 'Nouveau', color: '#ef4444' },
        EN_COURS: { label: 'En cours', color: '#f59e0b' },
        TERMINE: { label: 'Terminé', color: '#10b981' }
    };

    async function fetchReports() {
        loading.value = true;
        try {
            reports.value = await reportService.getAllReports();
        } catch (error) {
            console.warn('Backend non disponible, utilisation des données fictives');
            reports.value = mockReports;
        } finally {
            loading.value = false;
        }
    }

    async function fetchStats() {
        try {
            stats.value = await reportService.getStats();
        } catch (error) {
            console.warn('Backend non disponible, utilisation des stats fictives');
            stats.value = mockStats;
        }
    }

    async function createReport(reportData) {
        const newReport = await reportService.createReport(reportData);
        reports.value.push(newReport);
        await fetchStats();
        return newReport;
    }

    async function updateReport(id, updateData) {
        const updated = await reportService.updateReport(id, updateData);
        const index = reports.value.findIndex(r => r.id === id);
        if (index !== -1) {
            reports.value[index] = updated;
        }
        await fetchStats();
        return updated;
    }

    async function deleteReport(id) {
        await reportService.deleteReport(id);
        reports.value = reports.value.filter(r => r.id !== id);
        await fetchStats();
    }

    function formatBudget(amount) {
        if (!amount) return 'Non défini';
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(0) + 'M Ar';
        }
        return amount.toLocaleString() + ' Ar';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    return {
        reports,
        stats,
        loading,
        problemTypes,
        statuses,
        fetchReports,
        fetchStats,
        createReport,
        updateReport,
        deleteReport,
        formatBudget,
        formatDate
    };
});

