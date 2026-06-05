import axios from 'axios'
import { clearAuth } from '../utils/auth'

const api = axios.create({
    baseURL: 'http://localhost:4000/api',
})

// ── Request Interceptor: Add Authorization Header ──────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ── Response Interceptor: Handle 401 Unauthorized ────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid - clear auth and redirect to login
            clearAuth()
            
            // Lazy import router to avoid circular dependency
            import('../router').then(module => {
                module.default.push('/?expired=1')
            })
        }
        return Promise.reject(error)
    }
)

export default api