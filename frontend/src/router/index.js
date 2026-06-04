import { createRouter, createWebHistory } from 'vue-router'

import authRoutes    from '../modules/auth/routes'
import dashboardRoutes from '../modules/dashboard/routes'
import chatRoutes    from '../modules/chat/routes'
import faqRoutes     from "../modules/faq/routes"
import ticketRoutes  from '../modules/tickets/routes'
import adminRoutes   from '../modules/admin/routes'

const routes = [
    ...authRoutes,
    ...dashboardRoutes,
    ...chatRoutes,
    ...faqRoutes,
    ...ticketRoutes,
    ...adminRoutes,
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router