import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
    /* =========
       STATE
       ========= */
    const user = ref(null)
    const accessToken = ref(localStorage.getItem('accessToken') || null)
    const refreshToken = ref(localStorage.getItem('refreshToken') || null)
    const loading = ref(false)
    const error = ref(null)

    /* =========
       GETTERS
       ========= */
    const isAuthenticated = computed(() => !!accessToken.value)
    const isManager = computed(() => user.value?.role === 'MANAGER')
    const isUtilisateur = computed(() => user.value?.role === 'UTILISATEUR')

    const fullName = computed(() => {
        if (!user.value) return ''
        return `${user.value.prenom} ${user.value.nom}`
    })

    /* =========
       ACTIONS
       ========= */
    function setTokens(access, refresh) {
        accessToken.value = access
        refreshToken.value = refresh
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
    }

    function clearTokens() {
        accessToken.value = null
        refreshToken.value = null
        user.value = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
    }

    async function register(userData) {
        loading.value = true
        error.value = null
        try {
            const response = await authService.register(userData)
            setTokens(response.accessToken, response.refreshToken)
            user.value = response.user
            return response
        } catch (err) {
            error.value = err.response?.data?.message || 'Erreur lors de l’inscription'
            throw err
        } finally {
            loading.value = false
        }
    }

    async function login(credentials) {
        loading.value = true
        error.value = null
        try {
            const response = await authService.login(credentials)
            setTokens(response.accessToken, response.refreshToken)
            user.value = response.user
            return response
        } catch (err) {
            error.value = err.response?.data?.message || 'Identifiants incorrects'
            throw err
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        try {
            await authService.logout()
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err)
        } finally {
            clearTokens()
        }
    }

    async function fetchProfile() {
        if (!accessToken.value) return null

        loading.value = true
        try {
            const profile = await authService.getProfile()
            user.value = profile
            return profile
        } catch (err) {
            if (err.response?.status === 401) {
                clearTokens()
            }
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateProfile(profileData) {
        loading.value = true
        error.value = null
        try {
            const updatedUser = await authService.updateProfile(profileData)
            user.value = updatedUser
            return updatedUser
        } catch (err) {
            error.value =
                err.response?.data?.message || 'Erreur lors de la mise à jour'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Initialisation (ex: au démarrage de l’app)
    async function init() {
        if (accessToken.value && !user.value) {
            try {
                await fetchProfile()
            } catch (err) {
                console.error('Erreur lors de l’initialisation:', err)
            }
        }
    }

    return {
        // State
        user,
        accessToken,
        refreshToken,
        loading,
        error,

        // Getters
        isAuthenticated,
        isManager,
        isUtilisateur,
        fullName,

        // Actions
        setTokens,
        clearTokens,
        register,
        login,
        logout,
        fetchProfile,
        updateProfile,
        init
    }
})
