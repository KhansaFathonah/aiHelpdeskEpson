<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HelpdeskLayout from '../../../layouts/HelpdeskLayout.vue'
import TicketChatPanel from '../components/TicketChatPanel.vue'

import ticketService from '../../../services/ticket.service'
import '../../../assets/styles/helpdesk.css'

const router = useRouter()
const route = useRoute()

const ticket = ref(null)
const chatMessages = ref([])
const loading = ref(false)
const sending = ref(false)
const toast = ref(null)
const showLogoutModal = ref(false)

const ticketId = route.params.id

const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
}

const goBack = () => {
    router.push('/helpdesk/tickets')
}

const showToast = (message, type = 'success') => {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 3000)
}

const updateStatus = async (newStatus) => {
    try {
        await ticketService.updateTicketStatus(ticketId, newStatus)
        ticket.value.status = newStatus
        showToast(`Status successfully changed to ${newStatus}`)
    } catch (error) {
        console.log(error)
        showToast('Failed to change status', 'error')
    }
}

const sendEmail = async () => {
    if (!ticket.value?.user?.email) {
        showToast('User email not found', 'error')
        return
    }

    try {
        sending.value = true

        await ticketService.sendEmailSummary({
            ticketId: ticketId,
            recipientEmail: ticket.value.user.email,
            subject: `Epson AI Helpdesk — Ticket Escalation Summary`,
        })

        showToast('Email summary sent successfully!')

    } catch (error) {
        console.log(error)
        showToast('Failed to send email', 'error')
    } finally {
        sending.value = false
    }
}

const statusLabel = (status) => {
    const map = {
        OPEN: 'OPEN',
        IN_PROGRESS: 'IN PROGRESS',
        RESOLVED: 'RESOLVED',
        CLOSED: 'CLOSED',
    }
    return map[status] || status
}

const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

onMounted(async () => {
    try {
        loading.value = true

        const ticketRes = await ticketService.getTicket(ticketId)
        // Backend returns the ticket object directly in data.data
        ticket.value = ticketRes.data.data

        if (ticket.value?.session?.id) {
            const sessionRes = await ticketService.getChatSession(
                ticket.value.session.id
            )
            chatMessages.value = sessionRes.data.data?.messages || []
        }

    } catch (error) {
        console.log(error)
    } finally {
        loading.value = false
    }
})

</script>

<template>
    <HelpdeskLayout title="Helpdesk Team">
        <!-- LOADING -->
                <div v-if="loading" class="loading-state">
                    Loading ticket details...
                </div>

                <template v-else-if="ticket">

                    <!-- BREADCRUMB -->
                    <div class="breadcrumb">
                        <a @click="goBack">Tickets</a>
                        <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
                        <span>Ticket Details</span>
                    </div>

                    <!-- DETAIL HEADER -->
                    <div class="detail-header">

                        <h1>Ticket Details</h1>

                        <div class="detail-actions">

                            <select
                                class="status-select"
                                :value="ticket.status"
                                @change="updateStatus($event.target.value)"
                            >
                                <option value="OPEN">OPEN</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>

                            <button
                                class="btn-email"
                                @click="sendEmail"
                                :disabled="sending"
                            >
                                <i class="fa-solid fa-envelope"></i>
                                {{ sending ? 'Sending...' : 'Send Email Summary' }}
                            </button>

                        </div>

                    </div>

                    <!-- TWO COLUMN GRID -->
                    <div class="detail-grid">

                        <!-- LEFT COLUMN -->
                        <div>

                            <!-- AI SUMMARY -->
                            <div class="detail-card">

                                <div class="detail-card-header">
                                    <i class="fa-solid fa-robot"></i>
                                    <h3>Issue Summary (AI)</h3>
                                </div>

                                <div class="detail-card-body">
                                    <p class="ai-summary-text">
                                        {{ ticket.summary || 'No summary available.' }}
                                    </p>
                                </div>

                            </div>

                            <!-- AI CHAT HISTORY (Read-only reference) -->
                            <div class="detail-card">

                                <div class="detail-card-header">
                                    <i class="fa-solid fa-robot"></i>
                                    <h3>AI Chat History</h3>
                                </div>

                                <div class="detail-card-body">
                                    <div class="chat-history">

                                        <template
                                            v-for="(msg, index) in chatMessages"
                                            :key="index"
                                        >

                                            <!-- USER BUBBLE -->
                                            <div
                                                v-if="msg.sender === 'USER'"
                                                class="chat-msg-user"
                                            >
                                                <div class="chat-bubble-user">
                                                    {{ msg.messageText }}
                                                </div>
                                            </div>

                                            <!-- AI BUBBLE -->
                                            <div
                                                v-else-if="msg.sender === 'AI'"
                                                class="chat-msg-ai"
                                            >
                                                <div class="chat-bubble-ai">
                                                    {{ msg.messageText }}
                                                </div>
                                            </div>

                                            <!-- SYSTEM MESSAGE -->
                                            <div
                                                v-else
                                                class="chat-system-msg"
                                            >
                                                {{ msg.messageText }}
                                            </div>

                                        </template>

                                        <div
                                            v-if="chatMessages.length === 0"
                                            style="text-align:center; color:#94a3b8; font-size:13px; padding:16px;"
                                        >
                                            No AI chat history
                                        </div>

                                    </div>
                                </div>

                            </div>

                            <!-- REAL-TIME CHAT (Helpdesk ↔ User) -->
                            <div class="detail-card" style="min-height: 420px; display: flex; flex-direction: column;">

                                <div class="detail-card-header">
                                    <i class="fa-solid fa-headset"></i>
                                    <h3>Live Chat with User</h3>
                                </div>

                                <div style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
                                    <TicketChatPanel
                                        v-if="ticket"
                                        :ticketId="ticket.id"
                                        :status="ticket.status"
                                        viewerRole="HELPDESK"
                                        style="flex: 1;"
                                    />
                                </div>

                            </div>

                        </div>

                        <!-- RIGHT COLUMN -->
                        <div>

                            <!-- TICKET INFO -->
                            <div class="detail-card">

                                <div class="detail-card-header">
                                    <i class="fa-solid fa-circle-info"></i>
                                    <h3>Ticket Information</h3>
                                </div>

                                <div class="detail-card-body">

                                    <div class="info-row">
                                        <span class="info-label">Status</span>
                                        <span class="info-value">
                                            <span
                                                class="badge"
                                                :class="`badge-${ticket.status?.toLowerCase()}`"
                                            >
                                                {{ statusLabel(ticket.status) }}
                                            </span>
                                        </span>
                                    </div>

                                    <div class="info-row">
                                        <span class="info-label">Priority</span>
                                        <span class="info-value">
                                            <span
                                                class="badge"
                                                :class="`badge-${ticket.priority?.toLowerCase() || 'medium'}`"
                                            >
                                                {{ ticket.priority || 'MEDIUM' }}
                                            </span>
                                        </span>
                                    </div>



                                    <div class="info-row">
                                        <span class="info-label">Category</span>
                                        <span class="info-value">
                                            {{ ticket.category?.name || '-' }}
                                        </span>
                                    </div>

                                    <div class="info-row">
                                        <span class="info-label">Created At</span>
                                        <span class="info-value">
                                            {{ formatDate(ticket.createdAt) }}
                                        </span>
                                    </div>

                                    <div class="info-row">
                                        <span class="info-label">Last Updated</span>
                                        <span class="info-value">
                                            {{ formatDate(ticket.updatedAt) }}
                                        </span>
                                    </div>

                                </div>

                            </div>

                            <!-- USER INFO -->
                            <div class="detail-card">

                                <div class="detail-card-header">
                                    <i class="fa-solid fa-user"></i>
                                    <h3>User Information</h3>
                                </div>

                                <div class="detail-card-body">

                                    <div class="info-row">
                                        <span class="info-label">Name</span>
                                        <span class="info-value">
                                            {{ ticket.user?.name || '-' }}
                                        </span>
                                    </div>

                                    <div class="info-row">
                                        <span class="info-label">Employee ID</span>
                                        <span class="info-value">
                                            {{ ticket.user?.employeeId || '-' }}
                                        </span>
                                    </div>

                                    <div class="info-row">
                                        <span class="info-label">Department</span>
                                        <span class="info-value">
                                            {{ ticket.user?.department || '-' }}
                                        </span>
                                    </div>

                                    <div class="info-row">
                                        <span class="info-label">Email</span>
                                        <span class="info-value" style="font-size:12px;">
                                            {{ ticket.user?.email || '-' }}
                                        </span>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </template>

        <!-- TOAST NOTIFICATION -->
        <Teleport to="body">
            <div
                v-if="toast"
                class="toast"
                :class="toast.type"
            >
                <i
                    class="fa-solid"
                    :class="toast.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check'"
                ></i>
                {{ toast.message }}
            </div>
        </Teleport>

    </HelpdeskLayout>
    
    
</template>
