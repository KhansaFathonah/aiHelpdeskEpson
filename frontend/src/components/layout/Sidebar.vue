<template>
    <aside class="admin-sidebar">
        <div class="admin-sidebar__brand">
            <div class="admin-sidebar__logo">
                <img
                    src="/logo.png"
                    alt="Epson AI Helpdesk"
                />
            </div>

            <div>
                <div class="admin-sidebar__brand-title">
                    Epson
                </div>

                <div class="admin-sidebar__brand-subtitle">
                    AI Helpdesk
                </div>
            </div>
        </div>

        <div class="admin-sidebar__label">
            Menu
        </div>

        <nav class="admin-sidebar__nav">
            <RouterLink
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                class="admin-sidebar__item"
            >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
            </RouterLink>
        </nav>

        <div class="admin-sidebar__footer">
            <div class="admin-sidebar__user">
                <div class="admin-sidebar__avatar">
                    {{ initials }}
                </div>

                <div>
                    <div class="admin-sidebar__user-name">
                        {{ userName }}
                    </div>

                    <div class="admin-sidebar__user-id">
                        {{ employeeId }}
                    </div>
                </div>
            </div>

            <button
                class="admin-sidebar__logout"
                @click="logout"
            >
                <i class="fa-solid fa-right-from-bracket"></i>
                Logout
            </button>
        </div>
    </aside>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const { user, logout } = useAuth()

const menuItems = [
    {
        label: 'Dashboard',
        to: '/admin/dashboard',
        icon: 'fa-solid fa-house',
    },
    {
        label: 'Knowledge Base',
        to: '/admin/knowledge',
        icon: 'fa-solid fa-book',
    },
    {
        label: 'Chat Logs',
        to: '/admin/chat-logs',
        icon: 'fa-regular fa-message',
    },
    {
        label: 'Email Logs',
        to: '/admin/email-logs',
        icon: 'fa-regular fa-envelope',
    },
    {
        label: 'Escalated Tickets',
        to: '/admin/tickets',
        icon: 'fa-solid fa-triangle-exclamation',
    },
    {
        label: 'Analytics',
        to: '/admin/analytics',
        icon: 'fa-solid fa-chart-column',
    },
    {
        label: 'Reports',
        to: '/admin/reports',
        icon: 'fa-regular fa-file-lines',
    },
]

const userName = computed(() => {
    return user.value?.name || user.value?.email || ''
})

const employeeId = computed(() => {
    return user.value?.employeeId || '-'
})

const initials = computed(() => {
    const source = userName.value || employeeId.value

    return source
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
})
</script>

<style scoped>
.admin-sidebar {
    width: 204px;
    height: 100vh;
    flex-shrink: 0;

    background: #2f4559;
    color: #b8c4d0;

    display: flex;
    flex-direction: column;
    overflow: hidden;

    border-right: 1px solid rgba(15, 23, 42, 0.36);
}

.admin-sidebar__brand {
    height: 68px;

    display: flex;
    align-items: center;
    gap: 10px;

    padding: 0 18px;
}

.admin-sidebar__logo {
    width: 32px;
    height: 32px;

    border-radius: 8px;

    background: #3da2e8;

    display: flex;
    align-items: center;
    justify-content: center;
}

.admin-sidebar__logo img {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.admin-sidebar__brand-title {
    color: #f4f7fb;

    font-size: 12px;
    font-weight: 800;
}

.admin-sidebar__brand-subtitle {
    color: #9fadb9;

    font-size: 11px;
    font-weight: 600;
}

.admin-sidebar__label {
    margin: 0 18px 14px;

    color: #93a2af;

    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
}

.admin-sidebar__nav {
    display: flex;
    flex-direction: column;
    gap: 6px;

    padding: 0 12px;
    overflow-y: auto;
}

.admin-sidebar__item {
    min-height: 36px;

    border-radius: 7px;

    color: #aeb8c7;
    text-decoration: none;

    display: flex;
    align-items: center;
    gap: 10px;

    padding: 0 12px;

    font-size: 12px;
    font-weight: 800;
}

.admin-sidebar__item i {
    width: 16px;
    text-align: center;

    font-size: 13px;
}

.admin-sidebar__item.router-link-active {
    background: #3da2e8;
    color: white;
}

.admin-sidebar__footer {
    margin-top: auto;

    padding: 14px 12px;

    border-top: 1px solid rgba(15, 23, 42, 0.32);
}

.admin-sidebar__user {
    display: flex;
    align-items: center;
    gap: 10px;

    margin-bottom: 12px;
}

.admin-sidebar__avatar {
    width: 26px;
    height: 26px;

    border-radius: 50%;

    background: #2f85ff;
    color: white;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 11px;
    font-weight: 800;
}

.admin-sidebar__user-name {
    color: #f4f7fb;

    font-size: 12px;
    font-weight: 800;
}

.admin-sidebar__user-id {
    color: #9fadb9;

    font-size: 11px;
    font-weight: 600;
}

.admin-sidebar__logout {
    width: 100%;
    height: 30px;

    border: none;
    border-radius: 6px;

    background: #ef4438;
    color: white;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    font-size: 12px;
    font-weight: 800;

    cursor: pointer;
}
</style>
