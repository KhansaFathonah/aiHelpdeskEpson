<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import dashboardService from '../../../services/dashboard.service.js'

import '../../../assets/styles/dashboard.css'

import PopularIssueCard from '../components/PopularIssueCard.vue'
import QuickActionCard from '../components/QuickActionCard.vue'
import RecentActivityCard from '../components/RecentActivityCard.vue'

const router = useRouter()
const goToChat = () => {
    router.push('/chat')
}

const goToFaq = () => {
    router.push('/faq')
}

const goToTickets = () => {
    router.push('/tickets')
}

const user = ref({})
const popularIssues = ref([])
const recentActivity = ref([])
const dashboardSearch = ref('')
const activitySearch = ref('')
const activityStatus = ref('ALL')
const showStatusDropdown = ref(false)

const loading = ref(false)
const showLogoutModal = ref(false)
const statusOptions = [
    {
        label: 'All Status',
        value: 'ALL',
    },
    {
        label: 'Active',
        value: 'ACTIVE',
    },
    {
        label: 'Escalated',
        value: 'ESCALATED',
    },
    {
        label: 'Resolved',
        value: 'RESOLVED',
    },
]

const selectedStatusLabel = computed(() => {
    return statusOptions.find((option) => option.value === activityStatus.value)?.label
        || 'All Status'
})

const logout = () => {
    localStorage.removeItem('token')

    router.push('/')
}

const openChatWithQuestion = (question) => {
    const initialQuestion = question?.trim()

    if (!initialQuestion) return

    router.push({
        path: '/chat',
        query: {
            initialQuestion
        }
    })
}

const submitDashboardSearch = () => {
    openChatWithQuestion(dashboardSearch.value)
}

const openPopularIssue = (issue) => {
    openChatWithQuestion(issue.name)
}

const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
        'id-ID',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )
}

const formatActivityTime = (date) => {
    if (!date) return '-'

    const diffMs = Date.now() - new Date(date).getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return formatDate(date)
}

const filteredRecentActivity = computed(() => {
    const search = activitySearch.value.trim().toLowerCase()

    return recentActivity.value.filter((activity) => {
        const matchStatus =
            activityStatus.value === 'ALL'
            || activity.status === activityStatus.value

        const searchableText = [
            activity.title,
            activity.summary,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        const matchSearch =
            !search
            || searchableText.includes(search)

        return matchStatus && matchSearch
    })
})

const openActivity = (activity) => {
    if (activity.status !== 'ACTIVE') return

    router.push(`/chat/${activity.id}`)
}

const selectActivityStatus = (status) => {
    activityStatus.value = status
    showStatusDropdown.value = false
}

onMounted(async () => {
    try {

        loading.value = true

        const response =
            await dashboardService.getUserDashboard()

        const data = response.data.data

        user.value = data.user

        popularIssues.value =
            data.popularIssues || []

        recentActivity.value =
            data.recentActivity || []

    } catch (error) {
        console.log(error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="dashboard-page">

        <!-- HEADER -->
        <div class="dashboard-header">

            <div class="user-info">

                <div class="user-avatar">
                    <i class="fa-regular fa-user"></i>
                </div>

                <div>

                    <h2>
                        Welcome,
                        {{ user.name || 'Employee' }}
                    </h2>

                    <p>
                        ID:
                        {{ user.employeeId || '-' }}
                    </p>

                </div>

            </div>

            <button
                class="logout-button"
                @click="showLogoutModal = true"
            >
                <i class="fa-solid fa-right-from-bracket"></i>

                Logout
            </button>

        </div>

        <!-- SEARCH -->
        <div class="search-wrapper">

            <i class="fa-solid fa-magnifying-glass"></i>

            <input
                v-model="dashboardSearch"
                type="text"
                placeholder="Search your problem..."
                @keyup.enter="submitDashboardSearch"
            />

        </div>

        <!-- QUICK ACTION -->
        <section class="dashboard-section">

            <h3 class="section-title">
                Quick Actions
            </h3>

            <div class="quick-grid">

                <div @click="goToChat">
                    <QuickActionCard
                        title="Start Chat"
                        subtitle="Talk to AI Assistant"
                        icon="fa-regular fa-comment"
                    />
                </div>

                <div @click="goToFaq">
                    <QuickActionCard
                        title="View FAQ"
                        subtitle="Browse troubleshooting guides"
                        icon="fa-solid fa-book-open"
                    />
                </div>

                <div @click="goToTickets">
                    <QuickActionCard
                        title="My Tickets"
                        subtitle="Track escalated issues"
                        icon="fa-solid fa-ticket"
                    />
                </div>

            </div>

        </section>

        <!-- POPULAR ISSUES -->
        <section class="dashboard-section">

            <h3 class="section-title">
                Popular Issues
            </h3>

            <div class="issue-list">

                <PopularIssueCard
                    v-for="issue in popularIssues"
                    :key="issue.id"
                    :title="issue.name"
                    :subtitle="
                        issue.description ||
                        'No description'
                    "
                    :total="issue.count"
                    icon="fa-solid fa-print"
                    @select="openPopularIssue(issue)"
                />

            </div>

        </section>

        <!-- RECENT ACTIVITY -->
        <section class="dashboard-section">

            <h3 class="section-title">
                Recent Activity
            </h3>

            <div class="activity-panel">

                <div class="activity-toolbar">

                    <div class="activity-search">
                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            v-model="activitySearch"
                            type="text"
                            placeholder="Search activity..."
                        />
                    </div>

                    <div class="activity-filter">
                        <i class="fa-solid fa-filter"></i>

                        <button
                            class="activity-filter-button"
                            type="button"
                            @click="showStatusDropdown = !showStatusDropdown"
                        >
                            <span>
                                {{ selectedStatusLabel }}
                            </span>

                            <i
                                class="fa-solid fa-chevron-down activity-filter-chevron"
                                :class="{
                                    open: showStatusDropdown
                                }"
                            ></i>
                        </button>

                        <div
                            v-if="showStatusDropdown"
                            class="activity-filter-menu"
                        >
                            <button
                                v-for="option in statusOptions"
                                :key="option.value"
                                type="button"
                                class="activity-filter-option"
                                :class="{
                                    active: activityStatus === option.value
                                }"
                                @click="selectActivityStatus(option.value)"
                            >
                                {{ option.label }}
                            </button>
                        </div>
                    </div>

                </div>

                <div class="activity-list">

                <RecentActivityCard
                    v-for="activity in filteredRecentActivity"
                    :key="activity.id"
                    :title="
                        activity.title ||
                        'Untitled Session'
                    "
                    :summary="activity.summary"
                    :time="
                        formatActivityTime(activity.updatedAt)
                    "
                    :status="activity.status"
                    @click="openActivity(activity)"
                />

                <!-- EMPTY STATE -->
                <div
                    v-if="
                        !loading &&
                        filteredRecentActivity.length === 0
                    "
                    class="empty-state"
                >
                    No recent activity
                </div>

                </div>

            </div>

        </section>

    </div>
    <!-- LOGOUT MODAL -->
<div
    v-if="showLogoutModal"
    class="modal-overlay"
>
    <div class="logout-modal">

        <div class="modal-icon">
            <i class="fa-solid fa-right-from-bracket"></i>
        </div>

        <h3>Logout Confirmation</h3>

        <p>
            Are you sure you want to logout?
        </p>

        <div class="modal-actions">

            <button
                class="cancel-button"
                @click="showLogoutModal = false"
            >
                Cancel
            </button>

            <button
                class="confirm-button"
                @click="logout"
            >
                Logout
            </button>

        </div>

    </div>
</div>
</template>
