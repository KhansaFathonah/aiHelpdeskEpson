/**
 * Authentication Utilities
 * - getUser(): Get user from localStorage with defensive parsing
 * - getDefaultRoute(): Map role to default dashboard
 * - clearAuth(): Clear token + user from localStorage
 */

/**
 * Get user from localStorage with defensive error handling
 * @returns {Object|null} User object or null if not found/corrupted
 */
export const getUser = () => {
    const token = localStorage.getItem('token')
    
    // Celah ditutup: Jika token nggak ada tapi user nyangkut, sapu bersih!
    if (!token) {
        localStorage.removeItem('user')
        return null
    }

    try {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    } catch (error) {
        // Corrupted JSON data - bersihkan semuanya
        console.error('Error parsing user from localStorage:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return null
    }
}

/**
 * Get default dashboard route based on user role
 * @param {String} role - User role (ADMIN, HELPDESK, USER)
 * @returns {String} Default route path for the role
 */
export const getDefaultRoute = (role) => {
    switch (role) {
        case 'ADMIN':
            return '/admin/dashboard'
        case 'HELPDESK':
            return '/helpdesk/tickets'
        case 'USER':
            return '/dashboard'
        default:
            return '/' // Default to login for unknown roles
    }
}

/**
 * Clear authentication data from localStorage
 * Decouple from router to avoid circular dependencies
 */
export const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
}
