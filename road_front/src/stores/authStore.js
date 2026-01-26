import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import userService from '@/services/userService';

// Utilisateurs fictifs pour le mode hors-ligne
const mockUsers = [
    { id: 1, name: "Admin TravauxTana", email: "admin@travauxana.mg", password: "admin123", role: "MANAGER", status: "ACTIF" },
    { id: 2, name: "Jean Rakoto", email: "jean.rakoto@email.mg", password: "user123", role: "UTILISATEUR", status: "ACTIF" },
    { id: 3, name: "Marie Andria", email: "marie.andria@email.mg", password: "user123", role: "UTILISATEUR", status: "ACTIF" },
];

export const useAuthStore = defineStore('auth', () => {
    const currentUser = ref(null);
    const isAuthenticated = computed(() => currentUser.value !== null);
    const isManager = computed(() => currentUser.value?.role === 'MANAGER');

    async function login(email, password) {
        try {
            const user = await userService.login(email, password);
            currentUser.value = user;
            localStorage.setItem('user', JSON.stringify(user));
            return { success: true, user };
        } catch (error) {
            // Mode hors-ligne : vérifier dans les utilisateurs fictifs
            const mockUser = mockUsers.find(u => u.email === email && u.password === password);
            if (mockUser) {
                const user = { ...mockUser };
                delete user.password;
                currentUser.value = user;
                localStorage.setItem('user', JSON.stringify(user));
                return { success: true, user };
            }
            return { success: false, error: 'Email ou mot de passe incorrect' };
        }
    }

    function logout() {
        currentUser.value = null;
        localStorage.removeItem('user');
    }

    function initFromStorage() {
        const stored = localStorage.getItem('user');
        if (stored) {
            currentUser.value = JSON.parse(stored);
        }
    }

    return {
        currentUser,
        isAuthenticated,
        isManager,
        login,
        logout,
        initFromStorage
    };
});

