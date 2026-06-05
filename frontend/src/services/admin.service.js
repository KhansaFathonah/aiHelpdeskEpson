import api from './api'

// ── Analytics & Dashboard ──────────────────────────────
export const getAnalytics    = ()       => api.get('/admin/analytics')
export const getTopIssues    = ()       => api.get('/admin/top-issues')

// ── Chat Logs ──────────────────────────────────────────
export const getChatLogs     = (params) => api.get('/admin/chat-logs', { params })
export const getChatLogById  = (id)     => api.get(`/admin/chat-logs/${id}`)

// ── Knowledge Base ─────────────────────────────────────
export const getKnowledge    = ()               => api.get('/admin/knowledge')
export const createKnowledge = (payload)        => api.post('/admin/knowledge', payload)
export const updateKnowledge = (id, payload)    => api.put(`/admin/knowledge/${id}`, payload)
export const deleteKnowledge = (id)             => api.delete(`/admin/knowledge/${id}`)

// ── Email Logs ──────────────────────────────────────────
export const getEmailLogs    = (params) => api.get('/email-logs', { params })

export default {
    getAnalytics,
    getTopIssues,
    getChatLogs,
    getChatLogById,
    getKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    getEmailLogs,
}
