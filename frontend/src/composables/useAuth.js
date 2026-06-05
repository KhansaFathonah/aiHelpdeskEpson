import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

export const useAuth = () => {
    const router = useRouter()
    const authStore = useAuthStore()

    const user = computed(() => authStore.user)
    const token = computed(() => authStore.token)
    const isAuthenticated = computed(() => authStore.isAuthenticated)

    const logout = () => {
        authStore.logout()
        router.push('/')
    }

    return {
        user,
        token,
        isAuthenticated,
        login: authStore.login,
        logout,
    }
}
