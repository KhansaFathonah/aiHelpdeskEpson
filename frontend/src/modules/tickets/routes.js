import UserTicketsView from './views/UserTicketsView.vue'
import TicketListView from './views/TicketListView.vue'
import IssueSummaryView from './views/IssueSummaryView.vue'

const ticketRoutes = [
    {
        path: '/tickets',
        name: 'tickets',
        component: UserTicketsView,
        meta: { roles: ['USER'] }
    },
    {
        path: '/helpdesk/tickets',
        name: 'helpdesk-tickets',
        component: TicketListView,
        meta: { roles: ['HELPDESK'] }
    },
    {
        path: '/helpdesk/tickets/:id',
        name: 'helpdesk-ticket-detail',
        component: IssueSummaryView,
        meta: { roles: ['HELPDESK'] }
    }
]

export default ticketRoutes