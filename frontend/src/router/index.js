import { createRouter, createWebHistory } from 'vue-router'

import authRoutes from '../modules/auth/routes'
import adminRoutes from '../modules/admin/routes'
import dashboardRoutes from '../modules/dashboard/routes'
import chatRoutes from '../modules/chat/routes'
import faqRoutes from '../modules/faq/routes'
import ticketRoutes from '../modules/tickets/routes'
import { getUser, getDefaultRoute } from '../utils/auth'

const routes = [
    ...authRoutes,
    ...adminRoutes,
    ...dashboardRoutes,
    ...chatRoutes,
    ...faqRoutes,
    ...ticketRoutes,
    {
        path: '/:pathMatch(.*)*',
        redirect: () => {
            const user = getUser()
            return getDefaultRoute(user?.role)
        },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const user = getUser()

    if (token && !user) {
        localStorage.removeItem('token')
        return next('/')
    }

    if (to.meta?.public) {
        if (token) {
            return next(getDefaultRoute(user?.role))
        }

        return next()
    }

    if (!token) {
        return next('/')
    }

    if (to.meta?.roles && !to.meta.roles.includes(user.role)) {
        return next(getDefaultRoute(user.role))
    }

    next()
})

export default router
