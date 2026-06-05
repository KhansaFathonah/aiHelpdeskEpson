<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import adminService from '../../../services/admin.service'
import TopIssueChart from '../../analytics/components/TopIssueChart.vue'

const analytics  = ref(null)
const topIssues  = ref([])
const loading    = ref(true)

const pct = (val) => val != null ? `${(val * 100).toFixed(1)}%` : '-'
const ms  = (val) => val != null ? `${val}ms` : '-'

// Ambil data terbesar untuk bar chart sederhana
const maxCount = computed(() =>
    topIssues.value.reduce((m, i) => Math.max(m, i.count), 1)
)
const barWidth = (count) => `${Math.round((count / maxCount.value) * 100)}%`

const statCards = computed(() => {
    if (!analytics.value) return []
    const a = analytics.value
    return [
        {
            label: 'Total Sessions',
            value: a.totalSessions ?? '-',
            icon:  'fa-comments',
            color: '#3b82f6',
        },
        {
            label: 'Total Queries',
            value: a.totalQueries ?? '-',
            icon:  'fa-message',
            color: '#8b5cf6',
        },
        {
            label: 'Escalations',
            value: a.totalEscalations ?? '-',
            icon:  'fa-ticket',
            color: '#f59e0b',
        },
        {
            label: 'Deflection Rate',
            value: pct(a.deflectionRate),
            icon:  'fa-shield-halved',
            color: '#10b981',
            hint:  'Sessions resolved by AI without escalation',
        },
        {
            label: 'Resolution Rate',
            value: pct(a.resolutionRate),
            icon:  'fa-circle-check',
            color: '#06b6d4',
        },
        {
            label: 'Avg AI Response',
            value: ms(a.avgResponseTime),
            icon:  'fa-bolt',
            color: '#ec4899',
        },
    ]
})

onMounted(async () => {
    try {
        const [analyticsRes, issuesRes] = await Promise.all([
            adminService.getAnalytics(),
            adminService.getTopIssues(),
        ])
        analytics.value = analyticsRes.data.data
        topIssues.value = issuesRes.data.data ?? []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <AdminLayout title="Dashboard" subtitle="AI Helpdesk system analytics overview">

        <!-- LOADING -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            Loading analytics...
        </div>

        <template v-else>

            <!-- STAT CARDS -->
            <div class="admin-stat-grid">
                <div
                    v-for="card in statCards"
                    :key="card.label"
                    class="admin-stat-card"
                >
                    <div
                        class="admin-stat-icon"
                        :style="{ background: card.color + '22', color: card.color }"
                    >
                        <i class="fa-solid" :class="card.icon"></i>
                    </div>
                    <div class="admin-stat-info">
                        <div class="admin-stat-value">{{ card.value }}</div>
                        <div class="admin-stat-label">{{ card.label }}</div>
                        <div v-if="card.hint" class="admin-stat-hint">{{ card.hint }}</div>
                    </div>
                </div>
            </div>

            <!-- TOP ISSUES -->
            <TopIssueChart :issues="topIssues" style="margin-top: 24px;" />

        </template>

    </AdminLayout>
</template>

<style scoped>
.admin-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.admin-stat-card {
    background: #25345b;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    transition: transform 0.15s;
}
.admin-stat-card:hover { transform: translateY(-2px); }

.admin-stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
}

.admin-stat-value {
    font-size: 28px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
    margin-bottom: 4px;
}

.admin-stat-label {
    font-size: 12px;
    color: #c7d0ea;
    font-weight: 500;
}

.admin-stat-hint {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
    line-height: 1.4;
}

/* Top issues bar chart */
.top-issues-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.top-issue-row {
    display: flex;
    align-items: center;
    gap: 14px;
}

.top-issue-rank {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    width: 28px;
    flex-shrink: 0;
    text-align: center;
}

.top-issue-bar-wrap {
    flex: 1;
    min-width: 0;
}

.top-issue-name {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.top-issue-bar-bg {
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
    height: 8px;
    overflow: hidden;
}

.top-issue-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 999px;
    transition: width 0.6s ease;
}

.top-issue-count {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    width: 36px;
    text-align: right;
    flex-shrink: 0;
}
</style>
