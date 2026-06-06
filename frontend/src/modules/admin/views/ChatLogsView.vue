<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import adminService from '../../../services/admin.service'

const sessions = ref([])
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const loading = ref(true)
const page = ref(1)

const search = ref('')
const filterCategory = ref('')
const filterConfidence = ref('')
const filterDate = ref('')
const showConfidenceMenu = ref(false)
const showCategoryMenu = ref(false)
const dateInputRef = ref(null)

const selectedId = ref(null)
const detail = ref(null)
const detailLoading = ref(false)

const categoryOptions = computed(() => {
    const options = new Map()

    sessions.value.forEach((session) => {
        if (session.categoryId && session.category?.name) {
            options.set(session.categoryId, session.category.name)
        }
    })

    return [...options.entries()]
        .map(([id, name]) => ({ id, name, hint: 'Filter this issue category' }))
        .sort((a, b) => a.name.localeCompare(b.name))
})

const confidenceOptions = [
    { value: '', label: 'All Confidence', hint: 'Show every AI answer' },
    { value: 'high', label: 'High (>=80%)', hint: 'Strong answer confidence' },
    { value: 'medium', label: 'Medium (50-79%)', hint: 'Needs light review' },
    { value: 'low', label: 'Low (<50%)', hint: 'Likely needs attention' },
    { value: 'unknown', label: 'No Confidence', hint: 'No AI confidence score' },
]

const selectedConfidence = computed(() => {
    return confidenceOptions.find((option) => option.value === filterConfidence.value) ?? confidenceOptions[0]
})

const selectedCategory = computed(() => {
    return categoryOptions.value.find((option) => option.id === filterCategory.value) ?? {
        id: '',
        name: 'All Categories',
        hint: 'Show every conversation category',
    }
})

const chooseCategory = (value) => {
    filterCategory.value = value
    showCategoryMenu.value = false
}

const chooseConfidence = (value) => {
    filterConfidence.value = value
    showConfidenceMenu.value = false
}

const openDatePicker = () => {
    const input = dateInputRef.value
    if (!input) return

    if (typeof input.showPicker === 'function') {
        input.showPicker()
    } else {
        input.focus()
    }
}

const fetchList = async () => {
    try {
        loading.value = true
        const res = await adminService.getChatLogs({
            page: page.value,
            limit: 20,
            ...(search.value.trim() ? { search: search.value.trim() } : {}),
            ...(filterCategory.value ? { categoryId: filterCategory.value } : {}),
            ...(filterConfidence.value ? { confidence: filterConfidence.value } : {}),
            ...(filterDate.value ? { date: filterDate.value } : {}),
        })

        sessions.value = res.data.data?.items ?? []
        pagination.value = res.data.data?.pagination ?? pagination.value
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const openDetail = async (id) => {
    selectedId.value = id
    detail.value = null
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

const closeDetail = () => {
    selectedId.value = null
    detail.value = null
}

const truncate = (value, length = 76) => {
    if (!value) return '-'
    return value.length > length ? `${value.slice(0, length - 3)}...` : value
}

const userQuestion = (session) => {
    return session.latestUserMessage?.messageText || session.title || '-'
}

const aiResponse = (session) => {
    return session.latestAiMessage?.messageText || '-'
}

const latestMessage = (messages = [], sender) => {
    return [...messages]
        .reverse()
        .find((message) => message.sender === sender) ?? null
}

const confidencePercent = (score) => {
    if (score == null) return '-'
    return `${Math.round(score * 100)}%`
}

const confidenceClass = (score) => {
    if (score == null) return 'is-unknown'
    if (score >= 0.8) return 'is-high'
    if (score >= 0.6) return 'is-medium'
    return 'is-low'
}

const statusLabel = (status) => {
    if (status === 'RESOLVED') return 'Resolved'
    if (status === 'ESCALATED') return 'Escalated'
    return 'Active'
}

const statusClass = (status) => {
    if (status === 'RESOLVED') return 'is-resolved'
    if (status === 'ESCALATED') return 'is-escalated'
    return 'is-active'
}

const fmtDate = (dateValue) => {
    if (!dateValue) return '-'
    const date = new Date(dateValue)
    const datePart = date.toLocaleDateString('en-CA')
    const timePart = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })
    return `${datePart} ${timePart}`
}

const fmtDetailDate = (dateValue) => {
    if (!dateValue) return '-'
    return new Date(dateValue).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const detailUserQuestion = computed(() => {
    if (!detail.value) return '-'
    return latestMessage(detail.value.messages ?? [], 'USER')?.messageText || detail.value.title || '-'
})

const detailAiResponse = computed(() => {
    if (!detail.value) return '-'
    return latestMessage(detail.value.messages ?? [], 'AI')?.messageText || '-'
})

const detailConfidence = computed(() => {
    if (!detail.value) return null
    return latestMessage(detail.value.messages ?? [], 'AI')?.confidenceScore ?? null
})

let searchTimer = null
watch(search, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        page.value = 1
        fetchList()
    }, 250)
})

watch([filterCategory, filterConfidence, filterDate], () => {
    page.value = 1
    fetchList()
})

watch(page, fetchList)
onMounted(fetchList)
</script>

<template>
    <section class="chatlogs-admin-page">
        <header class="chatlogs-admin-header">
            <h1>Chat Logs</h1>
            <p>Monitor AI conversation history and performance</p>
        </header>

        <div class="chatlogs-filter-panel">
            <label class="chatlogs-filter-control">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search conversations..."
                />
            </label>

            <div
                class="chatlogs-filter-control is-dropdown"
                :class="{ open: showCategoryMenu }"
            >
                <i class="fa-solid fa-filter"></i>

                <button
                    type="button"
                    class="chatlogs-filter-trigger"
                    @click="showCategoryMenu = !showCategoryMenu"
                >
                    <span class="chatlogs-filter-trigger-text">
                        <span>{{ selectedCategory.name }}</span>
                        <small>{{ selectedCategory.hint }}</small>
                    </span>
                    <i
                        class="fa-solid fa-chevron-down chatlogs-dropdown-icon"
                        :class="{ open: showCategoryMenu }"
                    ></i>
                </button>

                <div
                    v-if="showCategoryMenu"
                    class="chatlogs-filter-menu"
                >
                    <button
                        type="button"
                        :class="{ active: filterCategory === '' }"
                        @click="chooseCategory('')"
                    >
                        <span>All Categories</span>
                        <small>Show every conversation category</small>
                    </button>

                    <button
                        v-for="category in categoryOptions"
                        :key="category.id"
                        type="button"
                        :class="{ active: category.id === filterCategory }"
                        @click="chooseCategory(category.id)"
                    >
                        <span>{{ category.name }}</span>
                        <small>{{ category.hint }}</small>
                    </button>
                </div>
            </div>

            <div
                class="chatlogs-filter-control is-dropdown"
                :class="{ open: showConfidenceMenu }"
            >
                <i class="fa-solid fa-arrow-trend-up"></i>
                <button
                    type="button"
                    class="chatlogs-filter-trigger"
                    @click="showConfidenceMenu = !showConfidenceMenu"
                >
                    <span class="chatlogs-filter-trigger-text">
                        <span>{{ selectedConfidence.label }}</span>
                        <small>{{ selectedConfidence.hint }}</small>
                    </span>
                    <i
                        class="fa-solid fa-chevron-down chatlogs-dropdown-icon"
                        :class="{ open: showConfidenceMenu }"
                    ></i>
                </button>

                <div
                    v-if="showConfidenceMenu"
                    class="chatlogs-filter-menu"
                >
                    <button
                        v-for="option in confidenceOptions"
                        :key="option.value || 'all'"
                        type="button"
                        :class="{ active: option.value === filterConfidence }"
                        @click="chooseConfidence(option.value)"
                    >
                        <span>{{ option.label }}</span>
                        <small>{{ option.hint }}</small>
                    </button>
                </div>
            </div>

            <label
                class="chatlogs-filter-control is-date"
                @click="openDatePicker"
            >
                <i class="fa-regular fa-calendar"></i>
                <input
                    ref="dateInputRef"
                    v-model="filterDate"
                    type="date"
                    @click.stop
                    @focus="openDatePicker"
                />
            </label>
        </div>

        <div class="chatlogs-count">
            Showing {{ pagination.total }} conversations
        </div>

        <div class="chatlogs-table-card">
            <div
                v-if="loading"
                class="chatlogs-loading"
            >
                <div class="loading-spinner"></div>
                Loading conversations...
            </div>

            <table
                v-else
                class="chatlogs-table"
            >
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>User Question</th>
                        <th>AI Response</th>
                        <th>Confidence</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-if="sessions.length === 0">
                        <td colspan="6">
                            <div class="chatlogs-empty">
                                <i class="fa-regular fa-comments"></i>
                                <span>No conversations found.</span>
                            </div>
                        </td>
                    </tr>

                    <tr
                        v-for="session in sessions"
                        :key="session.id"
                        @click="openDetail(session.id)"
                    >
                        <td>
                            <div class="chatlogs-user-cell">
                                <strong>{{ session.user?.employeeId || '-' }}</strong>
                            </div>
                        </td>

                        <td class="chatlogs-strong-text">
                            {{ truncate(userQuestion(session), 72) }}
                        </td>

                        <td class="chatlogs-muted-text">
                            {{ truncate(aiResponse(session), 82) }}
                        </td>

                        <td>
                            <span
                                class="chatlogs-confidence"
                                :class="confidenceClass(session.confidenceScore)"
                            >
                                <i class="fa-solid fa-arrow-trend-up"></i>
                                {{ confidencePercent(session.confidenceScore) }}
                            </span>
                        </td>

                        <td class="chatlogs-date">
                            {{ fmtDate(session.updatedAt) }}
                        </td>

                        <td>
                            <span
                                class="chatlogs-status"
                                :class="statusClass(session.status)"
                            >
                                {{ statusLabel(session.status) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div
            v-if="pagination.totalPages > 1"
            class="chatlogs-pagination"
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

        <Teleport to="body">
            <div
                v-if="selectedId"
                class="chatlogs-modal-overlay"
                @click.self="closeDetail"
            >
                <div class="chatlogs-detail-modal">
                    <header class="chatlogs-detail-header">
                        <h2>Chat Details</h2>

                        <button @click="closeDetail">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>

                    <div class="chatlogs-detail-body">
                        <div
                            v-if="detailLoading"
                            class="chatlogs-loading"
                        >
                            <div class="loading-spinner"></div>
                            Loading detail...
                        </div>

                        <template v-else-if="detail">
                            <div class="chatlogs-detail-summary">
                                <div class="chatlogs-detail-summary-grid">
                                    <div>
                                        <span>User ID</span>
                                        <strong>{{ detail.user?.employeeId || '-' }}</strong>
                                    </div>

                                    <div>
                                        <span>Name</span>
                                        <strong>{{ detail.user?.name || detail.user?.email || '-' }}</strong>
                                    </div>

                                    <div>
                                        <span>Category</span>
                                        <strong>
                                            <b class="chatlogs-detail-category">
                                                {{ detail.category?.name || 'Uncategorized' }}
                                            </b>
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Date</span>
                                        <strong>{{ fmtDate(detail.updatedAt) }}</strong>
                                    </div>
                                </div>
                            </div>

                            <section class="chatlogs-detail-section">
                                <h3>Full Conversation</h3>

                                <div class="chatlogs-conversation-card is-user">
                                    <span>User Question:</span>
                                    <p>{{ detailUserQuestion }}</p>
                                </div>

                                <div class="chatlogs-conversation-card is-ai">
                                    <span>AI Response:</span>
                                    <p>{{ detailAiResponse }}</p>
                                </div>
                            </section>

                            <section class="chatlogs-detail-section">
                                <h3>Retrieved Knowledge Context</h3>

                                <div
                                    v-if="!detail.relatedKnowledge?.length"
                                    class="chatlogs-context-empty"
                                >
                                    No related knowledge context found.
                                </div>

                                <template v-else>
                                    <div
                                        v-for="knowledge in detail.relatedKnowledge"
                                        :key="knowledge.id"
                                        class="chatlogs-context-row"
                                    >
                                        <i class="fa-regular fa-message"></i>
                                        <span>{{ knowledge.source || knowledge.title }}: {{ knowledge.title }}</span>
                                    </div>
                                </template>
                            </section>

                            <section class="chatlogs-detail-section">
                                <h3>AI Performance Metrics</h3>

                                <div class="chatlogs-metrics-grid">
                                    <div class="chatlogs-metric-card">
                                        <span>Confidence Score</span>
                                        <div class="chatlogs-confidence-meter">
                                            <div class="chatlogs-confidence-track">
                                                <div
                                                    class="chatlogs-confidence-fill"
                                                    :style="{ width: detailConfidence == null ? '0%' : `${Math.round(detailConfidence * 100)}%` }"
                                                ></div>
                                            </div>
                                            <strong>{{ confidencePercent(detailConfidence) }}</strong>
                                        </div>
                                    </div>

                                    <div class="chatlogs-metric-card">
                                        <span>Escalation Status</span>
                                        <strong
                                            class="chatlogs-metric-status"
                                            :class="statusClass(detail.status)"
                                        >
                                            {{ detail.status === 'ESCALATED' ? 'Escalated to Helpdesk' : detail.status === 'RESOLVED' ? 'Resolved by AI' : 'Still Active' }}
                                        </strong>
                                    </div>
                                </div>
                            </section>
                        </template>
                    </div>
                </div>
            </div>
        </Teleport>
    </section>
</template>

<style scoped>
.chatlogs-admin-page {
    color: #f4f7fb;
}

.chatlogs-admin-header {
    margin-bottom: 24px;
}

.chatlogs-admin-header h1 {
    margin: 0;
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.15;
}

.chatlogs-admin-header p {
    margin: 10px 0 0;
    color: #9aa8b7;
    font-size: 12px;
    font-weight: 600;
}

.chatlogs-filter-panel {
    background: #2d4256;
    border-radius: 12px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    padding: 18px;
    margin-bottom: 22px;
}

.chatlogs-filter-control {
    position: relative;
    height: 42px;
    background: #1f3144;
    border: 1px solid rgba(137, 167, 194, 0.08);
    border-radius: 8px;
    color: #8ea1b2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    min-width: 0;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.chatlogs-filter-control:focus-within,
.chatlogs-filter-control.open {
    border-color: #3da2e8;
    box-shadow: 0 0 0 2px rgba(61, 162, 232, 0.12);
}

.chatlogs-filter-control i {
    font-size: 15px;
    flex-shrink: 0;
}

.chatlogs-filter-control input,
.chatlogs-filter-control select {
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
}

.chatlogs-filter-control input::placeholder {
    color: #9fb1c2;
}

.chatlogs-filter-control select {
    appearance: none;
}

.chatlogs-filter-trigger {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 0;
    text-align: left;
    font-family: 'Inter', sans-serif;
}

.chatlogs-filter-trigger-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.chatlogs-filter-trigger-text span {
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chatlogs-filter-trigger-text small {
    color: #94a8bb;
    font-size: 10px;
    font-weight: 500;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chatlogs-dropdown-icon {
    margin-left: auto;
    color: #8ea1b2;
    font-size: 11px;
    align-self: center;
    transition: transform 0.15s ease, color 0.15s ease;
}

.chatlogs-dropdown-icon.open {
    color: #3da2e8;
    transform: rotate(180deg);
}

.chatlogs-filter-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 8px);
    z-index: 30;
    overflow: hidden;
    border: 1px solid rgba(61, 162, 232, 0.7);
    border-radius: 8px;
    background: #1f3144;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.chatlogs-filter-menu button {
    width: 100%;
    min-height: 48px;
    border: none;
    background: transparent;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    padding: 8px 16px;
    text-align: left;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
}

.chatlogs-filter-menu button:hover,
.chatlogs-filter-menu button.active {
    background: #8fc1ef;
    color: #173049;
}

.chatlogs-filter-menu span {
    font-size: 13px;
    font-weight: 600;
}

.chatlogs-filter-menu small {
    color: #9eb0c0;
    font-size: 10px;
    font-weight: 500;
}

.chatlogs-filter-menu button:hover small,
.chatlogs-filter-menu button.active small {
    color: #25435e;
}

.chatlogs-filter-control.is-date {
    cursor: pointer;
}

.chatlogs-filter-control.is-date input {
    color-scheme: dark;
    font-weight: 600;
    cursor: pointer;
}

.chatlogs-filter-control input[type="date"]::-webkit-calendar-picker-indicator {
    display: none;
    opacity: 0;
}

.chatlogs-filter-control input[type="date"]::-webkit-inner-spin-button,
.chatlogs-filter-control input[type="date"]::-webkit-clear-button {
    display: none;
}

.chatlogs-count {
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 18px;
}

.chatlogs-table-card {
    overflow: hidden;
    border-radius: 10px;
    background: #2d4256;
}

.chatlogs-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.chatlogs-table th {
    height: 44px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    text-align: left;
    padding: 0 14px;
}

.chatlogs-table td {
    height: 58px;
    background: #2d4256;
    border-top: 1px solid #152638;
    color: #d9e7f3;
    font-size: 12px;
    font-weight: 500;
    padding: 0 14px;
    vertical-align: middle;
}

.chatlogs-table tbody tr {
    cursor: pointer;
}

.chatlogs-table tbody tr:hover td {
    background: #334a60;
}

.chatlogs-table th:nth-child(1),
.chatlogs-table td:nth-child(1) {
    width: 9%;
}

.chatlogs-table th:nth-child(2),
.chatlogs-table td:nth-child(2) {
    width: 24%;
}

.chatlogs-table th:nth-child(3),
.chatlogs-table td:nth-child(3) {
    width: 34%;
}

.chatlogs-table th:nth-child(4),
.chatlogs-table td:nth-child(4) {
    width: 10%;
}

.chatlogs-table th:nth-child(5),
.chatlogs-table td:nth-child(5) {
    width: 13%;
}

.chatlogs-table th:nth-child(6),
.chatlogs-table td:nth-child(6) {
    width: 10%;
}

.chatlogs-table td:nth-child(2),
.chatlogs-table td:nth-child(3),
.chatlogs-table td:nth-child(5) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chatlogs-user-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.chatlogs-user-cell strong,
.chatlogs-strong-text {
    color: #ffffff;
    font-weight: 800;
}

.chatlogs-muted-text,
.chatlogs-date {
    color: #c5d5e4;
}

.chatlogs-confidence,
.chatlogs-status {
    min-height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
}

.chatlogs-confidence.is-high {
    background: rgba(28, 171, 111, 0.28);
    color: #22d17d;
}

.chatlogs-confidence.is-medium {
    background: rgba(225, 178, 37, 0.3);
    color: #f3c431;
}

.chatlogs-confidence.is-low {
    background: rgba(224, 73, 82, 0.28);
    color: #ff656b;
}

.chatlogs-confidence.is-unknown {
    background: rgba(148, 163, 184, 0.18);
    color: #cbd5e1;
}

.chatlogs-status.is-resolved {
    background: #12cf63;
    color: #ffffff;
}

.chatlogs-status.is-escalated {
    background: #ff741f;
    color: #ffffff;
}

.chatlogs-status.is-active {
    background: #3da2e8;
    color: #ffffff;
}

.chatlogs-loading,
.chatlogs-empty {
    min-height: 180px;
    background: #2d4256;
    color: #c5d5e4;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 800;
}

.chatlogs-empty {
    flex-direction: column;
}

.chatlogs-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-top: 20px;
    color: #d9e7f3;
    font-size: 13px;
    font-weight: 800;
}

.chatlogs-pagination button {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    background: #2d4256;
    color: #ffffff;
    cursor: pointer;
}

.chatlogs-pagination button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.chatlogs-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(8, 15, 24, 0.72);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.chatlogs-detail-modal {
    width: min(760px, 100%);
    max-height: min(780px, 88vh);
    background: #2d4256;
    border: 1px solid rgba(84, 124, 158, 0.5);
    border-radius: 14px;
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chatlogs-detail-header {
    min-height: 74px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 0 22px 0 24px;
    border-bottom: 1px solid rgba(137, 167, 194, 0.16);
    background: #2d4256;
    flex-shrink: 0;
}

.chatlogs-detail-header h2 {
    margin: 0;
    color: #ffffff;
    font-size: 21px;
    font-weight: 800;
}

.chatlogs-detail-header p {
    margin: 6px 0 0;
    color: #aebbc5;
    font-size: 12px;
    font-weight: 700;
}

.chatlogs-detail-header button {
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.07);
    color: #ffffff;
    cursor: pointer;
    font-size: 20px;
    transition: background 0.15s ease, transform 0.15s ease;
}

.chatlogs-detail-header button:hover {
    background: rgba(61, 162, 232, 0.22);
    transform: translateY(-1px);
}

.chatlogs-detail-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 22px 24px 24px;
    scrollbar-width: thin;
    scrollbar-color: #3da2e8 #1f3144;
}

.chatlogs-detail-body::-webkit-scrollbar {
    width: 8px;
}

.chatlogs-detail-body::-webkit-scrollbar-track {
    background: #1f3144;
    border-radius: 999px;
}

.chatlogs-detail-body::-webkit-scrollbar-thumb {
    background: #3da2e8;
    border-radius: 999px;
}

.chatlogs-detail-body::-webkit-scrollbar-thumb:hover {
    background: #5bb6f0;
}

.chatlogs-detail-summary {
    background: #1f3144;
    border: 1px solid rgba(137, 167, 194, 0.08);
    border-radius: 9px;
    padding: 18px 20px;
    margin-bottom: 24px;
}

.chatlogs-detail-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 44px;
}

.chatlogs-detail-summary-grid div {
    min-width: 0;
}

.chatlogs-detail-summary-grid span,
.chatlogs-conversation-card span,
.chatlogs-metric-card span {
    display: block;
    color: #a4b5c5;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
}

.chatlogs-detail-summary-grid strong {
    display: block;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.chatlogs-detail-category {
    min-height: 24px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #3da2e8;
    color: #ffffff;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 500;
}

.chatlogs-detail-section {
    margin-top: 24px;
}

.chatlogs-detail-section h3 {
    margin: 0 0 16px;
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
}

.chatlogs-conversation-card,
.chatlogs-context-row,
.chatlogs-metric-card,
.chatlogs-context-empty {
    background: #1f3144;
    border: 1px solid rgba(137, 167, 194, 0.08);
    border-radius: 9px;
    padding: 16px 18px;
}

.chatlogs-conversation-card + .chatlogs-conversation-card {
    margin-top: 14px;
}

.chatlogs-conversation-card.is-ai {
    background: #315a76;
}

.chatlogs-conversation-card.is-ai span {
    color: #4db3ff;
}

.chatlogs-conversation-card p {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.6;
}

.chatlogs-context-row,
.chatlogs-context-empty {
    min-height: 42px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #d9e7f3;
    font-size: 13px;
    font-weight: 500;
}

.chatlogs-context-row + .chatlogs-context-row {
    margin-top: 8px;
}

.chatlogs-context-row i {
    color: #22d17d;
}

.chatlogs-metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.chatlogs-metric-card {
    min-height: 78px;
}

.chatlogs-confidence-meter {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
}

.chatlogs-confidence-track {
    height: 7px;
    border-radius: 999px;
    background: #122132;
    overflow: hidden;
}

.chatlogs-confidence-fill {
    height: 100%;
    border-radius: inherit;
    background: #31d57b;
}

.chatlogs-confidence-meter strong {
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
}

.chatlogs-metric-status {
    color: #22d17d;
    font-size: 13px;
    font-weight: 500;
}

.chatlogs-metric-status.is-escalated {
    color: #ff9d44;
}

.chatlogs-metric-status.is-active {
    color: #4db3ff;
}

@media (max-width: 1180px) {
    .chatlogs-filter-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .chatlogs-table-card {
        overflow-x: auto;
    }

    .chatlogs-table {
        min-width: 1040px;
    }
}

@media (max-width: 720px) {
    .chatlogs-filter-panel {
        grid-template-columns: 1fr;
    }

    .chatlogs-detail-summary-grid,
    .chatlogs-metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 560px) {
    .chatlogs-detail-summary-grid,
    .chatlogs-metrics-grid {
        grid-template-columns: 1fr;
    }
}
</style>
