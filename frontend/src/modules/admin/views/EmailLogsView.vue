<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import adminService from '../../../services/admin.service'
import '../../../assets/styles/admin-email-logs.css'

const logs = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const loading = ref(true)
const page = ref(1)
const search = ref('')
const filterStatus = ref('')
const showStatusMenu = ref(false)

const statusOptions = [
    { value: '', label: 'All Status', hint: 'Show every email delivery' },
    { value: 'SENT', label: 'Sent', hint: 'Email delivered successfully' },
    { value: 'FAILED', label: 'Failed', hint: 'Email delivery failed' },
]

const selectedStatus = computed(() => {
    return statusOptions.find((option) => option.value === filterStatus.value) ?? statusOptions[0]
})

const filteredLogs = computed(() => {
    const keyword = search.value.trim().toLowerCase()

    if (!keyword) return logs.value

    return logs.value.filter((log) => {
        return [
            log.recipientEmail,
            log.subject,
            log.status,
            log.ticket?.ticketNumber ? `TKT-${String(log.ticket.ticketNumber).padStart(3, '0')}` : '',
        ].some((value) => String(value ?? '').toLowerCase().includes(keyword))
    })
})

const sentCount = computed(() => logs.value.filter((log) => log.status === 'SENT').length)
const failedCount = computed(() => logs.value.filter((log) => log.status === 'FAILED').length)

const chooseStatus = (value) => {
    filterStatus.value = value
    showStatusMenu.value = false
}

const fetchLogs = async () => {
    try {
        loading.value = true
        const res = await adminService.getEmailLogs({
            page: page.value,
            limit: 20,
            ...(filterStatus.value ? { status: filterStatus.value } : {}),
        })

        logs.value = res.data.data?.items ?? []
        pagination.value = res.data.data?.pagination ?? pagination.value
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const fmt = (dateValue) => {
    if (!dateValue) return '-'

    const date = new Date(dateValue)
    const datePart = date.toLocaleDateString('en-CA')
    const timePart = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return `${datePart} ${timePart}`
}

const ticketCode = (ticket) => {
    if (!ticket?.ticketNumber) return '-'
    return `TKT-${String(ticket.ticketNumber).padStart(3, '0')}`
}

watch(filterStatus, () => {
    page.value = 1
    fetchLogs()
})

watch(page, fetchLogs)
onMounted(fetchLogs)
</script>

<template>
    <section class="email-logs-admin-page">
        <header class="email-logs-admin-header">
            <div>
                <h1>Email Logs</h1>
                <p>Monitor outbound summary emails and delivery status</p>
            </div>
        </header>

        <div class="email-logs-stats-grid">
            <article class="email-logs-stat-card is-total">
                <div class="email-logs-stat-icon">
                    <i class="fa-solid fa-envelope"></i>
                </div>
                <div>
                    <strong>{{ pagination.total }}</strong>
                    <span>Total Emails</span>
                </div>
            </article>

            <article class="email-logs-stat-card is-sent">
                <div class="email-logs-stat-icon">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <div>
                    <strong>{{ sentCount }}</strong>
                    <span>Sent on page</span>
                </div>
            </article>

            <article class="email-logs-stat-card is-failed">
                <div class="email-logs-stat-icon">
                    <i class="fa-solid fa-circle-xmark"></i>
                </div>
                <div>
                    <strong>{{ failedCount }}</strong>
                    <span>Failed on page</span>
                </div>
            </article>
        </div>

        <div class="email-logs-filter-panel">
            <label class="email-logs-filter-control">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search recipient, subject, ticket..."
                />
            </label>

            <div
                class="email-logs-filter-control is-dropdown"
                :class="{ open: showStatusMenu }"
            >
                <i class="fa-solid fa-filter"></i>

                <button
                    type="button"
                    class="email-logs-filter-trigger"
                    @click="showStatusMenu = !showStatusMenu"
                >
                    <span class="email-logs-filter-trigger-text">
                        <span>{{ selectedStatus.label }}</span>
                        <small>{{ selectedStatus.hint }}</small>
                    </span>
                    <i
                        class="fa-solid fa-chevron-down email-logs-dropdown-icon"
                        :class="{ open: showStatusMenu }"
                    ></i>
                </button>

                <div
                    v-if="showStatusMenu"
                    class="email-logs-filter-menu"
                >
                    <button
                        v-for="option in statusOptions"
                        :key="option.value || 'all'"
                        type="button"
                        :class="{ active: option.value === filterStatus }"
                        @click="chooseStatus(option.value)"
                    >
                        <span>{{ option.label }}</span>
                        <small>{{ option.hint }}</small>
                    </button>
                </div>
            </div>
        </div>

        <div class="email-logs-count">
            Showing {{ filteredLogs.length }} of {{ pagination.total }} email logs
        </div>

        <div class="email-logs-table-card">
            <div
                v-if="loading"
                class="email-logs-loading"
            >
                <div class="loading-spinner"></div>
                Loading email logs...
            </div>

            <table
                v-else
                class="email-logs-table"
            >
                <thead>
                    <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Ticket</th>
                        <th>Status</th>
                        <th>Sent At</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="filteredLogs.length === 0">
                        <td colspan="5">
                            <div class="email-logs-empty">
                                <i class="fa-regular fa-envelope-open"></i>
                                <span>No email logs found.</span>
                            </div>
                        </td>
                    </tr>

                    <tr
                        v-for="log in filteredLogs"
                        :key="log.id"
                    >
                        <td class="email-logs-recipient">{{ log.recipientEmail }}</td>
                        <td class="email-logs-subject">{{ log.subject }}</td>
                        <td>
                            <span
                                v-if="log.ticket"
                                class="email-logs-ticket"
                            >
                                {{ ticketCode(log.ticket) }}
                            </span>
                            <span
                                v-else
                                class="email-logs-muted"
                            >
                                -
                            </span>
                        </td>
                        <td>
                            <span
                                class="email-logs-status"
                                :class="log.status === 'SENT' ? 'is-sent' : 'is-failed'"
                            >
                                <i
                                    class="fa-solid"
                                    :class="log.status === 'SENT' ? 'fa-circle-check' : 'fa-circle-xmark'"
                                ></i>
                                {{ log.status === 'SENT' ? 'Sent' : 'Failed' }}
                            </span>
                        </td>
                        <td class="email-logs-date">{{ fmt(log.sentAt) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-if="pagination.totalPages > 1"
            class="email-logs-pagination"
        >
            <button
                :disabled="page <= 1"
                @click="page--"
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>

            <span>Page {{ page }} / {{ pagination.totalPages }}</span>

            <button
                :disabled="page >= pagination.totalPages"
                @click="page++"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    </section>
</template>
