import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import socketService from '../services/socket.service'
import { getTicketMessages } from '../services/ticket.service'

/**
 * Composable untuk real-time chat pada tiket eskalasi.
 *
 * @param {string} ticketId - ID tiket yang sedang dibuka
 * @param {string} ticketStatus - Status tiket (OPEN | IN_PROGRESS | RESOLVED | CLOSED)
 * @param {HTMLElement | Ref<HTMLElement>} scrollEl - Elemen container pesan untuk auto-scroll
 */
export function useTicketChat(ticketId, ticketStatus, scrollEl) {
    const messages = ref([])
    const inputText = ref('')
    const isSending = ref(false)
    const isConnected = ref(false)
    const isLoadingHistory = ref(false)
    const connectionError = ref(null)

    const isClosed = () => ['RESOLVED', 'CLOSED'].includes(ticketStatus?.value ?? ticketStatus)

    const scrollToBottom = async () => {
        await nextTick()
        const el = scrollEl?.value ?? scrollEl
        if (el) {
            el.scrollTop = el.scrollHeight
        }
    }

    /** Load riwayat pesan dari REST API (saat pertama buka) */
    const loadHistory = async () => {
        try {
            isLoadingHistory.value = true
            const res = await getTicketMessages(ticketId)
            messages.value = res.data?.data ?? []
            scrollToBottom()
        } catch (err) {
            console.warn('[useTicketChat] Failed to load history:', err)
            // Tetap lanjut meskipun history gagal load (backend belum ada)
            messages.value = []
        } finally {
            isLoadingHistory.value = false
        }
    }

    /** Handler saat menerima pesan baru dari socket */
    const handleNewMessage = (msg) => {
        // Hindari duplikat jika pesan sudah ada (berdasarkan id)
        if (msg.id && messages.value.some((m) => m.id === msg.id)) return
        messages.value.push(msg)
        scrollToBottom()
    }

    /** Kirim pesan via socket */
    const sendMessage = () => {
        const text = inputText.value.trim()
        if (!text || isSending.value || isClosed()) return

        isSending.value = true
        socketService.sendMessage(ticketId, text)
        inputText.value = ''

        // Optimistic update — tambah pesan langsung ke UI
        // Server akan broadcast balik dengan data lengkap (id, senderName, dll)
        // Jika backend belum ready, pesan optimistic ini tetap tampil
        messages.value.push({
            id: `optimistic-${Date.now()}`,
            sender: 'USER',
            message: text,
            senderName: 'You',
            createdAt: new Date().toISOString(),
            optimistic: true,
        })
        scrollToBottom()
        isSending.value = false
    }

    /** Kirim pesan saat tekan Enter (bukan Shift+Enter) */
    const handleKeydown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            sendMessage()
        }
    }

    onMounted(async () => {
        // 1. Inisialisasi koneksi socket
        const socket = socketService.connect()

        socket.on('connect', () => {
            isConnected.value = true
            connectionError.value = null
            // Join room tiket setelah berhasil connect
            socketService.joinTicket(ticketId)
        })

        socket.on('connect_error', (err) => {
            isConnected.value = false
            connectionError.value = 'Tidak dapat terhubung ke server real-time. Menampilkan data tersimpan.'
        })

        // Jika sudah connected sebelumnya, langsung join
        if (socketService.isConnected()) {
            isConnected.value = true
            socketService.joinTicket(ticketId)
        }

        // 2. Listen event pesan baru
        socketService.onNewMessage(handleNewMessage)

        // 3. Load riwayat pesan lama
        await loadHistory()
    })

    onUnmounted(() => {
        socketService.leaveTicket(ticketId)
        socketService.offNewMessage(handleNewMessage)
    })

    return {
        messages,
        inputText,
        isSending,
        isConnected,
        isLoadingHistory,
        connectionError,
        isClosed,
        sendMessage,
        handleKeydown,
        loadHistory,
    }
}
