import { defineStore } from 'pinia'
import { loginService } from '../services/auth.service'
import { clearAuth } from '../utils/auth'

const storedUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
        return null
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: storedUser(),
        token: localStorage.getItem('token'),
        loading: false,
        error: null,
    }),

    getters: {
        isAuthenticated: (state) => Boolean(state.token),
    },

    actions: {
        setSession(payload) {
            const token = payload?.token || null
            const user = payload?.user || null

            this.token = token
            this.user = user

            if (token) {
                localStorage.setItem('token', token)
            } else {
                localStorage.removeItem('token')
            }

            if (user) {
                localStorage.setItem('user', JSON.stringify(user))
            } else {
                localStorage.removeItem('user')
            }
        },

        async login(formData) {
            try {
                this.loading = true
                this.error = null

                const response = await loginService(formData)
                const session = response?.data || response || {}

                this.setSession({
                    token: session.token,
                    user: session.user,
                })

                return session
            } catch (error) {
                this.error = error.response?.data?.message || 'Login gagal'
                throw error
            } finally {
                this.loading = false
            }
        },

        logout() {
            this.error = null
            this.setSession({
                token: null,
                user: null,
            })
            clearAuth()
        },
    },
})
