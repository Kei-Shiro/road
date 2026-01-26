import api from './api';

export const userService = {
    async getAllUsers() {
        const response = await api.get('/users');
        return response.data;
    },

    async getUserById(id) {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    async login(email, password) {
        const response = await api.post('/users/login', { email, password });
        return response.data;
    },

    async createUser(userData) {
        const response = await api.post('/users', userData);
        return response.data;
    },

    async blockUser(id) {
        const response = await api.put(`/users/${id}/block`);
        return response.data;
    },

    async unblockUser(id) {
        const response = await api.put(`/users/${id}/unblock`);
        return response.data;
    }
};

export default userService;

