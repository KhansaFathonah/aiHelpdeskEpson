<script setup>
import { computed } from 'vue'

const props = defineProps({
    chat: {
        type: Object,
        default: null,
    },
    loading: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['close'])

const formatDateTime = (date) => {
    if (!date) return '-'

    const parsed = new Date(date)
    const datePart = parsed.toLocaleDateString('en-CA')
    const timePart = parsed.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return `${datePart} ${timePart}`
}

const aiMessages = computed(() => {
    return props.chat?.messages?.filter((message) => message.sender === 'AI') ?? []
})

const userQuestion = computed(() => {
    return props.chat?.messages?.find((message) => message.sender === 'USER')?.messageText
        || props.chat?.title
        || '-'
})

const confidenceScore = computed(() => {
    const values = aiMessages.value
        .map((message) => message.confidenceScore)
        .filter((value) => typeof value === 'number')

    if (!values.length) return null

    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    return average > 1 ? average / 100 : average
})

const confidencePercent = computed(() => {
    if (confidenceScore.value == null) return 0

    return Math.round(confidenceScore.value * 100)
})

const escalationStatus = computed(() => {
    if (props.chat?.status === 'ESCALATED' || props.chat?.escalationTickets?.length) {
        return 'Escalated to Helpdesk'
    }

    if (props.chat?.status === 'RESOLVED') {
        return 'Resolved by AI'
    }

    return 'Active Conversation'
})

const contextItems = computed(() => {
    const items = []

    if (props.chat?.category?.name) {
        items.push(props.chat.category.name)
    }

    for (const ticket of props.chat?.escalationTickets ?? []) {
        if (ticket.summary) items.push(ticket.summary)
    }

    return items
})

const senderLabel = (sender) => {
    if (sender === 'AI') return 'AI Assistant'
    if (sender === 'USER') return props.chat?.user?.name || 'User'
    return 'System'
}
</script>

<template>
    <Teleport to="body">
        <div
            class="chat-detail-overlay"
            @click.self="emit('close')"
        >
            <section
                class="chat-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-detail-title"
            >
                <header class="chat-detail-header">
                    <div>
                        <h2 id="chat-detail-title">Chat Details</h2>
                        <p>Conversation diagnostics and AI performance</p>
                    </div>

                    <button
                        class="chat-detail-close"
                        type="button"
                        aria-label="Close chat detail"
                        @click="emit('close')"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <div
                    v-if="loading"
                    class="chat-detail-loading"
                >
                    <div class="loading-spinner"></div>
                    Loading chat details...
                </div>

                <div
                    v-else-if="chat"
                    class="chat-detail-body"
                >
                    <section class="detail-section user-section">
                        <h3>User Information</h3>

                        <div class="user-info-grid">
                            <div class="info-card">
                                <span>User ID</span>
                                <strong>{{ chat.user?.employeeId || '-' }}</strong>
                            </div>
                            <div class="info-card">
                                <span>Name</span>
                                <strong>{{ chat.user?.name || '-' }}</strong>
                            </div>
                            <div class="info-card">
                                <span>Category</span>
                                <strong>{{ chat.category?.name || 'Uncategorized' }}</strong>
                            </div>
                            <div class="info-card">
                                <span>Date</span>
                                <strong>{{ formatDateTime(chat.updatedAt) }}</strong>
                            </div>
                        </div>
                    </section>

                    <div class="detail-main">
                        <section class="detail-section conversation-section">
                            <h3>Full Conversation</h3>

                            <div class="conversation-panel">
                                <div
                                    v-for="message in chat.messages"
                                    :key="message.id || message.createdAt"
                                    class="chat-message-row"
                                    :class="{
                                        user: message.sender === 'USER',
                                        ai: message.sender === 'AI',
                                        system: message.sender !== 'USER' && message.sender !== 'AI',
                                    }"
                                >
                                    <div
                                        v-if="message.sender === 'AI'"
                                        class="ai-avatar"
                                    >
                                        <img
                                            src="/logo.png"
                                            alt="Epson AI"
                                        />
                                    </div>

                                    <div>
                                        <div class="chat-bubble">
                                            {{ message.messageText }}
                                        </div>
                                        <div class="chat-meta">
                                            <span>{{ senderLabel(message.sender) }}</span>
                                            <span>{{ formatDateTime(message.createdAt) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    v-if="!chat.messages?.length"
                                    class="empty-conversation"
                                >
                                    No messages captured for this session.
                                </div>
                            </div>
                        </section>

                        <div class="detail-side">
                            <section class="detail-section">
                                <h3>Retrieved Knowledge Context</h3>

                                <div class="context-list">
                                    <div
                                        v-for="item in contextItems"
                                        :key="item"
                                        class="context-item"
                                    >
                                        <i class="fa-regular fa-message"></i>
                                        <span>{{ item }}</span>
                                    </div>

                                    <div
                                        v-if="contextItems.length === 0"
                                        class="context-item muted"
                                    >
                                        <i class="fa-regular fa-message"></i>
                                        <span>No retrieved context captured.</span>
                                    </div>
                                </div>
                            </section>

                            <section class="detail-section">
                                <h3>AI Performance Metrics</h3>

                                <div class="metrics-grid">
                                    <div class="metric-card">
                                        <span>Confidence Score</span>
                                        <div class="confidence-track">
                                            <div
                                                class="confidence-fill"
                                                :style="{ width: `${confidencePercent}%` }"
                                            ></div>
                                        </div>
                                        <strong>
                                            {{ confidenceScore == null ? '-' : `${confidencePercent}%` }}
                                        </strong>
                                    </div>

                                    <div class="metric-card">
                                        <span>Escalation Status</span>
                                        <strong class="metric-status">{{ escalationStatus }}</strong>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </Teleport>
</template>

<style scoped>
.chat-detail-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    padding: 24px;
    background: rgba(4, 9, 18, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
}

.chat-detail-modal {
    width: min(92vw, 1040px);
    max-width: 1040px;
    height: min(86vh, 720px);
    max-height: 86vh;
    overflow: hidden;
    border-radius: 18px;
    background: #25345b;
    color: #ffffff;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
    display: flex;
    flex-direction: column;
}

.chat-detail-header {
    padding: 14px 20px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    border-bottom: 1px solid rgba(207, 217, 245, 0.14);
}

.chat-detail-header h2 {
    margin: 0 0 7px;
    font-size: 17px;
    font-weight: 800;
}

.chat-detail-header p {
    margin: 0;
    color: #c7d0ea;
    font-size: 12px;
}

.chat-detail-close {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
}

.chat-detail-close:hover {
    background: rgba(255, 255, 255, 0.08);
}

.chat-detail-body {
    flex: 1;
    padding: 14px 20px 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
}

.chat-detail-loading {
    min-height: 360px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    color: #c7d0ea;
}

.detail-section h3 {
    margin: 0 0 8px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
}

.user-section {
    flex: none;
}

.user-info-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.detail-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    gap: 12px;
    flex: 1;
    min-height: 0;
}

.detail-side {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 12px;
    min-height: 0;
}

.metrics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

.info-card,
.metric-card,
.context-item {
    border-radius: 14px;
    background: #1e2d4d;
    padding: 10px 12px;
}

.info-card {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.info-card span,
.metric-card span {
    color: #aeb8d0;
    font-size: 11px;
    font-weight: 700;
}

.info-card strong,
.metric-card strong {
    color: #ffffff;
    font-size: 13px;
    min-width: 0;
    overflow-wrap: anywhere;
}

.conversation-section {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.detail-side .detail-section:first-child {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.conversation-panel {
    flex: 1;
    min-height: 0;
    height: auto;
    overflow-y: auto;
    padding: 12px;
    border-radius: 16px;
    background: #18233d;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.conversation-panel::-webkit-scrollbar {
    width: 6px;
}

.conversation-panel::-webkit-scrollbar-track {
    background: transparent;
}

.conversation-panel::-webkit-scrollbar-thumb {
    background: rgba(207, 217, 245, 0.26);
    border-radius: 999px;
}

.chat-message-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.chat-message-row.user {
    justify-content: flex-end;
}

.chat-message-row.system {
    justify-content: center;
}

.ai-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #212e4e;
    border: 2px solid #cfd9f5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 6px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.ai-avatar img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.chat-bubble {
    max-width: min(420px, 100%);
    min-width: 0;
    border-radius: 18px;
    padding: 11px 14px;
    background: #d8e1fb;
    color: #1f2f55;
    font-size: 12.5px;
    line-height: 1.55;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    overflow-wrap: anywhere;
    word-break: break-word;
}

.chat-message-row.ai .chat-bubble {
    border-top-left-radius: 6px;
}

.chat-message-row.user .chat-bubble {
    border-top-right-radius: 6px;
    background: #3da2e8;
    color: #ffffff;
}

.chat-message-row.system .chat-bubble {
    max-width: 100%;
    background: rgba(247, 163, 26, 0.14);
    color: #f7c948;
}

.chat-meta {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    color: #c7d0ea;
    font-size: 10px;
}

.chat-message-row.user .chat-meta {
    justify-content: flex-end;
}

.context-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: clamp(150px, 24vh, 230px);
    min-height: 0;
    overflow-y: scroll;
    padding-right: 6px;
}

.context-list::-webkit-scrollbar {
    width: 6px;
}

.context-list::-webkit-scrollbar-track {
    background: transparent;
}

.context-list::-webkit-scrollbar-thumb {
    background: rgba(207, 217, 245, 0.26);
    border-radius: 999px;
}

.context-item {
    min-height: 36px;
    display: flex;
    align-items: flex-start;
    gap: 11px;
    color: #dce3f8;
    font-size: 11.5px;
    min-width: 0;
    overflow: visible;
}

.context-item i {
    flex-shrink: 0;
}

.context-item span {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
    line-height: 1.35;
}

.context-item i {
    color: #3da2e8;
}

.context-item.muted {
    color: #aeb8d0;
}

.metric-card {
    display: grid;
    gap: 8px;
}

.confidence-track {
    height: 7px;
    border-radius: 999px;
    background: rgba(207, 217, 245, 0.18);
    overflow: hidden;
}

.confidence-fill {
    height: 100%;
    border-radius: inherit;
    background: #3da2e8;
}

.metric-status {
    color: #60b7f2 !important;
}

.empty-conversation {
    min-height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #1e2d4d;
    color: #c7d0ea;
}

@media (max-width: 1000px) {
    .user-info-grid,
    .metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .detail-main {
        grid-template-columns: 1fr;
    }

    .conversation-panel {
        min-height: 240px;
    }
}

@media (max-width: 700px) {
    .chat-detail-overlay {
        padding: 16px;
    }

    .user-info-grid,
    .metrics-grid {
        grid-template-columns: 1fr;
    }

    .chat-bubble {
        max-width: 300px;
    }
}

@media (max-height: 820px) {
    .chat-detail-header {
        padding: 12px 18px;
    }

    .chat-detail-body {
        gap: 10px;
        padding: 12px 18px 14px;
    }

    .user-info-grid {
        gap: 10px;
    }

    .info-card,
    .metric-card,
    .context-item {
        padding: 9px 11px;
    }

    .context-list {
        height: clamp(120px, 20vh, 160px);
    }
}
</style>
