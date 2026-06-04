<script setup>
import { onMounted, ref } from "vue";

import IssueCard from "../components/IssueCard.vue";
import TicketDetailModal from "../components/TicketDetailModal.vue";
import TicketChatPanel from "../components/TicketChatPanel.vue";

import { getMyTickets } from "../../../services/ticket.service";

import "../../../assets/styles/ticket.css";
import "../../../assets/styles/helpdesk.css";

const loading = ref(false);
const tickets = ref([]);
const selectedTicket = ref(null);
const chatTicket = ref(null); // tiket yang sedang dibuka untuk real-time chat

const loadTickets = async () => {
    try {
        loading.value = true;

        const response = await getMyTickets();

        tickets.value = response.data.data || [];
    } catch (error) {
        console.error("Failed to load tickets:", error);
    } finally {
        loading.value = false;
    }
};

const openTicket = (ticket) => {
    selectedTicket.value = ticket;
};

const closeTicket = () => {
    selectedTicket.value = null;
};

const openChat = (ticket) => {
    chatTicket.value = ticket;
};

const closeChat = () => {
    chatTicket.value = null;
};

onMounted(() => {
    loadTickets();
});
</script>


<template>
    <div class="user-tickets-page">
        <div class="ticket-page-header">
            <button
                class="back-button"
                @click="$router.back()"
            >
                <i class="fa-solid fa-arrow-left"></i>
            </button>

            <div class="header-info">
                <img
                    src="/logo.png"
                    class="header-logo"
                />

                <div>
                    <h1>My Tickets</h1>

                    <p>
                        Track your escalated support tickets
                    </p>
                </div>
            </div>
        </div>

        <div
            v-if="loading"
            class="ticket-loading"
        >
            Loading tickets...
        </div>

        <div
            v-else-if="tickets.length === 0"
            class="empty-ticket-state"
        >
            <h3>
                No Tickets Found
            </h3>

            <p>
                You haven't escalated any issue yet.
            </p>

            <button
                class="start-chat-btn"
                @click="$router.push('/chat')"
            >
                Start Chat
            </button>
        </div>

        <!-- Ticket list — setiap card punya tombol chat -->
        <div
            v-else
            class="ticket-list"
        >
            <div
                v-for="ticket in tickets"
                :key="ticket.id"
                class="ticket-card-wrapper"
            >
                <IssueCard
                    :ticket="ticket"
                    @click="openTicket(ticket)"
                />

                <!-- Tombol Open Chat — hanya tampil jika tiket belum CLOSED -->
                <button
                    v-if="ticket.status !== 'CLOSED'"
                    class="ticket-open-chat-btn"
                    @click.stop="openChat(ticket)"
                    :title="'Open live chat for this ticket'"
                >
                    <i class="fa-solid fa-headset"></i>
                    <span>Chat with Helpdesk</span>
                    <span
                        v-if="ticket.status === 'OPEN'"
                        class="ticket-chat-badge"
                    >OPEN</span>
                </button>
            </div>
        </div>

        <!-- Ticket Detail Modal -->
        <TicketDetailModal
            v-if="selectedTicket"
            :ticket="selectedTicket"
            @close="closeTicket"
        />

        <!-- Real-time Chat Modal (User ↔ Helpdesk) -->
        <Teleport to="body">
            <div
                v-if="chatTicket"
                class="ticket-chat-modal-overlay"
                @click.self="closeChat"
            >
                <div class="ticket-chat-modal">

                    <!-- Modal Header -->
                    <div class="ticket-chat-modal-header">
                        <div class="ticket-chat-modal-header-left">
                            <div class="ticket-chat-modal-avatar">
                                <i class="fa-solid fa-headset"></i>
                            </div>
                            <div>
                                <div class="ticket-chat-modal-title">
                                    Helpdesk Support
                                </div>
                                <div class="ticket-chat-modal-subtitle">
                                    <span
                                        class="rtchat-status-dot"
                                        :class="chatTicket.status === 'CLOSED' || chatTicket.status === 'RESOLVED'
                                            ? 'disconnected'
                                            : 'connected'"
                                        style="display:inline-block;"
                                    ></span>
                                    {{ chatTicket.ticketCode || 'Ticket' }} ·
                                    {{ chatTicket.status }}
                                </div>
                            </div>
                        </div>

                        <button class="ticket-chat-close-btn" @click="closeChat">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- Chat Panel (mengisi sisa ruang modal) -->
                    <TicketChatPanel
                        :ticketId="chatTicket.id"
                        :status="chatTicket.status"
                        viewerRole="USER"
                        style="flex: 1; min-height: 0;"
                    />

                </div>
            </div>
        </Teleport>
    </div>
</template>

