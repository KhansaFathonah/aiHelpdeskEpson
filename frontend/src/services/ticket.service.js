import api from './api'

export const getMyTickets = () => {
    return api.get('/tickets/my');
};

export const escalateTicket = (payload) => {
    return api.post('/tickets/escalate', payload);
};

export const getTickets = () => api.get('/tickets');
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const updateTicketStatus = (id, status) => api.patch(`/tickets/${id}/status`, { status });
export const sendEmailSummary = (payload) => api.post('/reports/send-email', payload);
export const getChatSession = (id) => api.get(`/chat/sessions/${id}`);

export default {
    getMyTickets,
    escalateTicket,
    createTicket: escalateTicket,
    getTickets,
    getTicket,
    updateTicketStatus,
    sendEmailSummary,
    getChatSession,
};
