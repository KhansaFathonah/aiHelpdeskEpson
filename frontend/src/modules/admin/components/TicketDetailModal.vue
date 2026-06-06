<script setup>
const props = defineProps({
    ticket: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close'])

const getTicketCode = () => (
    props.ticket.ticketCode ||
    (props.ticket.ticketNumber ? `TKT-${String(props.ticket.ticketNumber).padStart(3, '0')}` : '-')
)

const getCategoryName = () => props.ticket.category?.name || 'General'

const getAssignedName = () => {
    const assigned = props.ticket.assignedHelpdesk || props.ticket.assignedTo || props.ticket.assignee || props.ticket.helpdesk
    if (!assigned) return 'Unassigned'
    if (typeof assigned === 'string') return assigned
    return assigned.name || assigned.email || 'Unassigned'
}

const compactText = (text, maxLength = 180) => {
    if (!text) return ''
    const normalized = String(text).replace(/\s+/g, ' ').trim()
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized
}

const statusLabel = (status) => {
    const map = {
        OPEN: 'OPEN',
        IN_PROGRESS: 'IN PROGRESS',
        RESOLVED: 'RESOLVED',
        CLOSED: 'CLOSED',
    }
    return map[status] || status || '-'
}

const sessionMessages = () => props.ticket.session?.messages || props.ticket.chatSession?.messages || []

const latestMessage = (sender) => (
    [...sessionMessages()].reverse().find((message) => message.sender === sender)
)

const extractSubjectFromSummary = () => {
    const match = props.ticket.summary?.match?.(/USER:\s*(.*?)(?:\s+AI:|$)/i)
    return compactText(match?.[1] || '', 110)
}

const subjectText = () => (
    props.ticket.subject ||
    props.ticket.session?.title ||
    latestMessage('USER')?.messageText ||
    extractSubjectFromSummary() ||
    compactText(props.ticket.summary, 140) ||
    '-'
)

const confidenceValue = () => {
    const value = props.ticket.confidenceScore
    if (typeof value !== 'number') return null
    return value > 1 ? value / 100 : value
}

const confidencePercent = () => {
    const value = confidenceValue()
    return value == null ? 0 : Math.round(value * 100)
}

const escalationReason = () => {
    return props.ticket.escalationReason || '-'
}

const confidenceTone = () => {
    const percent = confidencePercent()
    if (confidenceValue() == null) return 'unknown'
    if (percent >= 80) return 'high'
    if (percent >= 60) return 'medium'
    return 'low'
}

const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}
</script>

<template>
    <div class="admin-ticket-overlay" @click.self="emit('close')">
        <section class="admin-ticket-modal">
            <header class="admin-ticket-header">
                <h2>Ticket Details - {{ getTicketCode() }}</h2>
                <button type="button" class="admin-ticket-close" @click="emit('close')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>

            <div class="admin-ticket-body">
                <section class="admin-ticket-info">
                    <div>
                        <span>User ID</span>
                        <strong>{{ ticket.user?.employeeId || ticket.user?.id || '-' }}</strong>
                    </div>
                    <div>
                        <span>User Name</span>
                        <strong>{{ ticket.user?.name || '-' }}</strong>
                    </div>
                    <div>
                        <span>Category</span>
                        <strong><span class="admin-category-badge">{{ getCategoryName() }}</span></strong>
                    </div>
                    <div>
                        <span>Priority</span>
                        <strong><span class="admin-priority-badge" :class="ticket.priority?.toLowerCase()">{{ ticket.priority || '-' }}</span></strong>
                    </div>
                    <div>
                        <span>Escalated Date</span>
                        <strong>{{ formatDateTime(ticket.createdAt) }}</strong>
                    </div>
                    <div>
                        <span>Status</span>
                        <strong><span class="admin-status-badge" :class="ticket.status?.toLowerCase()">{{ statusLabel(ticket.status) }}</span></strong>
                    </div>
                </section>

                <div class="admin-ticket-detail-grid">
                    <section class="admin-ticket-section admin-subject-section">
                        <h3>Subject</h3>
                        <div class="admin-detail-card">
                            <p>{{ subjectText() }}</p>
                        </div>
                    </section>

                    <section class="admin-ticket-section">
                        <h3>Escalation Details</h3>
                        <div class="admin-escalation-card">
                            <div class="admin-escalation-row">
                                <span>Escalation Reason</span>
                                <p>{{ escalationReason() }}</p>
                            </div>
                            <div class="admin-confidence-block">
                                <div class="admin-confidence-label">
                                    <span>AI Confidence Score</span>
                                    <b>{{ confidenceValue() == null ? '-' : `${confidencePercent()}%` }}</b>
                                </div>
                                <div class="admin-confidence-track" :class="confidenceTone()">
                                    <span :style="{ width: `${confidencePercent()}%` }"></span>
                                </div>
                            </div>
                            <div class="admin-escalation-row">
                                <span>Assigned To</span>
                                <b>{{ getAssignedName() }}</b>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.admin-ticket-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(5, 12, 22, 0.78);
    backdrop-filter: blur(2px);
}

.admin-ticket-modal {
    width: min(92vw, 760px);
    max-height: 85vh;
    overflow: hidden;
    border: 1px solid rgba(125, 160, 190, 0.22);
    border-radius: 14px;
    background: #2b4054;
    color: #ffffff;
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.48);
    display: flex;
    flex-direction: column;
}

.admin-ticket-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-bottom: 1px solid rgba(207, 217, 245, 0.14);
}

.admin-ticket-header h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
}

.admin-ticket-close {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.admin-ticket-close:hover {
    background: rgba(61, 162, 232, 0.2);
}

.admin-ticket-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    overflow-y: auto;
    scrollbar-color: #3da2e8 #1b2336;
    scrollbar-width: thin;
}

.admin-ticket-body::-webkit-scrollbar {
    width: 8px;
}

.admin-ticket-body::-webkit-scrollbar-track {
    background: #1b2336;
}

.admin-ticket-body::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: #3da2e8;
}

.admin-ticket-info {
    border: 1px solid rgba(137, 167, 194, 0.08);
    border-radius: 10px;
    background: #1b2336;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px 22px;
    padding: 16px 18px;
}

.admin-ticket-info div {
    display: grid;
    gap: 6px;
}

.admin-ticket-info span,
.admin-escalation-row span,
.admin-confidence-label span {
    color: rgba(255, 255, 255, 0.72);
    font-size: 12px;
    font-weight: 700;
}

.admin-ticket-detail-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}

.admin-ticket-section h3 {
    margin: 0 0 10px;
    color: #ffffff;
    font-size: 15px;
    font-weight: 800;
}

.admin-detail-card,
.admin-escalation-card {
    border: 1px solid rgba(137, 167, 194, 0.08);
    border-radius: 10px;
    background: #1b2336;
    padding: 16px 18px;
}

.admin-detail-card {
    min-height: auto;
}

.admin-detail-card p {
    margin: 0;
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
}

.admin-ticket-info strong {
    color: #ffffff;
    font-size: 13px;
    line-height: 1.35;
}

.admin-escalation-card {
    display: grid;
    gap: 16px;
}

.admin-escalation-row {
    display: grid;
    gap: 6px;
}

.admin-escalation-row p,
.admin-escalation-row b,
.admin-confidence-label b {
    color: #ffffff;
    font-size: 13px;
    line-height: 1.5;
}

.admin-escalation-row p {
    margin: 0;
    max-width: 100%;
    font-weight: 500;
}

.admin-escalation-row b,
.admin-confidence-label b {
    font-weight: 700;
}

.admin-confidence-block {
    display: grid;
    gap: 8px;
}

.admin-confidence-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.admin-confidence-track {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(160, 174, 207, 0.18);
}

.admin-confidence-track span {
    display: block;
    height: 100%;
    min-width: 0;
    max-width: 100%;
    border-radius: inherit;
    background: #7d88a7;
}

.admin-confidence-track.high span {
    background: #22d17d;
}

.admin-confidence-track.medium span {
    background: #f7c948;
}

.admin-confidence-track.low span {
    background: #ff6262;
}

.admin-category-badge,
.admin-priority-badge,
.admin-status-badge {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    min-height: 20px;
    padding: 4px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
}

.admin-category-badge,
.admin-status-badge.resolved {
    background: rgba(61, 162, 232, 0.18);
    color: #3da2e8;
}

.admin-priority-badge.high {
    background: rgba(255, 75, 75, 0.18);
    color: #ff6262;
}

.admin-priority-badge.medium,
.admin-priority-badge.low,
.admin-status-badge.in_progress {
    background: rgba(247, 163, 26, 0.18);
    color: #f7c948;
}

.admin-status-badge.open,
.admin-status-badge.closed {
    background: rgba(160, 174, 207, 0.18);
    color: #cfd9f5;
}

@media (max-width: 760px) {
    .admin-ticket-modal {
        width: min(94vw, 560px);
    }

    .admin-ticket-info,
    .admin-ticket-detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
