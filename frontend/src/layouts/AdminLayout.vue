<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import '../assets/styles/helpdesk.css'

defineProps({
    title:    { type: String, default: 'Admin Panel' },
    subtitle: { type: String, default: '' },
})

const router  = useRouter()
const route   = useRoute()
const showLogoutModal = ref(false)

const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
}

const isActive = (path) => route.path.startsWith(path)
</script>

<template>
    <div class="helpdesk-layout">

        <!-- SIDEBAR -->
        <aside class="helpdesk-sidebar">
            <div class="sidebar-brand">
                <img src="/logo.png" class="sidebar-logo" alt="Logo" />
                <div>
                    <div class="sidebar-title">Epson</div>
                    <div class="sidebar-subtitle">Admin Panel</div>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="sidebar-nav-label">Overview</div>

                <a
                    class="sidebar-item"
                    :class="{ active: isActive('/admin/dashboard') }"
                    @click="router.push('/admin/dashboard')"
                >
                    <span class="sidebar-item-icon">
                        <i class="fa-solid fa-chart-pie"></i>
                    </span>
                    Dashboard
                </a>

                <div class="sidebar-nav-label" style="margin-top:12px;">Management</div>

                <a
                    class="sidebar-item"
                    :class="{ active: isActive('/admin/chat-logs') }"
                    @click="router.push('/admin/chat-logs')"
                >
                    <span class="sidebar-item-icon">
                        <i class="fa-solid fa-comments"></i>
                    </span>
                    Chat Logs
                </a>

                <a
                    class="sidebar-item"
                    :class="{ active: isActive('/admin/knowledge') }"
                    @click="router.push('/admin/knowledge')"
                >
                    <span class="sidebar-item-icon">
                        <i class="fa-solid fa-book"></i>
                    </span>
                    Knowledge Base
                </a>

                <a
                    class="sidebar-item"
                    :class="{ active: isActive('/admin/email-logs') }"
                    @click="router.push('/admin/email-logs')"
                >
                    <span class="sidebar-item-icon">
                        <i class="fa-solid fa-envelope"></i>
                    </span>
                    Email Logs
                </a>
            </nav>

            <div class="sidebar-footer">
                <div class="sidebar-user-card">
                    <div class="sidebar-user-avatar">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name">Administrator</div>
                        <div class="sidebar-user-role">ADMIN</div>
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
