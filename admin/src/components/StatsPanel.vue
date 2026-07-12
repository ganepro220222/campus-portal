<template>
  <div v-if="visible" class="stats-panel">
    <div class="panel-head">
      <h3>数据看板</h3>
      <div class="panel-actions">
        <el-date-picker
          v-model="exportMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          size="small"
          style="width: 140px"
        />
        <el-button size="small" :loading="exporting" @click="onExport">导出月报</el-button>
      </div>
    </div>

    <div v-loading="loading" class="kpi-row">
      <div v-for="k in kpiCards" :key="k.label" class="kpi-card">
        <div class="kpi-val">{{ k.value }}</div>
        <div class="kpi-label">{{ k.label }}</div>
        <div v-if="k.hint" class="kpi-hint">{{ k.hint }}</div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">近 30 日访问趋势</div>
        <div ref="trendRef" class="chart-canvas" />
      </div>
      <div class="chart-box chart-box-sm">
        <div class="chart-title">各板块访问分布（7 日）</div>
        <div ref="moduleRef" class="chart-canvas" />
      </div>
    </div>

    <div class="top-table">
      <div class="chart-title">内容浏览排行（近 7 日）</div>
      <el-table :data="topList" stripe border size="small">
        <el-table-column prop="targetTypeLabel" label="类型" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="viewCount" label="浏览量" width="90" align="center" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { ECharts } from 'echarts'
import { ElMessage } from 'element-plus'
import {
  exportStatsMonth,
  fetchStatsContentTop,
  fetchStatsModules,
  fetchStatsOverview,
  fetchStatsTrend
} from '@/api/stats'
import type { StatsContentTopItem, StatsOverview } from '@/types/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const visible = computed(() => auth.can('stats:view') || auth.can('admin:super'))

const loading = ref(false)
const exporting = ref(false)
const overview = ref<StatsOverview | null>(null)
const topList = ref<StatsContentTopItem[]>([])
const exportMonth = ref(new Date().toISOString().slice(0, 7))

const trendRef = ref<HTMLElement | null>(null)
const moduleRef = ref<HTMLElement | null>(null)
const trendChart = shallowRef<ECharts | null>(null)
const moduleChart = shallowRef<ECharts | null>(null)

let echartsModule: typeof import('echarts') | null = null

async function ensureEcharts() {
  if (!echartsModule) {
    echartsModule = await import('echarts')
  }
  return echartsModule
}

const kpiCards = computed(() => {
  const o = overview.value
  return [
    {
      label: '今日行为次数',
      hint: '含内容浏览、报名等操作记录',
      value: o?.pv ?? '—'
    },
    {
      label: '今日来访用户',
      hint: '当日有操作的登录用户数',
      value: o?.uv ?? '—'
    },
    {
      label: '今日活跃用户',
      hint: '当日打开过小程序的登录用户',
      value: o?.dau ?? '—'
    },
    { label: '今日新增用户', hint: '', value: o?.newMember ?? '—' },
    { label: '今日报名', hint: '', value: o?.enrollCount ?? '—' }
  ]
})

async function loadData() {
  if (!visible.value) return
  loading.value = true
  try {
    const [ov, trend, modules, top] = await Promise.all([
      fetchStatsOverview(),
      fetchStatsTrend(30),
      fetchStatsModules(7),
      fetchStatsContentTop(undefined, 10)
    ])
    overview.value = ov
    topList.value = top
    await renderTrend(trend)
    await renderModules(modules)
  } finally {
    loading.value = false
  }
}

async function renderTrend(data: { date: string; pv: number; uv: number; dau: number }[]) {
  if (!trendRef.value) return
  const echarts = await ensureEcharts()
  if (!trendChart.value) {
    trendChart.value = echarts.init(trendRef.value)
  }
  trendChart.value.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['行为次数', '来访用户', '活跃用户'], bottom: 0 },
    grid: { left: 48, right: 16, top: 24, bottom: 48 },
    xAxis: { type: 'category', data: data.map((d) => d.date.slice(5)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '行为次数', type: 'line', smooth: true, data: data.map((d) => d.pv), color: '#3F57B5' },
      { name: '来访用户', type: 'line', smooth: true, data: data.map((d) => d.uv), color: '#5C9A6B' },
      { name: '活跃用户', type: 'line', smooth: true, data: data.map((d) => d.dau), color: '#C0A24E' }
    ]
  })
}

async function renderModules(data: { moduleLabel: string; count: number }[]) {
  if (!moduleRef.value) return
  const echarts = await ensureEcharts()
  if (!moduleChart.value) {
    moduleChart.value = echarts.init(moduleRef.value)
  }
  moduleChart.value.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['38%', '68%'],
      data: data.map((d) => ({ name: d.moduleLabel, value: d.count })),
      label: { formatter: '{b}\n{c}' }
    }]
  })
}

async function onExport() {
  exporting.value = true
  try {
    await exportStatsMonth(exportMonth.value)
    ElMessage.success('月报已开始下载')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

function onResize() {
  trendChart.value?.resize()
  moduleChart.value?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  trendChart.value?.dispose()
  moduleChart.value?.dispose()
})
</script>

<style scoped lang="scss">
.stats-panel {
  background: #fff;
  border: 1px solid var(--brand-line);
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 6px 18px rgba(31, 40, 90, 0.05);
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: var(--brand-ink);
  }
}
.panel-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}
.kpi-card {
  background: linear-gradient(135deg, #f8faff 0%, #f2f6fc 100%);
  border: 1px solid #e8edf5;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}
.kpi-val {
  font-size: 26px;
  font-weight: 700;
  color: var(--brand-primary);
}
.kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-ink);
  margin-top: 6px;
}
.kpi-hint {
  font-size: 11px;
  color: var(--brand-muted);
  margin-top: 4px;
  line-height: 1.4;
}
.chart-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}
.chart-box {
  border: 1px solid #eef1f6;
  border-radius: 12px;
  padding: 12px 12px 4px;
}
.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-ink);
  margin-bottom: 8px;
}
.chart-canvas {
  height: 280px;
}
.top-table {
  border: 1px solid #eef1f6;
  border-radius: 12px;
  padding: 12px;
}

@media (max-width: 1200px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
</style>
