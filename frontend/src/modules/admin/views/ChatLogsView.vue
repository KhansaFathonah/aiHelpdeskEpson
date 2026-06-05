<script setup>
import { ref, onMounted, watch } from 'vue'
import adminService from '../../../services/admin.service'

// ── List state ────────────────────────────────────────
const sessions   = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const loading    = ref(true)
const filterStatus   = ref('')
const filterCategory = ref('')
const page       = ref(1)

// ── Detail state ──────────────────────────────────────
const selectedId  = ref(null)
const detail      = ref(null)
const detailLoading = ref(false)

const statusOptions = ['', 'ACTIVE', 'ESCALATED', 'RESOLVED']

const fetchList = async () => {
    try {
        loading.value = true
        const res = await adminService.getChatLogs({
            page:       page.value,
            limit:      20,
            ...(filterStatus.value   ? { status:     filterStatus.value }   : {}),
            ...(filterCategory.value ? { categoryId: filterCategory.value } : {}),
        })
        sessions.value   = res.data.data?.items   ?? []
        pagination.value = res.data.data?.pagination ?? pagination.value
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const openDetail = async (id) => {
    selectedId.value  = id
    detail.value      = null
    detailLoading.value = true
    try {
        const res = await adminService.getChatLogById(id)
        detail.value = res.data.data
    } catch (e) {
        console.error(e)
    } finally {
        detailLoading.value = false
    }
}

const closeDetail = () => { selectedId.value = null; detail.value = null }

const statusClass = (s) => ({
    ACTIVE:    'badge-in_progress',
    ESCALATED: 'badge-open',
    RESOLVED:  'badge-resolved',
    CLOSED:    'badge-closed',
})[s] ?? 'badge-closed'

const senderBg = (sender) => ({
    USER:   '#3b82f6',
    AI:     'rgba(255,255,255,0.08)',
    SYSTEM: 'rgba(245,158,11,0.15)',
})[sender] ?? 'transparent'

const senderColor = (sender) => ({
    USER:   '#ffffff',
    AI:     '#dce3f8',
    SYSTEM: '#fcd34d',
})[sender] ?? '#ffffff'

const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '-'

const fmtShort = (d) => d ? new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
}) : '-'

watch([filterStatus, filterCategory], () => { page.value = 1; fetchList() })
watch(page, fetchList)
onMounted(fetchList)
</script>

<template>
    <section class="admin-page">

        <!-- FILTER ROW -->
        <div class="filter-row">
            <select v-model="filterStatus" class="filter-select">
                <option value="">All Status</option>
                <option v-for="s in statusOptions.slice(1)" :key="s" :value="s">{{ s }}</option>
            </select>

            <div class="filter-search-wrapper">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                    class="filter-search"
                    type="text"
                    placeholder="Search by category ID…"
                    v-model="filterCategory"
                />
            </div>
        </div>

        <!-- TABLE -->
        <div class="ticket-table-card">
            <!-- loading -->
            <div v-if="loading" class="loading-state" style="padding:40px;">
                <div class="loading-spinner"></div>
                Loading…
            </div>

            <table v-else class="ticket-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Messages</th>
                        <th>Escalations</th>
                        <th>Updated</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="sessions.length === 0">
                        <td colspan="8">
                            <div class="table-empty">
                                <div class="empty-inner">
                                    <i class="fa-solid fa-comments"></i>
                                    <p>No sessions found</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr
                        v-for="s in sessions"
                        :key="s.id"
                        class="ticket-row"
                        @click="openDetail(s.id)"
                    >
                        <td>
                            <div class="ticket-user">
                                <div class="ticket-user-avatar">
                                    {{ s.user?.name?.[0]?.toUpperCase() ?? 'U' }}
                                </div>
                                <div>
                                    <strong>{{ s.user?.name ?? '-' }}</strong>
                                    <span>{{ s.user?.department ?? '-' }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="ticket-summary">{{ s.title }}</td>
                        <td>
                            <span class="category-tag">{{ s.category?.name ?? 'Uncategorized' }}</span>
                        </td>
                        <td>
                            <span class="badge" :class="statusClass(s.status)">{{ s.status }}</span>
                        </td>
                        <td style="text-align:center; font-weight:700; color:#fff;">
                            {{ s._count?.messages ?? 0 }}
                        </td>
                        <td style="text-align:center; font-weight:700;" :style="{ color: s._count?.escalationTickets > 0 ? '#fb923c' : '#94a3b8' }">
                            {{ s._count?.escalationTickets ?? 0 }}
                        </td>
                        <td class="ticket-date">{{ fmtShort(s.updatedAt) }}</td>
                        <td>
                            <div class="row-arrow"><i class="fa-solid fa-chevron-right"></i></div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- PAGINATION -->
        <div v-if="pagination.totalPages > 1" class="admin-pagination">
            <button
                class="admin-pg-btn"
                :disabled="page <= 1"
                @click="page--"
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>

            <span class="admin-pg-info">
                Page {{ page }} / {{ pagination.totalPages }}
                <span style="color:#94a3b8; font-size:11px;">({{ pagination.total }} total)</span>
            </span>

            <button
                class="admin-pg-btn"
                :disabled="page >= pagination.totalPages"
                @click="page++"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>

        <!-- DETAIL MODAL -->
        <Teleport to="body">
            <div
                v-if="selectedId"
                class="ticket-chat-modal-overlay"
                @click.self="closeDetail"
            >
                <div class="chatlog-detail-modal">

                    <!-- Header -->
                    <div class="ticket-chat-modal-header">
                        <div class="ticket-chat-modal-header-left">
                            <div class="ticket-chat-modal-avatar">
                                <i class="fa-solid fa-comments"></i>
                            </div>
                            <div>
                                <div class="ticket-chat-modal-title">
                                    {{ detail?.title ?? 'Chat Log Detail' }}
                                </div>
                                <div class="ticket-chat-modal-subtitle" v-if="detail">
                                    {{ detail.user?.name }} · {{ detail.user?.department ?? '-' }} ·
                                    <span class="badge" :class="statusClass(detail.status)" style="font-size:10px; padding:2px 8px;">{{ detail.status }}</span>
                                </div>
                            </div>
                        </div>
                        <button class="ticket-chat-close-btn" @click="closeDetail">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="chatlog-detail-body">
                        <div v-if="detailLoading" class="loading-state" style="padding:40px; flex:1;">
                            <div class="loading-spinner"></div> Loading…
                        </div>
                        <template v-else-if="detail">
                            <!-- Meta info -->
                            <div class="chatlog-meta-row">
                                <div class="chatlog-meta-item">
                                    <span class="info-label">User Email</span>
                                    <span class="info-value" style="font-size:12px;">{{ detail.user?.email }}</span>
                                </div>
                                <div class="chatlog-meta-item">
                                    <span class="info-label">Category</span>
                                    <span class="info-value">{{ detail.category?.name ?? '-' }}</span>
                                </div>
                                <div class="chatlog-meta-item">
                                    <span class="info-label">Created</span>
                                    <span class="info-value">{{ fmt(detail.createdAt) }}</span>
                                </div>
                                <div class="chatlog-meta-item">
                                    <span class="info-label">Escalations</span>
                                    <span class="info-value">{{ detail.escalationTickets?.length ?? 0 }}</span>
                                </div>
                            </div>

                            <!-- Messages -->
                            <div class="chatlog-messages">
                                <template v-for="(msg, i) in detail.messages" :key="i">
                                    <!-- USER -->
                                    <div v-if="msg.sender === 'USER'" class="rtchat-msg-row is-user">
                                        <div>
                                            <div class="rtchat-bubble">{{ msg.messageText }}</div>
                                            <div class="rtchat-meta">
                                                <span>User</span>
                                                <span>·</span>
                                                <span>{{ fmt(msg.createdAt) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- AI -->
                                    <div v-else-if="msg.sender === 'AI'" class="rtchat-msg-row is-helpdesk">
                                        <div class="rtchat-helpdesk-avatar" title="AI">
                                            <i class="fa-solid fa-robot" style="font-size:10px;"></i>
                                        </div>
                                        <div>
                                            <div class="rtchat-bubble">{{ msg.messageText }}</div>
                                            <div class="rtchat-meta">
                                                <span>AI</span>
                                                <span v-if="msg.confidenceScore">· {{ (msg.confidenceScore * 100).toFixed(0) }}% conf</span>
                                                <span>·</span>
                                                <span>{{ fmt(msg.createdAt) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- SYSTEM -->
                                    <div v-else class="rtchat-msg-row is-system">
                                        <div class="rtchat-bubble">{{ msg.messageText }}</div>
                                    </div>
                                </template>
                                <div v-if="!detail.messages?.length" class="rtchat-empty">
                                    <i class="fa-regular fa-comments"></i>
                                    <p>No messages</p>
                                </div>
                            </div>
                        </template>
                    </div>

                </div>
            </div>
        </Teleport>

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
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: #25345b;
    color: #fff;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
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

/* Detail modal */
.chatlog-detail-modal {
    background: #1e2d4d;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
    width: 100%;
    max-width: 680px;
    height: 680px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chatlog-detail-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chatlog-meta-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px 24px;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(0,0,0,0.15);
    flex-shrink: 0;
}

.chatlog-meta-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 6px;
    min-width: 0; /* Prevents flex children from overflowing */
}

.chatlog-meta-item .info-label {
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.chatlog-meta-item .info-value {
    font-size: 14px;
    color: #ffffff;
    font-weight: 500;
    overflow-wrap: break-word;
    word-break: break-word;
}

.chatlog-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.chatlog-messages::-webkit-scrollbar { width: 4px; }
.chatlog-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
</style>
