<script setup>
import { computed, onMounted, ref } from 'vue'
import adminService from '../../../services/admin.service'

const dashboardSummary = ref(null)
const loading = ref(true)

const issueColors = ['#3da2e8', '#31d57b', '#f5a31a', '#9b59b6', '#ef5148', '#a9bcc1']
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const numberFmt = new Intl.NumberFormat('en-US')

const formatNumber = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return numberFmt.format(value)
}

const formatPct = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return `${(value * 100).toFixed(1)}%`
}

const relativeTime = (dateValue) => {
    if (!dateValue) return '-'

    const date = new Date(dateValue)
    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0)

    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
}

const pageStats = computed(() => {
    const stats = dashboardSummary.value?.stats ?? {}

    return [
        {
            label: 'Total Knowledge Articles',
            value: formatNumber(stats.knowledge?.total ?? 0),
            delta: `+${formatNumber(stats.knowledge?.thisMonth ?? 0)} this month`,
            tone: 'blue',
            icon: 'fa-book-open',
        },
        {
            label: 'Total Chat Sessions',
            value: formatNumber(stats.sessions?.total ?? 0),
            delta: `+${formatNumber(stats.sessions?.thisWeek ?? 0)} this week`,
            tone: 'purple',
            icon: 'fa-message',
        },
        {
            label: 'Total Escalated Tickets',
            value: formatNumber(stats.escalations?.total ?? 0),
            delta: `+${formatNumber(stats.escalations?.today ?? 0)} today`,
            tone: 'orange',
            icon: 'fa-arrow-trend-up',
        },
        {
            label: 'AI Resolution Rate',
            value: formatPct(stats.resolution?.rate),
            delta: `${(stats.resolution?.deltaVsLastMonth ?? 0) >= 0 ? '+' : ''}${(stats.resolution?.deltaVsLastMonth ?? 0).toFixed(1)}% vs last month`,
            tone: 'green',
            icon: 'fa-circle-check',
        },
    ]
})

const issueTotal = computed(() => {
    return (dashboardSummary.value?.commonIssues ?? []).reduce((total, issue) => total + (issue.count ?? 0), 0)
})

const commonIssues = computed(() => {
    const issues = dashboardSummary.value?.commonIssues ?? []

    const max = issues.reduce((highest, issue) => Math.max(highest, issue.count ?? 0), 1)
    const total = issues.reduce((sum, issue) => sum + (issue.count ?? 0), 0)

    return issues.map((issue, index) => ({
        name: issue.name,
        count: issue.count ?? 0,
        color: issueColors[index] ?? issueColors[issueColors.length - 1],
        width: `${Math.max(((issue.count ?? 0) / max) * 100, 8)}%`,
        percent: total ? Math.round(((issue.count ?? 0) / total) * 100) : 0,
    }))
})

const dailyVolume = computed(() => {
    const volume = dashboardSummary.value?.dailyChatVolume ?? []
    const source = dayLabels.map((label) => {
        return volume.find((item) => item.label === label) ?? { label, count: 0 }
    })
    const max = source.reduce((highest, item) => Math.max(highest, item.count), 1)

    return source.map((item, index) => ({
        ...item,
        height: item.count ? `${Math.max((item.count / max) * 100, 18)}%` : '0%',
        kind: item.count && item.count === max ? 'highest' : index > 4 ? 'weekend' : 'weekday',
    }))
})

const escalationTrend = computed(() => {
    const trend = dashboardSummary.value?.escalationTrend ?? {}

    return {
        thisWeek: trend.thisWeek ?? 0,
        lastWeek: trend.lastWeek ?? 0,
        delta: trend.changePercent ?? 0,
    }
})

const recentActivity = computed(() => {
    return (dashboardSummary.value?.recentActivity ?? []).map((activity) => ({
        ...activity,
        meta: `${activity.actor ?? 'System'} - ${relativeTime(activity.occurredAt)}`,
    }))
})

onMounted(async () => {
    try {
        const response = await adminService.getDashboardSummary()
        dashboardSummary.value = response.data?.data ?? null
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <section class="admin-dashboard-page">
        <div
            v-if="loading"
            class="admin-dashboard-loading"
        >
            <div class="loading-spinner"></div>
            Loading dashboard...
        </div>

        <template v-else>
            <header class="admin-dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back, Admin. Here's what's happening today.</p>
                </div>
            </header>

            <div class="admin-dashboard-stat-grid">
                <article
                    v-for="stat in pageStats"
                    :key="stat.label"
                    class="admin-dashboard-stat-card"
                >
                    <div
                        class="admin-dashboard-stat-icon"
                        :class="`is-${stat.tone}`"
                    >
                        <i
                            class="fa-solid"
                            :class="stat.icon"
                        ></i>
                    </div>

                    <div class="admin-dashboard-stat-label">
                        {{ stat.label }}
                    </div>

                    <div class="admin-dashboard-stat-value">
                        {{ stat.value }}
                    </div>

                    <div
                        class="admin-dashboard-stat-delta"
                        :class="`is-${stat.tone}`"
                    >
                        {{ stat.delta }}
                    </div>
                </article>
            </div>

            <div class="admin-dashboard-grid is-main">
                <article class="admin-dashboard-panel">
                    <div class="admin-dashboard-panel-header">
                        <h2>Most Common Issues</h2>
                        <span>Total: {{ formatNumber(issueTotal || commonIssues.reduce((sum, issue) => sum + issue.count, 0)) }}</span>
                    </div>

                    <div
                        v-if="commonIssues.length === 0"
                        class="admin-dashboard-empty"
                    >
                        No issue categories recorded yet.
                    </div>

                    <div
                        v-else
                        class="admin-dashboard-issue-list"
                    >
                        <div
                            v-for="issue in commonIssues"
                            :key="issue.name"
                            class="admin-dashboard-issue-row"
                        >
                            <div class="admin-dashboard-issue-meta">
                                <span
                                    class="admin-dashboard-dot"
                                    :style="{ background: issue.color }"
                                ></span>
                                <span>{{ issue.name }}</span>
                                <strong>{{ formatNumber(issue.count) }}</strong>
                                <small>({{ issue.percent }}%)</small>
                            </div>

                            <div class="admin-dashboard-bar-track">
                                <div
                                    class="admin-dashboard-bar-fill"
                                    :style="{ width: issue.width, background: issue.color }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </article>

                <article class="admin-dashboard-panel">
                    <div class="admin-dashboard-panel-header">
                        <h2>Daily Chat Volume</h2>
                        <span>This Week</span>
                    </div>

                    <div class="admin-dashboard-chart">
                        <div class="admin-dashboard-bars">
                            <div
                                v-for="day in dailyVolume"
                                :key="day.label"
                                class="admin-dashboard-day"
                            >
                                <div class="admin-dashboard-bar-shell">
                                    <div
                                        class="admin-dashboard-volume-bar"
                                        :class="`is-${day.kind}`"
                                        :style="{ height: day.height }"
                                        :title="`${day.label}: ${formatNumber(day.count)} chats`"
                                    ></div>
                                </div>
                                <span>{{ day.label }}</span>
                            </div>
                        </div>

                        <div class="admin-dashboard-chart-legend">
                            <span><i class="is-highest"></i>Highest</span>
                            <span><i class="is-weekday"></i>Weekday</span>
                            <span><i class="is-weekend"></i>Weekend</span>
                        </div>
                    </div>
                </article>
            </div>

            <div class="admin-dashboard-grid is-bottom">
                <article class="admin-dashboard-panel">
                    <div class="admin-dashboard-panel-header">
                        <h2>Ticket Escalation Trend</h2>
                    </div>

                    <div class="admin-dashboard-trend-stack">
                        <div class="admin-dashboard-trend-card is-current">
                            <div>
                                <span>This Week</span>
                                <strong>{{ formatNumber(escalationTrend.thisWeek) }}</strong>
                            </div>
                            <i class="fa-solid fa-arrow-trend-up"></i>
                        </div>

                        <div class="admin-dashboard-trend-card is-previous">
                            <div>
                                <span>Last Week</span>
                                <strong>{{ formatNumber(escalationTrend.lastWeek) }}</strong>
                            </div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>

                        <div class="admin-dashboard-trend-analysis">
                            <div>
                                <i class="fa-solid fa-chart-line"></i>
                                <span>Trend Analysis</span>
                            </div>
                            <p>
                                Escalation rate {{ escalationTrend.delta >= 0 ? 'increased' : 'decreased' }} by
                                <strong>{{ escalationTrend.delta.toFixed(1) }}%</strong>
                                compared to last week.
                            </p>
                        </div>
                    </div>
                </article>

                <article class="admin-dashboard-panel">
                    <div class="admin-dashboard-panel-header">
                        <h2>Recent Activity</h2>
                        <span>Last 24 hours</span>
                    </div>

                    <div
                        v-if="recentActivity.length === 0"
                        class="admin-dashboard-empty"
                    >
                        No activity in the last 24 hours.
                    </div>

                    <div
                        v-else
                        class="admin-dashboard-activity-list"
                    >
                        <div
                            v-for="activity in recentActivity"
                            :key="`${activity.title}-${activity.meta}`"
                            class="admin-dashboard-activity"
                        >
                            <div
                                class="admin-dashboard-activity-icon"
                                :class="`is-${activity.tone}`"
                            >
                                <i
                                    class="fa-solid"
                                    :class="activity.icon"
                                ></i>
                            </div>

                            <div>
                                <strong>{{ activity.title }}</strong>
                                <span>{{ activity.meta }}</span>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </template>
    </section>
</template>

<style scoped>
.admin-dashboard-page {
    color: #f4f7fb;
}

.admin-dashboard-loading {
    min-height: 420px;
    color: #c7d0ea;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
}

.admin-dashboard-header {
    margin-bottom: 26px;
}

.admin-dashboard-header h1 {
    margin: 0 0 6px;
    color: #ffffff;
    font-size: 25px;
    font-weight: 800;
    line-height: 1.1;
}

.admin-dashboard-header p {
    margin: 0;
    color: #b7c3ce;
    font-size: 12px;
    font-weight: 500;
}

.admin-dashboard-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 24px;
}

.admin-dashboard-stat-card,
.admin-dashboard-panel {
    background: #2d4256;
    border: 1px solid rgba(150, 174, 194, 0.08);
    border-radius: 8px;
    box-shadow: 0 18px 36px rgba(9, 18, 30, 0.14);
}

.admin-dashboard-stat-card {
    min-height: 172px;
    padding: 20px;
}

.admin-dashboard-stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    font-size: 18px;
    line-height: 1;
}

.admin-dashboard-stat-icon i {
    display: block;
    width: 1em;
    height: 1em;
    line-height: 1;
    text-align: center;
}

.admin-dashboard-stat-icon.is-blue,
.admin-dashboard-activity-icon.is-blue {
    background: rgba(61, 162, 232, 0.18);
    color: #3da2e8;
}

.admin-dashboard-stat-icon.is-purple {
    background: rgba(155, 89, 182, 0.2);
    color: #9b59b6;
}

.admin-dashboard-stat-icon.is-orange,
.admin-dashboard-activity-icon.is-orange {
    background: rgba(245, 163, 26, 0.18);
    color: #f5a31a;
}

.admin-dashboard-stat-icon.is-green,
.admin-dashboard-activity-icon.is-green {
    background: rgba(24, 180, 107, 0.18);
    color: #18b46b;
}

.admin-dashboard-stat-label {
    color: #c9d4dc;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
}

.admin-dashboard-stat-value {
    color: #ffffff;
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 9px;
}

.admin-dashboard-stat-delta {
    font-size: 11px;
    font-weight: 800;
}

.admin-dashboard-stat-delta.is-blue {
    color: #3da2e8;
}

.admin-dashboard-stat-delta.is-purple {
    color: #9b59b6;
}

.admin-dashboard-stat-delta.is-orange {
    color: #f5a31a;
}

.admin-dashboard-stat-delta.is-green {
    color: #24d07f;
}

.admin-dashboard-grid {
    display: grid;
    gap: 18px;
}

.admin-dashboard-grid.is-main {
    grid-template-columns: minmax(360px, 1fr) minmax(420px, 1fr);
    margin-bottom: 24px;
}

.admin-dashboard-grid.is-bottom {
    grid-template-columns: minmax(320px, 0.48fr) minmax(520px, 1fr);
}

.admin-dashboard-panel {
    padding: 20px;
    min-width: 0;
}

.admin-dashboard-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
}

.admin-dashboard-panel-header h2 {
    margin: 0;
    color: #ffffff;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.2;
}

.admin-dashboard-panel-header span {
    color: #a9b6c2;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
}

.admin-dashboard-issue-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.admin-dashboard-issue-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.admin-dashboard-issue-meta {
    display: grid;
    grid-template-columns: auto minmax(120px, 1fr) auto auto;
    align-items: center;
    gap: 7px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
}

.admin-dashboard-issue-meta strong {
    color: #ffffff;
    font-size: 11px;
    text-align: right;
}

.admin-dashboard-issue-meta small {
    color: #9dabb7;
    font-size: 10px;
    font-weight: 700;
}

.admin-dashboard-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
}

.admin-dashboard-bar-track {
    height: 8px;
    background: #1f3144;
    border-radius: 999px;
    overflow: hidden;
}

.admin-dashboard-bar-fill {
    height: 100%;
    border-radius: inherit;
}

.admin-dashboard-chart {
    min-height: 240px;
    display: flex;
    flex-direction: column;
}

.admin-dashboard-bars {
    height: 185px;
    display: grid;
    grid-template-columns: repeat(7, minmax(34px, 1fr));
    align-items: end;
    gap: 14px;
    padding: 0 6px 14px;
    border-bottom: 1px solid rgba(11, 24, 38, 0.65);
}

.admin-dashboard-day {
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 11px;
}

.admin-dashboard-day span {
    color: #aebbc5;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
}

.admin-dashboard-bar-shell {
    height: 155px;
    display: flex;
    align-items: end;
}

.admin-dashboard-volume-bar {
    width: 100%;
    min-height: 28px;
    border-radius: 8px 8px 0 0;
    background: #63b4e4;
}

.admin-dashboard-volume-bar.is-highest {
    background: #3b9fdb;
}

.admin-dashboard-volume-bar.is-weekend {
    background: #8f9d9d;
}

.admin-dashboard-chart-legend {
    display: flex;
    justify-content: center;
    gap: 22px;
    padding-top: 15px;
}

.admin-dashboard-chart-legend span {
    color: #b8c5cf;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    font-weight: 700;
}

.admin-dashboard-chart-legend i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
}

.admin-dashboard-chart-legend i.is-highest {
    background: #3b9fdb;
}

.admin-dashboard-chart-legend i.is-weekday {
    background: #63b4e4;
}

.admin-dashboard-chart-legend i.is-weekend {
    background: #8f9d9d;
}

.admin-dashboard-trend-stack {
    display: flex;
    flex-direction: column;
    gap: 13px;
}

.admin-dashboard-trend-card {
    min-height: 78px;
    background: #1e2d40;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
}

.admin-dashboard-trend-card.is-current {
    border-left: 3px solid #22c66e;
}

.admin-dashboard-trend-card.is-previous {
    border-left: 3px solid #f5a31a;
}

.admin-dashboard-trend-card span {
    display: block;
    color: #aebbc5;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 6px;
}

.admin-dashboard-trend-card strong {
    color: #ffffff;
    font-size: 25px;
    font-weight: 800;
    line-height: 1;
}

.admin-dashboard-trend-card i {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.admin-dashboard-trend-card.is-current i {
    background: rgba(34, 198, 110, 0.14);
    color: #22c66e;
}

.admin-dashboard-trend-card.is-previous i {
    background: rgba(245, 163, 26, 0.16);
    color: #f5a31a;
}

.admin-dashboard-trend-analysis {
    border: 1px solid #3da2e8;
    border-radius: 8px;
    padding: 14px 16px;
    background: rgba(61, 162, 232, 0.04);
}

.admin-dashboard-trend-analysis div {
    color: #3da2e8;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 11px;
}

.admin-dashboard-trend-analysis p {
    margin: 0;
    color: #b7c3ce;
    font-size: 11px;
    line-height: 1.6;
    font-weight: 600;
}

.admin-dashboard-trend-analysis strong {
    color: #f5a31a;
}

.admin-dashboard-activity-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.admin-dashboard-empty {
    min-height: 96px;
    color: #aebbc5;
    background: #1e2d40;
    border: 1px dashed rgba(174, 187, 197, 0.22);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
}

.admin-dashboard-activity {
    min-height: 58px;
    background: #1e2d40;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 0 14px;
}

.admin-dashboard-activity-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
}

.admin-dashboard-activity strong {
    display: block;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.35;
}

.admin-dashboard-activity span {
    display: block;
    margin-top: 3px;
    color: #aebbc5;
    font-size: 10px;
    font-weight: 600;
}

@media (max-width: 1280px) {
    .admin-dashboard-stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-dashboard-grid.is-main,
    .admin-dashboard-grid.is-bottom {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 720px) {
    .admin-dashboard-stat-grid {
        grid-template-columns: 1fr;
    }

    .admin-dashboard-bars {
        gap: 8px;
    }

    .admin-dashboard-panel {
        padding: 16px;
    }

    .admin-dashboard-issue-meta {
        grid-template-columns: auto minmax(0, 1fr) auto;
    }

    .admin-dashboard-issue-meta small {
        display: none;
    }
}
</style>
