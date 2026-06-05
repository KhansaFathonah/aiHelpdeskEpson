import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:4000'

let socket = null

/**
 * Inisialisasi koneksi Socket.IO menggunakan JWT token dari localStorage.
 * Jika sudah terhubung, langsung return instance yang ada.
 */
export const connect = () => {
    if (socket?.connected) return socket

    const token = localStorage.getItem('token')

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason)
    })

    return socket
}

/**
 * Join ke room tiket tertentu supaya bisa terima/kirim pesan real-time.
 * @param {string} ticketId
 */
export const joinTicket = (ticketId) => {
    if (!socket) return
    socket.emit('join_ticket', { ticketId })
}

/**
 * Leave dari room tiket.
 * @param {string} ticketId
 */
export const leaveTicket = (ticketId) => {
    if (!socket) return
    socket.emit('leave_ticket', { ticketId })
}

/**
 * Kirim pesan ke room tiket.
 * @param {string} ticketId
 * @param {string} message
 */
export const sendMessage = (ticketId, message) => {
    if (!socket) return
    socket.emit('send_message', { ticketId, message })
}

/**
 * Dengarkan event pesan baru dari server.
 * @param {Function} callback - fn({ id, senderId, senderName, senderRole, message, sender, createdAt })
 */
export const onNewMessage = (callback) => {
    if (!socket) return
    socket.on('new_message', callback)
}

/**
 * Dengarkan event notifikasi tiket baru (untuk Helpdesk).
 * @param {Function} callback - fn(ticket)
 */
export const onNewTicket = (callback) => {
    if (!socket) return
    socket.on('new_ticket', callback)
}

/**
 * Hapus listener event pesan baru.
 * Penting dipanggil saat komponen di-unmount untuk mencegah memory leak.
 */
export const offNewMessage = (callback) => {
    if (!socket) return
    socket.off('new_message', callback)
}

/**
 * Hapus listener event tiket baru.
 */
export const offNewTicket = (callback) => {
    if (!socket) return
    socket.off('new_ticket', callback)
}

/**
 * Putuskan koneksi socket sepenuhnya.
 */
export const disconnect = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

/**
 * Cek apakah socket saat ini terhubung.
 */
export const isConnected = () => socket?.connected ?? false

export default {
    connect,
    joinTicket,
    leaveTicket,
    sendMessage,
    onNewMessage,
    onNewTicket,
    offNewMessage,
    offNewTicket,
    disconnect,
    isConnected,
}
