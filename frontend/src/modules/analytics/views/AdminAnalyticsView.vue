<script setup>
import { computed, onMounted, ref } from 'vue'
import adminService from '../../../services/admin.service'

const analytics = ref(null)
const topIssues = ref([])
const loading = ref(true)
const error = ref('')

const today = new Date()
const startDate = ref(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30).toISOString().slice(0, 10))
const endDate = ref(today.toISOString().slice(0, 10))

const issueColors = ['#3da2e8', '#31d57b', '#f5a31a', '#9b59b6', '#ef5148', '#a9bcc1']
const confidenceRows = [
    { key: 'high', label: 'High (>=80%)', color: '#31d57b' },
    { key: 'medium', label: 'Medium (60-79%)', color: '#3da2e8' },
    { key: 'low', label: 'Low (<60%)', color: '#f5a31a' },
    { key: 'noConfidence', label: 'No Confidence', color: '#ef5148' },
]

const numberFmt = new Intl.NumberFormat('en-US')

const formatNumber = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return numberFmt.format(value)
}

const formatRate = (value, digits = 1) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return `${(Number(value) * 100).toFixed(digits)}%`
}

const ratio = (value, total) => total ? value / total : 0

const summaryCards = computed(() => {
    const data = analytics.value ?? {}
    const escalationRate = ratio(data.totalEscalations ?? 0, data.totalSessions ?? 0)

    return [
        {
            label: 'Total Chats',
            value: formatNumber(data.totalSessions ?? 0),
            delta: `${formatNumber(data.totalQueries ?? 0)} user queries`,
            icon: 'fa-message',
            tone: 'blue',
        },
        {
            label: 'AI Resolution Rate',
            value: formatRate(data.resolutionRate ?? 0),
            delta: `${formatRate(data.deflectionRate ?? 0)} without escalation`,
            icon: 'fa-circle-check',
            tone: 'green',
        },
        {
            label: 'Avg Escalation Rate',
            value: formatRate(escalationRate),
            delta: `${formatNumber(data.totalEscalations ?? 0)} escalated tickets`,
            icon: 'fa-circle-exclamation',
            tone: 'orange',
        },
        {
            label: 'Knowledge Articles',
            value: formatNumber(data.totalKnowledge ?? 0),
            delta: `+${formatNumber(data.knowledgeThisMonth ?? 0)} this month`,
            icon: 'fa-chart-simple',
            tone: 'purple',
        },
    ]
})

const issueRows = computed(() => {
    const total = topIssues.value.reduce((sum, item) => sum + (item.count ?? 0), 0)
    const max = topIssues.value.reduce((highest, item) => Math.max(highest, item.count ?? 0), 1)

    return topIssues.value.map((item, index) => ({
        label: item.name,
        count: item.count ?? 0,
        percent: Math.round(ratio(item.count ?? 0, total) * 100),
        width: `${Math.max(ratio(item.count ?? 0, max) * 100, item.count ? 8 : 0)}%`,
        color: issueColors[index] ?? issueColors[issueColors.length - 1],
    }))
})

const resolutionTrend = computed(() => {
    const rows = analytics.value?.resolutionTrend ?? []
    const max = rows.reduce((highest, item) => Math.max(highest, item.resolved ?? 0, item.escalated ?? 0), 1)

    return rows.map((item) => ({
        ...item,
        resolvedHeight: `${Math.max(ratio(item.resolved ?? 0, max) * 100, item.resolved ? 12 : 0)}%`,
        escalatedHeight: `${Math.max(ratio(item.escalated ?? 0, max) * 100, item.escalated ? 8 : 0)}%`,
    }))
})

const escalationRateTrend = computed(() => {
    const rows = analytics.value?.escalationRateTrend ?? []
    const max = rows.reduce((highest, item) => Math.max(highest, item.rate ?? 0), 0.01)

    return rows.map((item) => ({
        ...item,
        percent: formatRate(item.rate ?? 0),
        height: `${Math.max(ratio(item.rate ?? 0, max) * 100, item.rate ? 14 : 0)}%`,
        tone: (item.rate ?? 0) >= 0.12 ? 'danger' : (item.rate ?? 0) >= 0.08 ? 'warning' : 'success',
    }))
})

const knowledgeRows = computed(() => {
    const rows = analytics.value?.knowledgeUsage ?? []
    const max = rows.reduce((highest, item) => Math.max(highest, item.count ?? 0), 1)

    return rows.map((item) => ({
        ...item,
        width: `${Math.max(ratio(item.count ?? 0, max) * 100, item.count ? 8 : 0)}%`,
    }))
})

const confidenceDistribution = computed(() => {
    const counts = analytics.value?.escalationConfidence ?? {}
    const total = confidenceRows.reduce((sum, item) => sum + (counts[item.key] ?? 0), 0)

    return confidenceRows.map((item) => ({
        ...item,
        count: counts[item.key] ?? 0,
        percent: Math.round(ratio(counts[item.key] ?? 0, total) * 100),
        width: `${Math.max(ratio(counts[item.key] ?? 0, total) * 100, counts[item.key] ? 8 : 0)}%`,
    }))
})

const escalationInsight = computed(() => {
    const trend = escalationRateTrend.value
    if (trend.length < 2) return 'Not enough weekly escalation data yet.'

    const first = trend[0].rate ?? 0
    const last = trend[trend.length - 1].rate ?? 0
    const change = first ? ((last - first) / first) * 100 : 0
    const direction = change > 0 ? 'increased' : 'decreased'

    return `Escalation rate has ${direction} by ${Math.abs(change).toFixed(1)}% across the visible weeks.`
})

const confidenceInsight = computed(() => {
    const high = confidenceDistribution.value.find((item) => item.key === 'high')?.percent ?? 0
    return high
        ? `${high}% of escalated tickets have high confidence snapshots.`
        : 'No high-confidence escalation snapshots recorded yet.'
})

const loadAnalytics = async () => {
    try {
        loading.value = true
        error.value = ''
        const [analyticsResponse, issuesResponse] = await Promise.all([
            adminService.getAnalytics(),
            adminService.getTopIssues(),
        ])
        analytics.value = analyticsResponse.data?.data ?? null
        topIssues.value = issuesResponse.data?.data ?? []
    } catch (err) {
        console.error(err)
        error.value = 'Failed to load analytics.'
    } finally {
        loading.value = false
    }
}

onMounted(loadAnalytics)
</script>

<template>
    <section class="admin-analytics-page">
        <div v-if="loading" class="admin-analytics-loading">
            <div class="loading-spinner"></div>
            Loading analytics...
        </div>

        <template v-else>
            <header class="admin-analytics-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Detailed insights and performance metrics</p>
                </div>

                <div class="admin-analytics-date-range">
                    <i class="fa-regular fa-calendar"></i>
                    <input v-model="startDate" type="date" />
                    <span>to</span>
                    <input v-model="endDate" type="date" />
                </div>
            </header>

            <div v-if="error" class="admin-analytics-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>{{ error }}</span>
            </div>

            <template v-else>
                <section class="admin-analytics-cards">
                    <article v-for="card in summaryCards" :key="card.label" class="admin-analytics-card">
                        <div class="admin-analytics-card-top">
                            <span class="admin-analytics-icon" :class="`is-${card.tone}`">
                                <i class="fa-solid" :class="card.icon"></i>
                            </span>
                            <i class="fa-solid fa-arrow-trend-up" :class="`is-${card.tone}`"></i>
                        </div>
                        <span>{{ card.label }}</span>
                        <strong>{{ card.value }}</strong>
                        <small :class="`is-${card.tone}`">{{ card.delta }}</small>
                    </article>
                </section>

                <section class="admin-analytics-grid is-top">
                    <article class="admin-analytics-panel">
                        <div class="admin-analytics-panel-title">
                            <i class="fa-solid fa-chart-pie is-blue"></i>
                            <h2>Top Issue Categories</h2>
                        </div>

                        <div v-if="issueRows.length === 0" class="admin-analytics-empty">
                            No issue data available yet.
                        </div>

                        <div v-else class="admin-analytics-list">
                            <div v-for="item in issueRows" :key="item.label" class="admin-analytics-row">
                                <div class="admin-analytics-row-meta">
                                    <span>{{ item.label }}</span>
                                    <small>{{ formatNumber(item.count) }} ({{ item.percent }}%)</small>
                                </div>
                                <div class="admin-analytics-track">
                                    <div :style="{ width: item.width, background: item.color }"></div>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article class="admin-analytics-panel">
                        <div class="admin-analytics-panel-title">
                            <i class="fa-solid fa-chart-column is-green"></i>
                            <h2>AI Resolution Trend</h2>
                        </div>

                        <div class="admin-analytics-resolution-chart">
                            <div v-for="item in resolutionTrend" :key="item.label" class="admin-analytics-resolution-month">
                                <div class="admin-analytics-stacked-bars">
                                    <div class="admin-analytics-bar is-resolved" :style="{ height: item.resolvedHeight }"></div>
                                    <div class="admin-analytics-bar is-escalated" :style="{ height: item.escalatedHeight }"></div>
                                </div>
                                <span>{{ item.label }}</span>
                            </div>
                        </div>

                        <div class="admin-analytics-legend">
                            <span><i class="is-resolved"></i>Resolved</span>
                            <span><i class="is-escalated"></i>Escalated</span>
                        </div>
                    </article>
                </section>

                <section class="admin-analytics-grid is-middle">
                    <article class="admin-analytics-panel">
                        <div class="admin-analytics-panel-title">
                            <i class="fa-solid fa-chart-simple is-purple"></i>
                            <h2>Knowledge Coverage Frequency</h2>
                        </div>

                        <div v-if="knowledgeRows.length === 0" class="admin-analytics-empty">
                            No knowledge documents available yet.
                        </div>

                        <div v-else class="admin-analytics-list is-knowledge">
                            <div v-for="item in knowledgeRows" :key="item.id" class="admin-analytics-row">
                                <div class="admin-analytics-row-meta">
                                    <span>{{ item.title }}</span>
                                    <small>{{ formatNumber(item.count) }} chunks</small>
                                </div>
                                <div class="admin-analytics-track">
                                    <div :style="{ width: item.width, background: '#9b59b6' }"></div>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article class="admin-analytics-panel">
                        <div class="admin-analytics-panel-title">
                            <i class="fa-solid fa-arrow-trend-down is-orange"></i>
                            <h2>Escalation Rate Trend</h2>
                        </div>

                        <div class="admin-analytics-rate-chart">
                            <div v-for="item in escalationRateTrend" :key="item.label" class="admin-analytics-rate-week">
                                <strong>{{ item.percent }}</strong>
                                <div class="admin-analytics-rate-shell">
                                    <div class="admin-analytics-rate-bar" :class="`is-${item.tone}`" :style="{ height: item.height }"></div>
                                </div>
                                <span>{{ item.label }}</span>
                            </div>
                        </div>

                        <p class="admin-analytics-insight">
                            <strong>Insight:</strong> {{ escalationInsight }}
                        </p>
                    </article>
                </section>

                <section class="admin-analytics-grid is-bottom">
                    <article class="admin-analytics-panel">
                        <div class="admin-analytics-panel-title">
                            <i class="fa-solid fa-arrow-trend-up is-blue"></i>
                            <h2>Confidence Distribution</h2>
                        </div>

                        <div class="admin-analytics-list">
                            <div v-for="item in confidenceDistribution" :key="item.key" class="admin-analytics-row">
                                <div class="admin-analytics-row-meta">
                                    <span>{{ item.label }}</span>
                                    <small>{{ item.percent }}%</small>
                                </div>
                                <div class="admin-analytics-track">
                                    <div :style="{ width: item.width, background: item.color }"></div>
                                </div>
                            </div>
                        </div>

                        <p class="admin-analytics-insight">
                            <strong>Insight:</strong> {{ confidenceInsight }}
                        </p>
                    </article>
                </section>
            </template>
        </template>
    </section>
</template>

<style scoped>
.admin-analytics-page {
    color: #f4f7fb;
}

.admin-analytics-loading {
    min-height: 420px;
    color: #c7d0ea;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
}

.admin-analytics-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 24px;
}

.admin-analytics-header h1 {
    margin: 0 0 7px;
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
}

.admin-analytics-header p {
    margin: 0;
    color: #b7c3ce;
    font-size: 12px;
    font-weight: 500;
}

.admin-analytics-date-range {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #aebbc5;
    font-size: 11px;
}

.admin-analytics-date-range input {
    height: 32px;
    min-width: 136px;
    border: 1px solid rgba(137, 167, 194, 0.18);
    border-radius: 7px;
    background: #2d4256;
    color: #ffffff;
    padding: 0 9px;
    font-size: 11px;
    font-weight: 700;
}

.admin-analytics-error,
.admin-analytics-empty {
    color: #d9e7f3;
    background: #1e2d40;
    border: 1px dashed rgba(174, 187, 197, 0.22);
    border-radius: 8px;
    padding: 20px;
    font-size: 12px;
    font-weight: 700;
}

.admin-analytics-cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 20px;
}

.admin-analytics-card,
.admin-analytics-panel {
    background: #2d4256;
    border: 1px solid rgba(150, 174, 194, 0.08);
    border-radius: 8px;
    box-shadow: 0 18px 36px rgba(9, 18, 30, 0.14);
}

.admin-analytics-card {
    min-height: 126px;
    padding: 18px;
}

.admin-analytics-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
}

.admin-analytics-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 1;
}

.admin-analytics-icon i {
    display: block;
    width: 1em;
    height: 1em;
    line-height: 1;
    text-align: center;
}

.admin-analytics-card > span:not(.admin-analytics-icon) {
    display: block;
    color: #c9d4dc;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 6px;
}

.admin-analytics-card .admin-analytics-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
}

.admin-analytics-card strong {
    display: block;
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 9px;
}

.admin-analytics-card small {
    font-size: 10px;
    font-weight: 800;
}

.is-blue {
    color: #3da2e8;
}

.is-green {
    color: #24d07f;
}

.is-orange {
    color: #f5a31a;
}

.is-purple {
    color: #9b59b6;
}

.admin-analytics-icon.is-blue {
    background: rgba(61, 162, 232, 0.18);
}

.admin-analytics-icon.is-green {
    background: rgba(24, 180, 107, 0.18);
}

.admin-analytics-icon.is-orange {
    background: rgba(245, 163, 26, 0.18);
}

.admin-analytics-icon.is-purple {
    background: rgba(155, 89, 182, 0.2);
}

.admin-analytics-grid {
    display: grid;
    gap: 18px;
    margin-bottom: 20px;
}

.admin-analytics-grid.is-top,
.admin-analytics-grid.is-middle {
    grid-template-columns: minmax(360px, 1fr) minmax(420px, 1fr);
}

.admin-analytics-grid.is-bottom {
    grid-template-columns: minmax(360px, 1fr) minmax(420px, 1fr);
}

.admin-analytics-panel {
    min-width: 0;
    padding: 20px;
}

.admin-analytics-panel-title {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 20px;
}

.admin-analytics-panel-title h2 {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
}

.admin-analytics-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.admin-analytics-list.is-knowledge {
    gap: 14px;
}

.admin-analytics-row {
    display: grid;
    gap: 7px;
}

.admin-analytics-row-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
}

.admin-analytics-row-meta span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
}

.admin-analytics-row-meta small {
    color: #cbd7e2;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
}

.admin-analytics-track {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #1f3144;
}

.admin-analytics-track div {
    height: 100%;
    border-radius: inherit;
}

.admin-analytics-resolution-chart,
.admin-analytics-rate-chart {
    height: 206px;
    display: grid;
    align-items: end;
    gap: 12px;
    padding: 0 4px 10px;
    border-bottom: 1px solid rgba(11, 24, 38, 0.65);
}

.admin-analytics-resolution-chart {
    grid-template-columns: repeat(6, minmax(34px, 1fr));
}

.admin-analytics-rate-chart {
    grid-template-columns: repeat(5, minmax(42px, 1fr));
}

.admin-analytics-resolution-month,
.admin-analytics-rate-week {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 8px;
}

.admin-analytics-stacked-bars,
.admin-analytics-rate-shell {
    height: 166px;
    display: flex;
    align-items: end;
}

.admin-analytics-stacked-bars {
    flex-direction: column;
    justify-content: flex-end;
}

.admin-analytics-bar,
.admin-analytics-rate-bar {
    width: 100%;
    min-height: 0;
    border-radius: 7px 7px 0 0;
}

.admin-analytics-bar.is-resolved {
    background: #31d57b;
}

.admin-analytics-bar.is-escalated {
    background: #ef5148;
    border-radius: 0;
}

.admin-analytics-rate-bar.is-danger {
    background: #ef5148;
}

.admin-analytics-rate-bar.is-warning {
    background: #f5a31a;
}

.admin-analytics-rate-bar.is-success {
    background: #31d57b;
}

.admin-analytics-resolution-month span,
.admin-analytics-rate-week span {
    color: #aebbc5;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
}

.admin-analytics-rate-week strong {
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    text-align: center;
}

.admin-analytics-legend {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding-top: 14px;
}

.admin-analytics-legend span {
    color: #b8c5cf;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    font-weight: 700;
}

.admin-analytics-legend i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
}

.admin-analytics-legend i.is-resolved {
    background: #31d57b;
}

.admin-analytics-legend i.is-escalated {
    background: #ef5148;
}

.admin-analytics-insight {
    margin: 16px 0 0;
    border-radius: 7px;
    background: #1e2d40;
    color: #cbd7e2;
    padding: 12px 14px;
    font-size: 11px;
    line-height: 1.5;
    font-weight: 600;
}

.admin-analytics-insight strong {
    color: #ffffff;
}

@media (max-width: 1280px) {
    .admin-analytics-cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-analytics-grid.is-top,
    .admin-analytics-grid.is-middle,
    .admin-analytics-grid.is-bottom {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 720px) {
    .admin-analytics-header {
        flex-direction: column;
    }

    .admin-analytics-date-range {
        width: 100%;
        flex-wrap: wrap;
    }

    .admin-analytics-date-range input {
        flex: 1;
        min-width: 130px;
    }

    .admin-analytics-cards {
        grid-template-columns: 1fr;
    }
}
</style>
