<script setup>
import { computed, onMounted, ref } from 'vue'

import ticketService from '../../../services/ticket.service'
import TicketDetailModal from '../components/TicketDetailModal.vue'
import '../../../assets/styles/admin-escalated-tickets.css'

const tickets = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterPriority = ref('')
const filterStatus = ref('')
const selectedTicket = ref(null)
const priorityDropdownOpen = ref(false)
const statusDropdownOpen = ref(false)

const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
]

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
]

const filteredTickets = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()

    return tickets.value.filter((ticket) => {
        const searchable = [
            ticket.summary,
            ticket.user?.name,
            ticket.user?.employeeId,
            ticket.category?.name,
        ].filter(Boolean).join(' ').toLowerCase()

        return (!q || searchable.includes(q)) &&
            (!filterPriority.value || ticket.priority === filterPriority.value) &&
            (!filterStatus.value || ticket.status === filterStatus.value)
    })
})

const selectedPriorityLabel = computed(() => (
    priorityOptions.find((option) => option.value === filterPriority.value)?.label || 'All Priorities'
))

const selectedStatusLabel = computed(() => (
    statusOptions.find((option) => option.value === filterStatus.value)?.label || 'All Status'
))

const countByStatus = (status) => tickets.value.filter((ticket) => ticket.status === status).length
const countByPriority = (priority) => tickets.value.filter((ticket) => ticket.priority === priority).length

const getTicketCode = (ticket) => (
    ticket.ticketCode ||
    (ticket.ticketNumber ? `TKT-${String(ticket.ticketNumber).padStart(3, '0')}` : `TKT-${String(tickets.value.findIndex((item) => item.id === ticket.id) + 1).padStart(3, '0')}`)
)

const getAssignedName = (ticket) => {
    const assigned = ticket.assignedHelpdesk || ticket.assignedTo || ticket.assignee || ticket.helpdesk
    if (!assigned) return 'Unassigned'
    if (typeof assigned === 'string') return assigned
    return assigned.name || assigned.email || 'Unassigned'
}

const statusLabel = (status) => {
    const map = {
        OPEN: 'Open',
        IN_PROGRESS: 'In Progress',
        RESOLVED: 'Resolved',
        CLOSED: 'Closed',
    }
    return map[status] || status || '-'
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

const selectPriority = (value) => {
    filterPriority.value = value
    priorityDropdownOpen.value = false
}

const selectStatus = (value) => {
    filterStatus.value = value
    statusDropdownOpen.value = false
}

const loadTickets = async () => {
    try {
        loading.value = true
        error.value = null
        const response = await ticketService.getTickets()
        tickets.value = response.data.data?.items || []
    } catch (err) {
        console.error(err)
        error.value = 'Failed to load tickets.'
    } finally {
        loading.value = false
    }
}

onMounted(loadTickets)
</script>

<template>
    <section class="admin-escalated-page">
        <header class="admin-escalated-header">
            <h1>Escalated Ticket Monitoring</h1>
            <p>Track and manage escalated support tickets</p>
        </header>

        <div v-if="error" class="admin-ticket-error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ error }}</span>
        </div>

        <template v-else>
            <section class="admin-ticket-stats">
                <article class="admin-ticket-stat">
                    <span class="admin-stat-icon danger"><i class="fa-solid fa-triangle-exclamation"></i></span>
                    <div><small>High Priority</small><strong>{{ countByPriority('HIGH') }}</strong></div>
                </article>
                <article class="admin-ticket-stat">
                    <span class="admin-stat-icon danger"><i class="fa-regular fa-clock"></i></span>
                    <div><small>Pending</small><strong>{{ countByStatus('OPEN') }}</strong></div>
                </article>
                <article class="admin-ticket-stat">
                    <span class="admin-stat-icon warning"><i class="fa-regular fa-user"></i></span>
                    <div><small>In Progress</small><strong>{{ countByStatus('IN_PROGRESS') }}</strong></div>
                </article>
                <article class="admin-ticket-stat">
                    <span class="admin-stat-icon info"><i class="fa-solid fa-triangle-exclamation"></i></span>
                    <div><small>Total Escalated</small><strong>{{ tickets.length }}</strong></div>
                </article>
            </section>

            <section class="admin-ticket-toolbar">
                <label class="admin-ticket-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input v-model="searchQuery" type="text" placeholder="Search tickets..." />
                </label>

                <div class="admin-ticket-filter" :class="{ open: priorityDropdownOpen }">
                    <i class="fa-solid fa-filter"></i>
                    <button type="button" @click="priorityDropdownOpen = !priorityDropdownOpen; statusDropdownOpen = false">
                        <span>{{ selectedPriorityLabel }}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div v-if="priorityDropdownOpen" class="admin-ticket-menu">
                        <button v-for="option in priorityOptions" :key="option.value || 'all-priorities'" type="button" :class="{ active: filterPriority === option.value }" @click="selectPriority(option.value)">
                            {{ option.label }}
                        </button>
                    </div>
                </div>

                <div class="admin-ticket-filter" :class="{ open: statusDropdownOpen }">
                    <i class="fa-solid fa-filter"></i>
                    <button type="button" @click="statusDropdownOpen = !statusDropdownOpen; priorityDropdownOpen = false">
                        <span>{{ selectedStatusLabel }}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div v-if="statusDropdownOpen" class="admin-ticket-menu">
                        <button v-for="option in statusOptions" :key="option.value || 'all-status'" type="button" :class="{ active: filterStatus === option.value }" @click="selectStatus(option.value)">
                            {{ option.label }}
                        </button>
                    </div>
                </div>
            </section>

            <p class="admin-ticket-count">Showing {{ filteredTickets.length }} escalated tickets</p>

            <section class="admin-ticket-table-card">
                <div v-if="loading" class="admin-ticket-loading">Loading tickets...</div>
                <table v-else class="admin-ticket-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>User</th>
                            <th>Subject</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Assigned To</th>
                            <th>Escalated</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ticket in filteredTickets" :key="ticket.id">
                            <td>{{ getTicketCode(ticket) }}</td>
                            <td><span class="admin-user-cell">{{ ticket.user?.name || '-' }} <small v-if="ticket.user?.employeeId">- {{ ticket.user.employeeId }}</small></span></td>
                            <td>{{ ticket.summary || '-' }}</td>
                            <td><span class="admin-category-tag">{{ ticket.category?.name || 'General' }}</span></td>
                            <td><span class="admin-badge" :class="`priority-${ticket.priority?.toLowerCase() || 'medium'}`">{{ ticket.priority || 'MEDIUM' }}</span></td>
                            <td>{{ getAssignedName(ticket) }}</td>
                            <td>{{ formatDate(ticket.createdAt) }}</td>
                            <td><span class="admin-badge" :class="`status-${ticket.status?.toLowerCase()}`">{{ statusLabel(ticket.status) }}</span></td>
                            <td>
                                <button type="button" class="admin-ticket-action" aria-label="View ticket details" @click="selectedTicket = ticket">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredTickets.length === 0">
                            <td colspan="9" class="admin-ticket-empty">No tickets found</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </template>

        <TicketDetailModal v-if="selectedTicket" :ticket="selectedTicket" @close="selectedTicket = null" />
    </section>
</template>
