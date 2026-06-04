<script setup>
defineProps({
    title: String,
    subtitle: String,
    total: Number,
    icon: String
})

const emit = defineEmits([
    'select'
])
</script>

<template>
    <div
        class="issue-card"
        role="button"
        tabindex="0"
        @click="emit('select')"
        @keyup.enter="emit('select')"
    >

        <div class="issue-left">
            <div class="issue-icon">
                <i :class="icon"></i>
            </div>

            <div>
                <h4>{{ title }}</h4>
                <p>{{ subtitle }}</p>
            </div>
        </div>

        <div class="issue-badge">
            {{ total }} cases
        </div>

    </div>
</template>
