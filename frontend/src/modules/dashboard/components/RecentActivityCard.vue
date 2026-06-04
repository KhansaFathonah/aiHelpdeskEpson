<script setup>
defineProps({
    title: String,
    summary: String,
    time: String,
    status: String,
})

const formatStatus = (status) => {
    if (!status) return '-'

    return status
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>

<template>
    <div
        class="activity-card"
        :class="{
            clickable: status === 'ACTIVE'
        }"
    >

        <div class="activity-left">

            <div class="activity-icon">
                <i class="fa-regular fa-clock"></i>
            </div>

            <div>

                <h4>
                    {{ title }}
                </h4>

                <p>
                    {{ time }}
                </p>

            </div>

        </div>

        <div
            class="activity-status"
            :class="status?.toLowerCase()"
        >
            {{ formatStatus(status) }}
        </div>

    </div>
</template>
