<script setup>
import { computed } from 'vue'

const props = defineProps({
  issues: {
    type: Array,
    default: () => []
  }
})

const colors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#8b5cf6', // purple
  '#ef4444', // red
  '#9ca3af'  // gray
]

const total = computed(() => {
  return props.issues.reduce((sum, item) => sum + item.count, 0)
})

const formattedIssues = computed(() => {
  if (total.value === 0) return []
  return props.issues.map((item, index) => {
    const percentage = Math.round((item.count / total.value) * 100)
    return {
      ...item,
      color: colors[index % colors.length],
      percentage,
      width: `${percentage}%`
    }
  })
})
</script>

<template>
  <div class="top-issue-chart">
    <div class="chart-header">
      <div class="chart-title-wrap">
        <h3>Most Common Issues</h3>
      </div>
      <div class="chart-total">Total {{ total }}</div>
    </div>

    <div v-if="issues.length === 0" class="empty-state">
      <p>No issue data available</p>
    </div>

    <div v-else class="chart-body">
      <div 
        v-for="(item, i) in formattedIssues" 
        :key="item.categoryId || i"
        class="issue-row"
      >
        <div class="issue-header">
          <div class="issue-label">
            <span class="dot" :style="{ backgroundColor: item.color }"></span>
            <span class="name">{{ item.name }}</span>
          </div>
          <div class="issue-stats">
            <span class="count">{{ item.count }}</span>
            <span class="percentage">({{ item.percentage }}%)</span>
          </div>
        </div>
        <div class="progress-bg">
          <div class="progress-fill" :style="{ width: item.width, backgroundColor: item.color }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-issue-chart {
  background: #25345b;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title-wrap h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.chart-total {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.chart-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.issue-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.issue-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

.issue-stats {
  font-size: 13px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.count {
  font-weight: 600;
  color: #ffffff;
}

.percentage {
  color: #94a3b8;
}

.progress-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 14px;
}
</style>
