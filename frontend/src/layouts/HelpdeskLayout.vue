<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/styles/helpdesk.css'

defineProps({
    title: {
        type: String,
        default: 'Epson Helpdesk'
    },
    subtitle: {
        type: String,
        default: ''
    }
})

const router = useRouter()
const showLogoutModal = ref(false)

const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
}

const goToTickets = () => {
    router.push('/helpdesk/tickets')
}
</script>

<template>
    <div class="helpdesk-layout">

        <!-- SIDEBAR -->
        <aside class="helpdesk-sidebar">
            <div class="sidebar-brand">
                <img src="/logo.png" class="sidebar-logo" alt="Logo" />
                <div>
                    <div class="sidebar-title">Epson</div>
                    <div class="sidebar-subtitle">Helpdesk</div>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="sidebar-nav-label">Menu</div>
                <a class="sidebar-item active" @click="goToTickets">
                    <span class="sidebar-item-icon">
                        <i class="fa-solid fa-ticket"></i>
                    </span>
                    Tickets
                </a>
            </nav>

            <div class="sidebar-footer">
                <div class="sidebar-user-card">
                    <div class="sidebar-user-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name">Helpdesk Team</div>
                        <div class="sidebar-user-role">HELPDESK</div>
                    </div>
                </div>

                <button class="sidebar-logout" @click="showLogoutModal = true">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Logout
                </button>
            </div>
        </aside>

        <!-- MAIN -->
        <div class="helpdesk-main">

            <!-- TOP BAR -->
            <div class="helpdesk-topbar">
                <div>
                    <div class="topbar-title">{{ title }}</div>
                    <div v-if="subtitle" class="topbar-subtitle">{{ subtitle }}</div>
                </div>
            </div>

            <!-- CONTENT -->
            <div class="helpdesk-content">
                <slot />
            </div>

        </div>

        <!-- LOGOUT MODAL -->
        <div v-if="showLogoutModal" class="modal-overlay">
            <div class="logout-modal">
                <div class="modal-icon">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </div>
                <h3>Logout Confirmation</h3>
                <p>Are you sure you want to logout?</p>
                <div class="modal-actions">
                    <button class="cancel-button" @click="showLogoutModal = false">Cancel</button>
                    <button class="confirm-button" @click="logout">Logout</button>
                </div>
            </div>
        </div>

    </div>
</template>
