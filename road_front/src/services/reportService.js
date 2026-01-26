import api from './api';

export const reportService = {
    async getAllReports() {
        const response = await api.get('/reports');
        return response.data;
    },

    async getReportById(id) {
        const response = await api.get(`/reports/${id}`);
        return response.data;
    },

    async getReportsByUser(userId) {
        const response = await api.get(`/reports/user/${userId}`);
        return response.data;
    },

    async getReportsByStatus(status) {
        const response = await api.get(`/reports/status/${status}`);
        return response.data;
    },

    async getStats() {
        const response = await api.get('/reports/stats');
        return response.data;
    },

    async createReport(reportData) {
        const response = await api.post('/reports', reportData);
        return response.data;
    },

    async updateReport(id, updateData) {
        const response = await api.put(`/reports/${id}`, updateData);
        return response.data;
    },

    async deleteReport(id) {
        await api.delete(`/reports/${id}`);
    }
};

export default reportService;

