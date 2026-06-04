import UserTicketsView from './views/UserTicketsView.vue'
import TicketListView from './views/TicketListView.vue'
import IssueSummaryView from './views/IssueSummaryView.vue'

const ticketRoutes = [
    {
        path: '/tickets',
        name: 'tickets',
        component: UserTicketsView,
    },
    {
        path: '/helpdesk/tickets',
        name: 'helpdesk-tickets',
        component: TicketListView,
    },
    {
        path: '/helpdesk/tickets/:id',
        name: 'helpdesk-ticket-detail',
        component: IssueSummaryView,
    }
]

export default ticketRoutes