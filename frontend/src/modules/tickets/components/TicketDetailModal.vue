<script setup>
import { ref } from 'vue';

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
});

const emit = defineEmits([
    'close',
    'send-comment'
]);

const comment = ref('');

const getCategoryName = () => {
    return props.ticket.category?.name
        || 'AI Chat Escalation';
};

const getAssignedName = () => {
    const assigned =
        props.ticket.assignedHelpdesk
        || props.ticket.assignedTo
        || props.ticket.assignee
        || props.ticket.helpdesk;

    if (!assigned) return 'Unassigned';
    if (typeof assigned === 'string') return assigned;

    return assigned.name
        || assigned.email
        || 'Unassigned';
};

const getTicketCode = () => {
    return props.ticket.ticketCode || '-';
};

const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString();
};

const formatDateTime = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleString();
};

const sendComment = () => {
    emit('send-comment', comment.value);
    comment.value = '';
};
</script>

<template>
    <div
        class="ticket-modal-overlay"
        @click.self="emit('close')"
    >
        <div class="ticket-detail-modal">
            <div class="ticket-modal-header">
                <h2>
                    Ticket Details
                </h2>

                <button
                    class="close-btn"
                    @click="emit('close')"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="ticket-modal-body">
                <div class="ticket-badges">
                    <span class="ticket-id">
                        {{ getTicketCode() }}
                    </span>

                    <span
                        class="status-badge"
                        :class="ticket.status?.toLowerCase()"
                    >
                        {{ ticket.status || '-' }}
                    </span>

                    <span
                        class="priority-badge"
                        :class="ticket.priority?.toLowerCase()"
                    >
                        {{ ticket.priority || '-' }}
                    </span>

                    <span class="category-badge">
                        {{ getCategoryName() }}
                    </span>
                </div>

                <section class="ticket-summary-section">
                    <h3>
                        Ringkasan percakapan AI
                    </h3>

                    <div class="ticket-summary-scroll">
                        {{ ticket.summary || '-' }}
                    </div>
                </section>

                <section class="ticket-info-grid">
                    <div>
                        <span class="label">
                            Created
                        </span>

                        <strong>
                            {{ formatDate(ticket.createdAt) }}
                        </strong>
                    </div>

                    <div>
                        <span class="label">
                            Last Updated
                        </span>

                        <strong>
                            {{ formatDate(ticket.updatedAt) }}
                        </strong>
                    </div>

                    <div>
                        <span class="label">
                            Assigned To
                        </span>

                        <strong>
                            {{ getAssignedName() }}
                        </strong>
                    </div>

                    <div>
                        <span class="label">
                            Category
                        </span>

                        <strong>
                            {{ getCategoryName() }}
                        </strong>
                    </div>
                </section>

                <section class="timeline-section">
                    <h4>
                        <i class="fa-regular fa-message"></i>
                        Activity Timeline
                    </h4>

                    <div class="timeline-item">
                        <div class="timeline-icon">
                            <i class="fa-regular fa-user"></i>
                        </div>

                        <div class="timeline-content">
                            <div class="timeline-meta">
                                <strong>
                                    System
                                </strong>

                                <small>
                                    {{ formatDateTime(ticket.createdAt) }}
                                </small>
                            </div>

                            <p>
                                Ticket created from AI chat escalation
                            </p>
                        </div>
                    </div>
                </section>

                <section class="comment-section">
                    <label>
                        Add Comment
                    </label>

                    <div class="comment-box">
                        <textarea
                            v-model="comment"
                            rows="1"
                            placeholder="Type your comment..."
                        ></textarea>

                        <button
                            class="send-btn"
                            @click="sendComment"
                        >
                            <i class="fa-regular fa-paper-plane"></i>
                            Send
                        </button>
                    </div>
                </section>

                <div class="ticket-note">
                    <strong>
                        Note:
                    </strong>
                    Only helpdesk staff and admins can change ticket status.
                </div>
            </div>
        </div>
    </div>
</template>
