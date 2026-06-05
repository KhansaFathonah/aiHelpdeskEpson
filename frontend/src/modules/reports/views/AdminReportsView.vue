<script setup>
import { ref, onMounted, watch } from 'vue'
import adminService from '../../../services/admin.service'

const logs       = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const loading    = ref(true)
const filterStatus = ref('')
const page = ref(1)

const fetchLogs = async () => {
    try {
        loading.value = true
        const res = await adminService.getEmailLogs({
            page:  page.value,
            limit: 20,
            ...(filterStatus.value ? { status: filterStatus.value } : {}),
        })
        logs.value       = res.data.data?.items   ?? []
        pagination.value = res.data.data?.pagination ?? pagination.value
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const fmt = (d) => d ? new Date(d).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '-'

watch(filterStatus, () => { page.value = 1; fetchLogs() })
watch(page, fetchLogs)
onMounted(fetchLogs)
</script>

<template>
    <section class="admin-page">

        <!-- STATS ROW -->
        <div class="stats-row" style="grid-template-columns: repeat(3,1fr); margin-bottom:20px;">
            <div class="stat-card total">
                <div class="stat-icon"><i class="fa-solid fa-envelope"></i></div>
                <div class="stat-info">
                    <div class="stat-card-value">{{ pagination.total }}</div>
                    <div class="stat-card-label">Total Emails</div>
                </div>
            </div>
            <div class="stat-card resolved">
                <div class="stat-icon" style="background:rgba(74,222,128,0.15); color:#4ade80;">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-card-value" style="color:#4ade80;">
                        {{ logs.filter(l => l.status === 'SENT').length }}
                    </div>
                    <div class="stat-card-label">Sent (this page)</div>
                </div>
            </div>
            <div class="stat-card open">
                <div class="stat-icon" style="background:rgba(248,113,113,0.15); color:#f87171;">
                    <i class="fa-solid fa-circle-xmark"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-card-value" style="color:#f87171;">
                        {{ logs.filter(l => l.status === 'FAILED').length }}
                    </div>
                    <div class="stat-card-label">Failed (this page)</div>
                </div>
            </div>
        </div>

        <!-- FILTER -->
        <div class="filter-row">
            <select v-model="filterStatus" class="filter-select">
                <option value="">All Status</option>
                <option value="SENT">SENT</option>
                <option value="FAILED">FAILED</option>
            </select>
        </div>

        <!-- TABLE -->
        <div class="ticket-table-card">
            <div v-if="loading" class="loading-state" style="padding:40px;">
                <div class="loading-spinner"></div>
                Loading…
            </div>

            <table v-else class="ticket-table">
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
                    <tr v-if="logs.length === 0">
                        <td colspan="5">
                            <div class="table-empty">
                                <div class="empty-inner">
                                    <i class="fa-solid fa-envelope-open"></i>
                                    <p>No email logs found</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr v-for="log in logs" :key="log.id">
                        <td>
                            <span style="font-size:13px; color:#fff; font-weight:500;">
                                {{ log.recipientEmail }}
                            </span>
                        </td>
                        <td class="ticket-summary">{{ log.subject }}</td>
                        <td>
                            <span v-if="log.ticket" class="category-tag">
                                TKT-{{ String(log.ticket.ticketNumber).padStart(3,'0') }}
                            </span>
                            <span v-else style="color:#94a3b8; font-size:12px;">-</span>
                        </td>
                        <td>
                            <span
                                class="badge"
                                :class="log.status === 'SENT' ? 'badge-resolved' : 'badge-high'"
                            >
                                <i class="fa-solid" :class="log.status === 'SENT' ? 'fa-circle-check' : 'fa-circle-xmark'" style="margin-right:4px;"></i>
                                {{ log.status }}
                            </span>
                        </td>
                        <td class="ticket-date">{{ fmt(log.sentAt) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- PAGINATION -->
        <div v-if="pagination.totalPages > 1" class="admin-pagination">
            <button class="admin-pg-btn" :disabled="page <= 1" @click="page--">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="admin-pg-info">
                Page {{ page }} / {{ pagination.totalPages }}
                <span style="color:#94a3b8; font-size:11px;">({{ pagination.total }} total)</span>
            </span>
            <button class="admin-pg-btn" :disabled="page >= pagination.totalPages" @click="page++">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>

    </section>
</template>

<style scoped>
.admin-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
}

.admin-pg-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: #25345b;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    transition: 0.15s;
}
.admin-pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.admin-pg-btn:hover:not(:disabled) { background: #2e4070; }

.admin-pg-info {
    font-size: 13px;
    color: #dce3f8;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}
</style>
