import { defineStore } from 'pinia';
import { ref } from 'vue';
import userService from '@/services/userService';

export const useUserStore = defineStore('users', () => {
    const users = ref([]);
    const loading = ref(false);

    async function fetchUsers() {
        loading.value = true;
        try {
            users.value = await userService.getAllUsers();
        } finally {
            loading.value = false;
        }
    }

    async function createUser(userData) {
        const newUser = await userService.createUser(userData);
        users.value.push(newUser);
        return newUser;
    }

    async function blockUser(id) {
        const updated = await userService.blockUser(id);
        const index = users.value.findIndex(u => u.id === id);
        if (index !== -1) {
            users.value[index] = updated;
        }
        return updated;
    }

    async function unblockUser(id) {
        const updated = await userService.unblockUser(id);
        const index = users.value.findIndex(u => u.id === id);
        if (index !== -1) {
            users.value[index] = updated;
        }
        return updated;
    }

    return {
        users,
        loading,
        fetchUsers,
        createUser,
        blockUser,
        unblockUser
    };
});

