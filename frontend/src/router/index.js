import { createRouter, createWebHistory } from 'vue-router'

import authRoutes    from '../modules/auth/routes'
import dashboardRoutes from '../modules/dashboard/routes'
import chatRoutes    from '../modules/chat/routes'
import faqRoutes     from "../modules/faq/routes"
import ticketRoutes  from '../modules/tickets/routes'
import adminRoutes   from '../modules/admin/routes'
import { getUser, getDefaultRoute } from '../utils/auth'

const routes = [
    ...authRoutes,
    ...dashboardRoutes,
    ...chatRoutes,
    ...faqRoutes,
    ...ticketRoutes,
    ...adminRoutes,
    
    // ── Catch-all Route (404 Fallback) - PALING BAWAH ──────────────────
    {
        path: '/:pathMatch(.*)*',
        redirect: (to) => {
            const user = getUser()
            return getDefaultRoute(user?.role)
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// ── Navigation Guard: Protect Routes & Check Authorization ──────────────
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const user = getUser()

    // ── Celah Ditutup: Token ada tapi user hilang (Corrupted State) ──────
    if (token && !user) {
        localStorage.removeItem('token')
        return next('/')
    }

    // ── Public Routes: User yang sudah login tidak perlu ke login lagi ────
    if (to.meta?.public) {
        if (token) {
            // User sudah login, arahkan ke dashboard miliknya
            return next(getDefaultRoute(user?.role))
        }
        // Public route & belum login, boleh lanjut
        return next()
    }

    // ── Protected Routes: Harus login ───────────────────────────────────
    if (!token) {
        // Tidak ada token, lempar ke login
        return next('/')
    }

    // ── Role-based Access Control ───────────────────────────────────────
    if (to.meta?.roles && !to.meta.roles.includes(user.role)) {
        // User role tidak sesuai, lempar ke dashboard miliknya
        return next(getDefaultRoute(user.role))
    }

    // ── Semua check passed, izinkan navigasi ─────────────────────────────
    next()
})

export default router

