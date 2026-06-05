<template>
    <header class="admin-navbar">
        <h1 class="admin-navbar__title">
            {{ pageTitle }}
        </h1>

        <div class="admin-navbar__user">
            <div class="admin-navbar__info">
                <span class="admin-navbar__name">
                    {{ userName }}
                </span>

                <span class="admin-navbar__id">
                    ID: {{ employeeId }}
                </span>
            </div>

            <div class="admin-navbar__avatar">
                {{ initials }}
            </div>
        </div>
    </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'

const route = useRoute()
const authStore = useAuthStore()

const pageTitle = computed(() => {
    return route.meta?.title || 'Admin Dashboard'
})

const user = computed(() => authStore.user || {})

const userName = computed(() => {
    return user.value.name || user.value.email || ''
})

const employeeId = computed(() => {
    return user.value.employeeId || '-'
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
.admin-navbar {
    height: 58px;

    background: #2b4054;
    color: #f4f7fb;

    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 0 26px;

    border-bottom: 1px solid rgba(15, 23, 42, 0.24);
}

.admin-navbar__title {
    margin: 0;

    color: #f4f7fb;

    font-size: 16px;
    font-weight: 800;
    line-height: 1;
}

.admin-navbar__user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.admin-navbar__info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.admin-navbar__name {
    color: #f4f7fb;

    font-size: 12px;
    font-weight: 800;
    line-height: 1.1;
}

.admin-navbar__id {
    color: #aeb8c7;

    font-size: 10px;
    font-weight: 600;
    line-height: 1.1;
}

.admin-navbar__avatar {
    width: 32px;
    height: 32px;

    border-radius: 50%;

    background: #2f85ff;
    color: white;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 13px;
    font-weight: 800;
}
</style>
