import UserDashboardView from './views/UserDashboardView.vue'

const dashboardRoutes = [
    {
        path: '/dashboard',
        name: 'dashboard',
        component: UserDashboardView,
        meta: { roles: ['USER'] }
    },
]

export default dashboardRoutes