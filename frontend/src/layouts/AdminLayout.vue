<template>
    <div class="admin-layout">
        <Sidebar />

        <div class="admin-layout__main">
            <NavbarAdmin />

            <main class="admin-layout__content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup>
import Sidebar from '../components/layout/Sidebar.vue'
import NavbarAdmin from '../components/layout/NavbarAdmin.vue'
</script>

<style scoped>
.admin-layout {
    display: flex;
    height: 100vh;
    background: #1b2c43;
    overflow: hidden;
}

.admin-layout__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
}

.admin-layout__content {
    flex: 1;
    padding: 30px 26px;
    overflow-y: auto;
    min-height: 0;
}

:deep(.admin-page h2) {
    margin: 0;

    color: #f4f7fb;

    font-size: 26px;
    font-weight: 800;
}
</style>
