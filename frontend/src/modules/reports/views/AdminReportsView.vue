<script setup>
import { computed, onMounted, ref } from 'vue'
import adminService from '../../../services/admin.service'

const analytics = ref(null)
const dashboard = ref(null)
const emailLogs = ref([])
const loading = ref(true)
const error = ref('')
const reportType = ref('')
const exportFormat = ref('PDF')
const reportTypeOpen = ref(false)
const exportOpen = ref(false)
const showGenerateModal = ref(false)
const newReportType = ref('chat')
const newReportStartDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const newReportEndDate = ref(new Date().toISOString().slice(0, 10))
const newReportFormat = ref('PDF')

const reportOptions = [
    { value: '', label: 'All Report Types' },
    { value: 'chat', label: 'Weekly Chat Summary Report' },
    { value: 'escalation', label: 'Monthly Escalation Analysis' },
    { value: 'knowledge', label: 'Knowledge Base Usage Report' },
]

const modalReportOptions = [
    { value: 'chat', label: 'Chat Summary Report', hint: 'Overview of all chat conversations', icon: 'fa-message' },
    { value: 'escalation', label: 'Escalation Analysis', hint: 'Detailed escalation patterns and reasons', icon: 'fa-circle-exclamation' },
    { value: 'knowledge', label: 'Knowledge Usage Report', hint: 'Most accessed knowledge articles', icon: 'fa-file-lines' },
    { value: 'performance', label: 'AI Performance Report', hint: 'AI confidence scores and accuracy', icon: 'fa-arrow-trend-up' },
    { value: 'tickets', label: 'Ticket Status Report', hint: 'Current status of all tickets', icon: 'fa-circle-check' },
]

const exportOptions = ['PDF', 'EXCEL', 'CSV']

const numberFmt = new Intl.NumberFormat('en-US')

const formatNumber = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return numberFmt.format(value)
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace(',', '')
}

const shortDate = (date) => new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
})

const dateOnly = (date) => shortDate(date)

const dateRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    return `${dateOnly(start)} - ${dateOnly(end)}`
}

const selectedReportType = computed(() => {
    return reportOptions.find((option) => option.value === reportType.value) ?? reportOptions[0]
})

const baseReports = computed(() => {
    const data = analytics.value ?? {}
    const stats = dashboard.value?.stats ?? {}
    const knowledgeUsage = data.knowledgeUsage ?? []
    const knowledgeRecords = knowledgeUsage.reduce((sum, item) => sum + (item.count ?? 0), 0) || (data.totalKnowledge ?? 0)

    return [
        {
            id: 'RPT-001',
            key: 'chat',
            type: 'Weekly Chat Summary Report',
            icon: 'fa-message',
            dateRange: dateRange(7),
            records: data.totalQueries ?? data.totalSessions ?? 0,
            generatedAt: new Date(),
            generatedBy: 'Admin User',
            status: 'COMPLETED',
        },
        {
            id: 'RPT-002',
            key: 'escalation',
            type: 'Monthly Escalation Analysis',
            icon: 'fa-circle-exclamation',
            dateRange: dateRange(30),
            records: data.totalEscalations ?? stats.escalations?.total ?? 0,
            generatedAt: new Date(),
            generatedBy: 'Admin User',
            status: 'COMPLETED',
        },
        {
            id: 'RPT-003',
            key: 'knowledge',
            type: 'Knowledge Base Usage Report',
            icon: 'fa-file-lines',
            dateRange: dateRange(30),
            records: knowledgeRecords,
            generatedAt: new Date(),
            generatedBy: 'Admin User',
            status: 'COMPLETED',
        },
    ]
})

const filteredReports = computed(() => {
    if (!reportType.value) return baseReports.value
    return baseReports.value.filter((report) => report.key === reportType.value)
})

const statsCards = computed(() => [
    {
        label: 'Total Reports',
        value: baseReports.value.length,
        icon: 'fa-file-lines',
        tone: 'blue',
    },
    {
        label: 'Completed',
        value: baseReports.value.filter((report) => report.status === 'COMPLETED').length,
        icon: 'fa-circle-check',
        tone: 'green',
    },
    {
        label: 'Generating',
        value: 0,
        icon: 'fa-clock',
        tone: 'yellow',
    },
    {
        label: 'This Month',
        value: emailLogs.value.length || baseReports.value.length,
        icon: 'fa-download',
        tone: 'purple',
    },
])

const chooseReportType = (value) => {
    reportType.value = value
    reportTypeOpen.value = false
}

const chooseExport = (value) => {
    exportFormat.value = value
    exportOpen.value = false
}

const chooseNewReportFormat = (value) => {
    newReportFormat.value = value
}

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

const reportPayload = (report) => ({
    id: report.id,
    type: report.type,
    dateRange: report.dateRange,
    records: report.records,
    generatedAt: formatDate(report.generatedAt),
    generatedBy: report.generatedBy,
    status: report.status,
})

const filenameFor = (id, format) => {
    const extension = format === 'EXCEL' ? 'xls' : format.toLowerCase()
    return `${id}.${extension}`
}

const exportPayload = async (payload, id, format) => {
    const response = await adminService.exportReport({
        format,
        report: payload,
    })
    downloadBlob(response.data, filenameFor(id, format))
}

const exportReport = async (report) => {
    await exportPayload(reportPayload(report), report.id, exportFormat.value)
}

const generateNewReport = async () => {
    const option = modalReportOptions.find((item) => item.value === newReportType.value) ?? modalReportOptions[0]
    const payload = {
        id: `RPT-${String(baseReports.value.length + 1).padStart(3, '0')}`,
        type: option.label,
        dateRange: `${newReportStartDate.value} - ${newReportEndDate.value}`,
        records: option.value === 'chat'
            ? analytics.value?.totalQueries ?? 0
            : option.value === 'escalation'
                ? analytics.value?.totalEscalations ?? 0
                : option.value === 'knowledge'
                    ? analytics.value?.totalKnowledge ?? 0
                    : option.value === 'tickets'
                        ? dashboard.value?.stats?.escalations?.total ?? 0
                        : analytics.value?.totalSessions ?? 0,
        generatedAt: formatDate(new Date()),
        generatedBy: 'Admin User',
        status: 'COMPLETED',
    }

    await exportPayload(payload, payload.id, newReportFormat.value)
    showGenerateModal.value = false
}

const loadReports = async () => {
    try {
        loading.value = true
        error.value = ''
        const [analyticsResponse, dashboardResponse, emailsResponse] = await Promise.all([
            adminService.getAnalytics(),
            adminService.getDashboardSummary(),
            adminService.getEmailLogs({ page: 1, limit: 100 }),
        ])

        analytics.value = analyticsResponse.data?.data ?? null
        dashboard.value = dashboardResponse.data?.data ?? null
        emailLogs.value = emailsResponse.data?.data?.items ?? []
    } catch (err) {
        console.error(err)
        error.value = 'Failed to load reports.'
    } finally {
        loading.value = false
    }
}

onMounted(loadReports)
</script>

<template>
    <section class="admin-reports-page">
        <div
            v-if="loading"
            class="admin-reports-loading"
        >
            <div class="loading-spinner"></div>
            Loading reports...
        </div>

        <template v-else>
            <header class="admin-reports-header">
                <div>
                    <h1>Reports</h1>
                    <p>Generate and export detailed reports</p>
                </div>

                <button
                    type="button"
                    class="admin-reports-primary"
                    @click="showGenerateModal = true"
                >
                    <i class="fa-regular fa-file-lines"></i>
                    Generate New Report
                </button>
            </header>

            <div
                v-if="error"
                class="admin-reports-error"
            >
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>{{ error }}</span>
            </div>

            <template v-else>
                <section class="admin-reports-stats">
                    <article
                        v-for="card in statsCards"
                        :key="card.label"
                        class="admin-reports-stat"
                    >
                        <span
                            class="admin-reports-stat-icon"
                            :class="`is-${card.tone}`"
                        >
                            <i
                                class="fa-solid"
                                :class="card.icon"
                            ></i>
                        </span>
                        <div>
                            <small>{{ card.label }}</small>
                            <strong>{{ formatNumber(card.value) }}</strong>
                        </div>
                    </article>
                </section>

                <section class="admin-reports-toolbar">
                    <div
                        class="admin-reports-select"
                        :class="{ open: reportTypeOpen }"
                    >
                        <i class="fa-solid fa-filter"></i>
                        <button
                            type="button"
                            @click="reportTypeOpen = !reportTypeOpen; exportOpen = false"
                        >
                            <span>{{ selectedReportType.label }}</span>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>

                        <div
                            v-if="reportTypeOpen"
                            class="admin-reports-menu"
                        >
                            <button
                                v-for="option in reportOptions"
                                :key="option.value || 'all'"
                                type="button"
                                :class="{ active: reportType === option.value }"
                                @click="chooseReportType(option.value)"
                            >
                                {{ option.label }}
                            </button>
                        </div>
                    </div>

                    <div class="admin-reports-export-control">
                        <span>Export as:</span>
                        <div
                            class="admin-reports-format"
                            :class="{ open: exportOpen }"
                        >
                            <button
                                type="button"
                                @click="exportOpen = !exportOpen; reportTypeOpen = false"
                            >
                                <span>{{ exportFormat }}</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>

                            <div
                                v-if="exportOpen"
                                class="admin-reports-menu"
                            >
                                <button
                                    v-for="option in exportOptions"
                                    :key="option"
                                    type="button"
                                    :class="{ active: exportFormat === option }"
                                    @click="chooseExport(option)"
                                >
                                    {{ option === 'EXCEL' ? 'Excel' : option }}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="admin-reports-table-card">
                    <table class="admin-reports-table">
                        <thead>
                            <tr>
                                <th>Report ID</th>
                                <th>Report Type</th>
                                <th>Date Range</th>
                                <th>Records</th>
                                <th>Generated At</th>
                                <th>Generated By</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr
                                v-for="report in filteredReports"
                                :key="report.id"
                            >
                                <td>
                                    <strong>{{ report.id }}</strong>
                                </td>
                                <td>
                                    <span class="admin-reports-type">
                                        <i
                                            class="fa-regular"
                                            :class="report.icon"
                                        ></i>
                                        {{ report.type }}
                                    </span>
                                </td>
                                <td>
                                    <span class="admin-reports-date">
                                        {{ report.dateRange }}
                                    </span>
                                </td>
                                <td>{{ formatNumber(report.records) }}</td>
                                <td>{{ formatDate(report.generatedAt) }}</td>
                                <td>{{ report.generatedBy }}</td>
                                <td>
                                    <span class="admin-reports-status">
                                        {{ report.status }}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        class="admin-reports-export"
                                        @click="exportReport(report)"
                                    >
                                        <i class="fa-solid fa-download"></i>
                                        Export
                                    </button>
                                </td>
                            </tr>

                            <tr v-if="filteredReports.length === 0">
                                <td
                                    colspan="8"
                                    class="admin-reports-empty"
                                >
                                    No reports found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </template>
        </template>

        <div
            v-if="showGenerateModal"
            class="admin-reports-modal-overlay"
            @click.self="showGenerateModal = false"
        >
            <section class="admin-reports-modal">
                <header class="admin-reports-modal-header">
                    <h2>Generate New Report</h2>
                    <button
                        type="button"
                        @click="showGenerateModal = false"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <div class="admin-reports-modal-body">
                    <section>
                        <h3>Report Type</h3>
                        <div class="admin-reports-type-options">
                            <button
                                v-for="option in modalReportOptions"
                                :key="option.value"
                                type="button"
                                :class="{ active: newReportType === option.value }"
                                @click="newReportType = option.value"
                            >
                                <i
                                    class="fa-regular"
                                    :class="option.icon"
                                ></i>
                                <span>
                                    <strong>{{ option.label }}</strong>
                                    <small>{{ option.hint }}</small>
                                </span>
                            </button>
                        </div>
                    </section>

                    <section>
                        <h3>Date Range</h3>
                        <div class="admin-reports-modal-dates">
                            <label>
                                <span>Start Date</span>
                                <input
                                    v-model="newReportStartDate"
                                    type="date"
                                />
                            </label>
                            <label>
                                <span>End Date</span>
                                <input
                                    v-model="newReportEndDate"
                                    type="date"
                                />
                            </label>
                        </div>
                    </section>

                    <section>
                        <h3>Export Format</h3>
                        <div class="admin-reports-format-segment">
                            <button
                                v-for="option in exportOptions"
                                :key="option"
                                type="button"
                                :class="{ active: newReportFormat === option }"
                                @click="chooseNewReportFormat(option)"
                            >
                                {{ option === 'EXCEL' ? 'Excel' : option }}
                            </button>
                        </div>
                    </section>
                </div>

                <footer class="admin-reports-modal-footer">
                    <button
                        type="button"
                        class="is-cancel"
                        @click="showGenerateModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="is-primary"
                        @click="generateNewReport"
                    >
                        <i class="fa-regular fa-file-lines"></i>
                        Generate Report
                    </button>
                </footer>
            </section>
        </div>
    </section>
</template>

<style>
.admin-reports-page {
    color: #f4f7fb;
    font-size: 14px;
}

.admin-reports-loading {
    min-height: 420px;
    color: #c7d0ea;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    font-weight: 700;
}

.admin-reports-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 24px;
}

.admin-reports-header h1 {
    margin: 0 0 7px;
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
}

.admin-reports-header p {
    margin: 0;
    color: #b7c3ce;
    font-size: 12px;
    font-weight: 500;
}

.admin-reports-primary,
.admin-reports-export {
    border: 0;
    border-radius: 7px;
    background: #3da2e8;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
}

.admin-reports-primary {
    min-height: 38px;
    padding: 0 16px;
}

.admin-reports-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 22px;
}

.admin-reports-stat,
.admin-reports-toolbar,
.admin-reports-table-card {
    background: #2d4256;
    border: 1px solid rgba(150, 174, 194, 0.08);
    border-radius: 8px;
    box-shadow: 0 18px 36px rgba(9, 18, 30, 0.14);
}

.admin-reports-stat {
    min-height: 96px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 14px;
}

.admin-reports-stat-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
    flex-shrink: 0;
    line-height: 1;
}

.admin-reports-stat-icon i {
    display: block;
    width: 1em;
    height: 1em;
    line-height: 1;
    text-align: center;
}

.admin-reports-stat-icon.is-blue {
    background: rgba(61, 162, 232, 0.18);
    color: #3da2e8;
}

.admin-reports-stat-icon.is-green {
    background: rgba(24, 180, 107, 0.18);
    color: #24d07f;
}

.admin-reports-stat-icon.is-yellow {
    background: rgba(245, 196, 49, 0.18);
    color: #f5c431;
}

.admin-reports-stat-icon.is-purple {
    background: rgba(155, 89, 182, 0.2);
    color: #9b59b6;
}

.admin-reports-stat small {
    display: block;
    color: #c9d4dc;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 7px;
}

.admin-reports-stat strong {
    color: #ffffff;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
}

.admin-reports-toolbar {
    min-height: 68px;
    padding: 14px 18px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.admin-reports-select,
.admin-reports-format {
    position: relative;
    height: 38px;
    border-radius: 8px;
    background: #1e2d40;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
}

.admin-reports-select {
    min-width: 260px;
    padding: 0 12px;
    gap: 10px;
}

.admin-reports-select > i {
    color: #9fb1c2;
}

.admin-reports-select button,
.admin-reports-format button {
    height: 100%;
    border: 0;
    background: transparent;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
}

.admin-reports-select button {
    flex: 1;
}

.admin-reports-select.open button .fa-chevron-down,
.admin-reports-format.open button .fa-chevron-down {
    transform: rotate(180deg);
}

.admin-reports-menu {
    position: absolute;
    z-index: 30;
    top: calc(100% + 8px);
    left: 0;
    min-width: 100%;
    padding: 8px;
    border-radius: 9px;
    background: #1e2d40;
    border: 1px solid rgba(137, 167, 194, 0.18);
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.34);
}

.admin-reports-menu button {
    width: 100%;
    min-height: 34px;
    padding: 0 10px;
    border-radius: 7px;
    justify-content: flex-start;
}

.admin-reports-menu button:hover,
.admin-reports-menu button.active {
    background: #3da2e8;
}

.admin-reports-export-control {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #c9d4dc;
    font-size: 11px;
    font-weight: 700;
}

.admin-reports-format {
    min-width: 88px;
    padding: 0 10px;
}

.admin-reports-format .admin-reports-menu {
    right: 0;
    left: auto;
}

.admin-reports-table-card {
    overflow: hidden;
}

.admin-reports-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.admin-reports-table th,
.admin-reports-table td {
    height: 54px;
    padding: 0 10px;
    border-bottom: 1px solid #152638;
    color: #d9e7f3;
    font-size: 11px;
    text-align: left;
    vertical-align: middle;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.admin-reports-table th {
    height: 42px;
    color: #ffffff;
    font-weight: 800;
}

.admin-reports-table th:nth-child(1),
.admin-reports-table td:nth-child(1) {
    width: 8%;
}

.admin-reports-table th:nth-child(2),
.admin-reports-table td:nth-child(2) {
    width: 23%;
}

.admin-reports-table th:nth-child(3),
.admin-reports-table td:nth-child(3) {
    width: 16%;
}

.admin-reports-table th:nth-child(4),
.admin-reports-table td:nth-child(4) {
    width: 7%;
}

.admin-reports-table th:nth-child(5),
.admin-reports-table td:nth-child(5) {
    width: 14%;
}

.admin-reports-table th:nth-child(6),
.admin-reports-table td:nth-child(6) {
    width: 12%;
}

.admin-reports-table th:nth-child(7),
.admin-reports-table td:nth-child(7) {
    width: 10%;
}

.admin-reports-table th:nth-child(8),
.admin-reports-table td:nth-child(8) {
    width: 10%;
    overflow: visible;
    text-overflow: clip;
}

.admin-reports-type,
.admin-reports-date {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.admin-reports-type {
    color: #ffffff;
    font-weight: 700;
}

.admin-reports-type i,
.admin-reports-date i {
    color: #3da2e8;
}

.admin-reports-status {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    background: rgba(24, 180, 107, 0.22);
    color: #24d07f;
    font-size: 9px;
    font-weight: 800;
}

.admin-reports-export {
    min-height: 30px;
    padding: 0 11px;
}

.admin-reports-empty,
.admin-reports-error {
    padding: 22px;
    color: #d9e7f3;
    font-size: 12px;
    font-weight: 800;
}

.admin-reports-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(5, 12, 22, 0.78);
    backdrop-filter: blur(2px);
}

.admin-reports-modal {
    width: min(92vw, 520px);
    max-height: 88vh;
    overflow: hidden;
    border: 1px solid rgba(125, 160, 190, 0.22);
    border-radius: 10px;
    background: #2d4256;
    color: #ffffff;
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.48);
    display: flex;
    flex-direction: column;
}

.admin-reports-modal-header,
.admin-reports-modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(207, 217, 245, 0.14);
}

.admin-reports-modal-footer {
    justify-content: flex-end;
    border-top: 1px solid rgba(207, 217, 245, 0.14);
    border-bottom: 0;
}

.admin-reports-modal-header h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 800;
}

.admin-reports-modal-header button,
.admin-reports-modal-footer button {
    border: 0;
    cursor: pointer;
    color: #ffffff;
    font-weight: 800;
}

.admin-reports-modal-header button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
}

.admin-reports-modal-body {
    display: grid;
    gap: 18px;
    padding: 18px 20px;
    overflow-y: auto;
}

.admin-reports-modal-body h3 {
    margin: 0 0 10px;
    color: #d9e7f3;
    font-size: 11px;
    font-weight: 800;
}

.admin-reports-type-options {
    display: grid;
    gap: 10px;
}

.admin-reports-type-options button {
    min-height: 58px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: #1e2d40;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    cursor: pointer;
    text-align: left;
}

.admin-reports-type-options button.active {
    border-color: #3da2e8;
    background: rgba(61, 162, 232, 0.16);
}

.admin-reports-type-options button i {
    color: #3da2e8;
}

.admin-reports-type-options strong {
    display: block;
    font-size: 11px;
    font-weight: 800;
}

.admin-reports-type-options small {
    display: block;
    margin-top: 3px;
    color: #b7c3ce;
    font-size: 10px;
    font-weight: 600;
}

.admin-reports-modal-dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.admin-reports-modal-dates label {
    display: grid;
    gap: 6px;
}

.admin-reports-modal-dates span {
    color: #b7c3ce;
    font-size: 10px;
    font-weight: 700;
}

.admin-reports-modal-dates input {
    height: 36px;
    border: 0;
    border-radius: 7px;
    background: #1e2d40;
    color: #ffffff;
    padding: 0 10px;
    font-size: 11px;
    font-weight: 700;
}

.admin-reports-format-segment {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.admin-reports-format-segment button {
    height: 38px;
    border: 0;
    border-radius: 7px;
    background: #1e2d40;
    color: #d9e7f3;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
}

.admin-reports-format-segment button.active {
    background: #3da2e8;
    color: #ffffff;
}

.admin-reports-modal-footer .is-cancel {
    min-height: 34px;
    padding: 0 14px;
    border-radius: 7px;
    background: #3b4f64;
}

.admin-reports-modal-footer .is-primary {
    min-height: 34px;
    padding: 0 14px;
    border-radius: 7px;
    background: #3da2e8;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

@media (max-width: 1280px) {
    .admin-reports-stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 720px) {
    .admin-reports-header,
    .admin-reports-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .admin-reports-stats {
        grid-template-columns: 1fr;
    }

    .admin-reports-select,
    .admin-reports-export-control,
    .admin-reports-format {
        width: 100%;
    }
}
</style>
