import AdminDashboardView    from '../admin/views/AdminDashboardView.vue'
import ChatLogsView          from '../admin/views/ChatLogsView.vue'
import AdminKnowledgeBaseView from '../knowledge/views/AdminKnowledgeBaseView.vue'
import AdminReportsView      from '../reports/views/AdminReportsView.vue'

const adminRoutes = [
    {
        path: '/admin/dashboard',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: { roles: ['ADMIN'] }
    },
    {
        path: '/admin/chat-logs',
        name: 'admin-chat-logs',
        component: ChatLogsView,
        meta: { roles: ['ADMIN'] }
    },
    {
        path: '/admin/knowledge',
        name: 'admin-knowledge',
        component: AdminKnowledgeBaseView,
        meta: { roles: ['ADMIN'] }
    },
    {
        path: '/admin/email-logs',
        name: 'admin-email-logs',
        component: AdminReportsView,
        meta: { roles: ['ADMIN'] }
    },
]

export default adminRoutes
