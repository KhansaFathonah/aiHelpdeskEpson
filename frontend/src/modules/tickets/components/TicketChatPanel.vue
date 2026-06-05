<script setup>
/**
 * TicketChatPanel
 *
 * Panel real-time chat antara User ↔ Helpdesk dalam konteks tiket eskalasi.
 * Bisa dipakai di dua tempat:
 *   - Sisi User: dibungkus modal di UserTicketsView
 *   - Sisi Helpdesk: ditanam langsung di IssueSummaryView (detail tiket)
 *
 * Props:
 *   ticketId   (string)  - ID tiket
 *   status     (string)  - Status tiket: OPEN | IN_PROGRESS | RESOLVED | CLOSED
 *   viewerRole (string)  - Role yang sedang melihat: 'USER' | 'HELPDESK'
 */

import { ref, computed } from 'vue'
import { useTicketChat } from '../../../composables/useTicketChat'

const props = defineProps({
    ticketId: { type: String, required: true },
    status:   { type: String, default: 'OPEN' },
    viewerRole: { type: String, default: 'USER' }, // 'USER' | 'HELPDESK'
})

const scrollContainer = ref(null)

const {
    messages,
    inputText,
    isSending,
    isConnected,
    isLoadingHistory,
    connectionError,
    isClosed,
    sendMessage,
    handleKeydown,
} = useTicketChat(props.ticketId, computed(() => props.status), scrollContainer)

/** Tentukan row-class berdasarkan sender dan viewerRole */
const rowClass = (msg) => {
    const sender = msg.sender // 'USER' | 'HELPDESK' | 'SYSTEM'
    if (sender === 'SYSTEM') return 'is-system'
    // Dari sudut pandang viewer:
    // - Jika viewerRole=USER: pesan USER = kanan (is-user), HELPDESK = kiri (is-helpdesk)
    // - Jika viewerRole=HELPDESK: pesan HELPDESK = kanan (is-user), USER = kiri (is-helpdesk)
    const isMine = sender === props.viewerRole
    return isMine ? 'is-user' : 'is-helpdesk'
}

/** Ambil inisial nama untuk avatar helpdesk */
const initials = (name) => {
    if (!name) return 'H'
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Format waktu pesan */
const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    })
}

/** Label yang ditampilkan di meta */
const senderLabel = (msg) => {
    if (msg.sender === 'USER') return msg.senderName || 'User'
    if (msg.sender === 'HELPDESK') return msg.senderName || 'Helpdesk Team'
    return 'System'
}

const statusLabel = computed(() => {
    const map = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }
    return map[props.status] || props.status
})
</script>

<template>
    <!-- Wrapper — mengisi parent container sepenuhnya -->
    <div style="display: flex; flex-direction: column; height: 100%;">

        <!-- ── PANEL HEADER ── -->
        <div class="rtchat-header">
            <div class="rtchat-header-left">
                <div
                    class="rtchat-status-dot"
                    :class="isConnected ? 'connected' : 'disconnected'"
                ></div>
                <h3>
                    {{ viewerRole === 'HELPDESK' ? 'Live Chat with User' : 'Chat with Helpdesk' }}
                </h3>
            </div>
            <span class="rtchat-status-label">
                {{ isConnected ? 'Connected' : 'Connecting...' }}
            </span>
        </div>

        <!-- ── OFFLINE WARNING ── -->
        <div v-if="connectionError" class="rtchat-offline-banner">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {{ connectionError }}
        </div>

        <!-- ── MESSAGES ── -->
        <div class="rtchat-messages" ref="scrollContainer">

            <!-- Loading history -->
            <div v-if="isLoadingHistory" class="rtchat-loading">
                <div class="rtchat-dots">
                    <span></span><span></span><span></span>
                </div>
                Loading messages...
            </div>

            <!-- Empty state -->
            <div
                v-else-if="messages.length === 0"
                class="rtchat-empty"
            >
                <i class="fa-regular fa-comments"></i>
                <p>
                    {{ isClosed()
                        ? 'This ticket has been closed.'
                        : viewerRole === 'HELPDESK'
                            ? 'No messages yet. Reply to the user below.'
                            : 'No messages yet.\nSend a message to contact the Helpdesk team.' }}
                </p>
            </div>

            <!-- Message bubbles -->
            <template v-else>
                <div
                    v-for="(msg, i) in messages"
                    :key="msg.id || i"
                    class="rtchat-msg-row"
                    :class="rowClass(msg)"
                >
                    <!-- Avatar untuk pesan dari lawan bicara (kiri) -->
                    <div
                        v-if="rowClass(msg) === 'is-helpdesk'"
                        class="rtchat-helpdesk-avatar"
                        :title="senderLabel(msg)"
                    >
                        {{ initials(msg.senderName) }}
                    </div>

                    <!-- Bubble content -->
                    <div>
                        <div
                            class="rtchat-bubble"
                            :class="{ optimistic: msg.optimistic }"
                        >
                            {{ msg.message || msg.messageText }}
                        </div>

                        <!-- Meta: nama + waktu -->
                        <div
                            v-if="msg.sender !== 'SYSTEM'"
                            class="rtchat-meta"
                        >
                            <span>{{ senderLabel(msg) }}</span>
                            <span>·</span>
                            <span>{{ formatTime(msg.createdAt) }}</span>
                            <span v-if="msg.optimistic" style="color: #facc15;">
                                <i class="fa-solid fa-clock"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </template>

        </div>

        <!-- ── INPUT AREA ── -->
        <template v-if="isClosed()">
            <div class="rtchat-closed-notice">
                <i class="fa-solid fa-lock" style="margin-right:6px;"></i>
                Ticket is {{ statusLabel }} — chat is no longer available.
            </div>
        </template>

        <template v-else>
            <div class="rtchat-input-area">
                <textarea
                    class="rtchat-input"
                    v-model="inputText"
                    :placeholder="viewerRole === 'HELPDESK'
                        ? 'Reply to user...'
                        : 'Type your message to Helpdesk...'"
                    rows="1"
                    :disabled="isSending"
                    @keydown="handleKeydown"
                ></textarea>

                <button
                    class="rtchat-send-btn"
                    @click="sendMessage"
                    :disabled="!inputText.trim() || isSending"
                    title="Send (Enter)"
                >
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </template>

    </div>
</template>
