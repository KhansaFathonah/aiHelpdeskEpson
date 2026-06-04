<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HelpdeskLayout from '../../../layouts/HelpdeskLayout.vue'

import ticketService from '../../../services/ticket.service'
import '../../../assets/styles/helpdesk.css'

const router = useRouter()

const tickets = ref([])
const loading = ref(false)
const error = ref(null)
const filterStatus = ref('')
const filterPriority = ref('')
const searchQuery = ref('')
const showLogoutModal = ref(false)

const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
}

const goToDetail = (id) => {
    router.push(`/helpdesk/tickets/${id}`)
}

const statusLabel = (status) => {
    const map = {
        OPEN: 'Open',
        IN_PROGRESS: 'In Progress',
        RESOLVED: 'Resolved',
        CLOSED: 'Closed',
    }
    return map[status] || status
}

const filteredTickets = computed(() => {
    return tickets.value.filter((t) => {
        const matchStatus = !filterStatus.value || t.status === filterStatus.value
        const q = searchQuery.value.toLowerCase()
        const matchSearch =
            !q ||
            t.summary?.toLowerCase().includes(q) ||
            t.user?.name?.toLowerCase().includes(q) ||
            t.user?.employeeId?.toLowerCase().includes(q) ||
            t.category?.name?.toLowerCase().includes(q)
            
        const matchPriority = !filterPriority.value || t.priority === filterPriority.value
        
        return matchStatus && matchSearch && matchPriority
    })
})

const countByStatus = (status) =>
    tickets.value.filter((t) => t.status === status).length

const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

onMounted(async () => {
    try {
        loading.value = true
        error.value = null
        const response = await ticketService.getTickets()
        // Backend returns { items: [...], pagination: {...} }
        tickets.value = response.data.data?.items || []
    } catch (err) {
        console.error(err)
        error.value = 'Failed to load tickets. Pastikan Anda login sebagai Helpdesk.'
    } finally {
        loading.value = false
    }
})

</script>

<template>
    <HelpdeskLayout title="Tickets" subtitle="Manage and handle user escalations">
        <!-- ERROR STATE -->
                <div v-if="error" class="error-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>{{ error }}</p>
                </div>

                <template v-else>

                    <!-- STATS -->
                    <div class="stats-row">
                        <div class="stat-card total">
                            <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
                            <div class="stat-info">
                                <div class="stat-card-value">{{ tickets.length }}</div>
                                <div class="stat-card-label">Total Tickets</div>
                            </div>
                        </div>

                        <div class="stat-card open">
                            <div class="stat-icon"><i class="fa-solid fa-folder-open"></i></div>
                            <div class="stat-info">
                                <div class="stat-card-value">{{ countByStatus('OPEN') }}</div>
                                <div class="stat-card-label">Open</div>
                            </div>
                        </div>

                        <div class="stat-card in-progress">
                            <div class="stat-icon"><i class="fa-solid fa-spinner"></i></div>
                            <div class="stat-info">
                                <div class="stat-card-value">{{ countByStatus('IN_PROGRESS') }}</div>
                                <div class="stat-card-label">In Progress</div>
                            </div>
                        </div>

                        <div class="stat-card resolved">
                            <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>
                            <div class="stat-info">
                                <div class="stat-card-value">{{ countByStatus('RESOLVED') }}</div>
                                <div class="stat-card-label">Resolved</div>
                            </div>
                        </div>
                    </div>

                    <!-- FILTER ROW -->
                    <div class="filter-row">

                        <div class="filter-search-wrapper">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input
                                class="filter-search"
                                type="text"
                                v-model="searchQuery"
                                placeholder="Search tickets..."
                            />
                        </div>

                        <select class="filter-select" v-model="filterStatus">
                            <option value="">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        
                        <select class="filter-select" v-model="filterPriority">
                            <option value="">All Priorities</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>



                    </div>

                    <!-- TABLE -->
                    <div class="ticket-table-card">

                        <!-- LOADING -->
                        <div v-if="loading" class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Loading tickets...</p>
                        </div>

                        <table v-else class="ticket-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr
                                    v-for="ticket in filteredTickets"
                                    :key="ticket.id"
                                    class="ticket-row"
                                    @click="goToDetail(ticket.id)"
                                >
                                    <td>
                                        <div class="ticket-user">
                                            <div class="ticket-user-avatar">
                                                {{ ticket.user?.name?.charAt(0) || '?' }}
                                            </div>
                                            <div>
                                                <strong>{{ ticket.user?.name || '-' }}</strong>
                                                <span>{{ ticket.user?.employeeId || '' }}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <span class="category-tag">
                                            {{ ticket.category?.name || 'General' }}
                                        </span>
                                    </td>

                                    <td class="ticket-summary">
                                        {{ ticket.summary }}
                                    </td>

                                    <td>
                                        <span class="badge" :class="`badge-${ticket.priority?.toLowerCase() || 'medium'}`">
                                            {{ ticket.priority || 'MEDIUM' }}
                                        </span>
                                    </td>



                                    <td>
                                        <span class="badge" :class="`badge-${ticket.status?.toLowerCase()}`">
                                            {{ statusLabel(ticket.status) }}
                                        </span>
                                    </td>

                                    <td class="ticket-date">
                                        {{ formatDate(ticket.createdAt) }}
                                    </td>

                                    <td>
                                        <span class="row-arrow">
                                            <i class="fa-solid fa-chevron-right"></i>
                                        </span>
                                    </td>
                                </tr>

                                <!-- EMPTY -->
                                <tr v-if="filteredTickets.length === 0">
                                    <td colspan="7" class="table-empty">
                                        <div class="empty-inner">
                                            <i class="fa-solid fa-inbox"></i>
                                            <p>No tickets found</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                    </div>

                </template>
    </HelpdeskLayout>
</template>
