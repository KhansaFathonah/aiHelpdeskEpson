import AdminLayout from '../../layouts/AdminLayout.vue'
import AdminDashboardView from './views/AdminDashboardView.vue'
import ChatLogsView from './views/ChatLogsView.vue'
import AdminKnowledgeBaseView from '../knowledge/views/AdminKnowledgeBaseView.vue'
import AdminAnalyticsView from '../analytics/views/AdminAnalyticsView.vue'
import AdminReportsView from '../reports/views/AdminReportsView.vue'
import TicketListView from '../tickets/views/TicketListView.vue'

const adminRoutes = [
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            {
                path: '',
                redirect: '/admin/dashboard',
            },
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: AdminDashboardView,
                meta: {
                    title: 'Admin Dashboard',
                },
            },
            {
                path: 'knowledge',
                name: 'admin-knowledge',
                component: AdminKnowledgeBaseView,
                meta: {
                    title: 'Knowledge Base',
                },
            },
            {
                path: 'chat-logs',
                name: 'admin-chat-logs',
                component: ChatLogsView,
                meta: {
                    title: 'Chat Logs',
                },
            },
            {
                path: 'tickets',
                name: 'admin-tickets',
                component: TicketListView,
                meta: {
                    title: 'Escalated Tickets',
                },
            },
            {
                path: 'analytics',
                name: 'admin-analytics',
                component: AdminAnalyticsView,
                meta: {
                    title: 'Analytics',
                },
            },
            {
                path: 'reports',
                name: 'admin-reports',
                component: AdminReportsView,
                meta: {
                    title: 'Reports',
                },
            },
        ],
    },
]

export default adminRoutes
