import AdminDashboardView    from '../admin/views/AdminDashboardView.vue'
import ChatLogsView          from '../admin/views/ChatLogsView.vue'
import AdminKnowledgeBaseView from '../knowledge/views/AdminKnowledgeBaseView.vue'
import AdminReportsView      from '../reports/views/AdminReportsView.vue'

const adminRoutes = [
    {
        path: '/admin/dashboard',
        name: 'admin-dashboard',
        component: AdminDashboardView,
    },
    {
        path: '/admin/chat-logs',
        name: 'admin-chat-logs',
        component: ChatLogsView,
    },
    {
        path: '/admin/knowledge',
        name: 'admin-knowledge',
        component: AdminKnowledgeBaseView,
    },
    {
        path: '/admin/email-logs',
        name: 'admin-email-logs',
        component: AdminReportsView,
    },
]

export default adminRoutes
