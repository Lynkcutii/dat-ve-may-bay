<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const apiBaseUrl = 'http://localhost:8080/api/admin';

const loading = ref(true);
const mode = ref('day');
const metric = ref('quantity');
const orderType = ref('ALL');
const range = ref({
  fromDate: '',
  toDate: '',
});

const dashboard = ref({
  overview: {},
  channelSummary: {},
  chart: { data: [] },
  orderStatus: { items: [], totalOrders: 0 },
});

const MODE_OPTIONS = [
  { value: 'day', label: 'Ngày' },
  { value: 'month', label: 'Tháng' },
  { value: 'year', label: 'Năm' },
];

const METRIC_OPTIONS = [
  { value: 'quantity', label: 'Số lượng' },
  { value: 'revenue', label: 'Doanh số' },
];

const ORDER_TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'TAI_QUAY', label: 'Tại quầy' },
];

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

const summaryCards = computed(() => [
  {
    key: 'online',
    title: 'Doanh thu online',
    revenue: dashboard.value.channelSummary?.online?.revenue || 0,
    orders: dashboard.value.channelSummary?.online?.orders || 0,
    note: 'Đã trừ phí vận chuyển',
  },
  {
    key: 'pos',
    title: 'Doanh thu tại quầy',
    revenue: dashboard.value.channelSummary?.pos?.revenue || 0,
    orders: dashboard.value.channelSummary?.pos?.orders || 0,
    note: 'Tính theo đơn tại quầy',
  },
  {
    key: 'total',
    title: 'Tổng doanh thu',
    revenue: dashboard.value.channelSummary?.total?.revenue || 0,
    orders: dashboard.value.channelSummary?.total?.orders || 0,
    note: 'Tổng đơn đã giao trong kỳ',
  },
]);

const chartRows = computed(() => dashboard.value.chart?.data || []);
const statusItems = computed(() => dashboard.value.orderStatus?.items || []);
const totalOrders = computed(() => Number(dashboard.value.orderStatus?.totalOrders || 0));

const chartMax = computed(() => {
  const values = chartRows.value.map((item) => Number(item?.value ?? 0));
  const max = Math.max(...values, 0);
  return max > 0 ? max : 1;
});

const chartTicks = computed(() => {
  const max = chartMax.value;
  return Array.from({ length: 6 }, (_, index) => {
    const value = ((5 - index) * max) / 5;
    return {
      label: metric.value === 'revenue' ? formatCurrency(value) : `${Math.round(value * 10) / 10}`,
      top: `${(index / 5) * 100}%`,
    };
  });
});

const barLabelStep = computed(() => {
  const length = chartRows.value.length;
  if (length <= 8) return 1;
  if (length <= 16) return 2;
  if (length <= 24) return 3;
  return 4;
});

const barChartData = computed(() =>
  chartRows.value.map((item, index) => {
    const rawValue = Number(item?.value ?? 0);
    return {
      label: item?.label || item?.date || '',
      displayLabel: formatChartLabel(item?.label || item?.date || ''),
      value: rawValue,
      percent: rawValue > 0 ? Math.max((rawValue / chartMax.value) * 100, 3) : 0,
      showLabel: index % barLabelStep.value === 0,
    };
  }),
);

const donutStyle = computed(() => {
  const items = statusItems.value;
  const total = totalOrders.value || items.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!items.length || total <= 0) {
    return { background: 'conic-gradient(#e8edf3 0deg 360deg)' };
  }

  let current = 0;
  const segments = items.map((item) => {
    const count = Number(item.count || 0);
    const degrees = (count / total) * 360;
    const start = current;
    const end = current + degrees;
    current = end;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  };
});

function formatChartLabel(label) {
  if (!label) return '';
  if (mode.value === 'day') {
    const date = new Date(label);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('vi-VN');
  }
  if (mode.value === 'month') {
    const [year, month] = String(label).split('-');
    if (year && month) return `${month}/${year}`;
  }
  return label;
}

function buildParams() {
  const params = {
    mode: mode.value,
    metric: metric.value,
    orderType: orderType.value,
  };

  if (range.value.fromDate) params.from = range.value.fromDate;
  if (range.value.toDate) params.to = range.value.toDate;
  return params;
}

async function fetchDashboard() {
  try {
    loading.value = true;
    const response = await axios.get(`${apiBaseUrl}/revenue`, { params: buildParams() });
    dashboard.value = {
      overview: response.data?.overview || {},
      channelSummary: response.data?.channelSummary || {},
      chart: response.data?.chart || { data: [] },
      orderStatus: response.data?.orderStatus || { items: [], totalOrders: 0 },
    };
  } catch (error) {
    console.error('Error fetching revenue dashboard:', error);
  } finally {
    loading.value = false;
  }
}

function applyFilter() {
  if (range.value.fromDate && range.value.toDate && range.value.fromDate > range.value.toDate) {
    ElMessage.warning('Tu ngay khong duoc lon hon den ngay.');
    return;
  }
  fetchDashboard();
}

function resetFilter() {
  range.value = {
    fromDate: '',
    toDate: '',
  };
  mode.value = 'day';
  metric.value = 'quantity';
  orderType.value = 'ALL';
  fetchDashboard();
}

function setMode(nextMode) {
  if (mode.value === nextMode) return;
  mode.value = nextMode;
  fetchDashboard();
}

function setMetric(nextMetric) {
  if (metric.value === nextMetric) return;
  metric.value = nextMetric;
  fetchDashboard();
}

function setOrderType(nextOrderType) {
  if (orderType.value === nextOrderType) return;
  orderType.value = nextOrderType;
  fetchDashboard();
}

onMounted(fetchDashboard);
</script>

<template>
  <div class="revenue-page">
    <div class="toolbar-card">
      <div class="toolbar-range">
        <div class="toolbar-date">
          <span class="toolbar-icon">
            <i class="far fa-calendar"></i>
          </span>
          <input v-model="range.fromDate" type="date" class="toolbar-input" />
        </div>
        <div class="toolbar-separator">-</div>
        <div class="toolbar-date">
          <input v-model="range.toDate" type="date" class="toolbar-input" />
        </div>
      </div>

      <div class="toolbar-actions">
        <button class="btn-apply" @click="applyFilter">Áp dụng</button>
        <button class="btn-reset" @click="resetFilter">Đặt lại</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <template v-else>
      <div class="summary-grid">
        <article v-for="card in summaryCards" :key="card.key" class="summary-card">
          <p class="summary-title">{{ card.title }}</p>
          <h3 class="summary-value">{{ formatCurrency(card.revenue) }}</h3>
          <p class="summary-compare">
            {{ card.note }}
            <span class="compare-neutral">{{ Number(card.orders || 0).toLocaleString('vi-VN') }} đơn</span>
          </p>
        </article>
      </div>

      <div class="content-grid">
        <section class="chart-panel">
          <div class="panel-head">
            <h3>Thống kê</h3>
            <div class="panel-toggles">
              <div class="toggle-group">
                <button
                  v-for="option in ORDER_TYPE_OPTIONS"
                  :key="option.value"
                  class="toggle-btn"
                  :class="{ active: orderType === option.value }"
                  @click="setOrderType(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
              <div class="toggle-group">
                <button
                  v-for="option in MODE_OPTIONS"
                  :key="option.value"
                  class="toggle-btn"
                  :class="{ active: mode === option.value }"
                  @click="setMode(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
              <div class="toggle-group">
                <button
                  v-for="option in METRIC_OPTIONS"
                  :key="option.value"
                  class="toggle-btn"
                  :class="{ active: metric === option.value }"
                  @click="setMetric(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="bar-chart-shell">
            <div class="bar-chart-grid">
              <div
                v-for="tick in chartTicks"
                :key="tick.top"
                class="grid-line"
                :style="{ top: tick.top }"
              >
                <span class="grid-label">{{ tick.label }}</span>
              </div>
            </div>

            <div class="bars-wrap">
              <div v-for="bar in barChartData" :key="bar.label" class="bar-slot">
                <div class="bar-rail">
                  <div class="bar-fill" :style="{ height: `${bar.percent}%` }"></div>
                </div>
                <div class="bar-label" :class="{ ghost: !bar.showLabel }">{{ bar.displayLabel }}</div>
              </div>
            </div>
          </div>
        </section>

        <aside class="status-panel">
          <h3>Trạng thái đơn hàng</h3>

          <div class="donut-shell">
            <div class="donut-ring" :style="donutStyle">
              <div class="donut-center">
                <div class="donut-total">{{ totalOrders }}</div>
                <div class="donut-text">Đơn hàng</div>
              </div>
            </div>
          </div>

          <ul class="status-list">
            <li v-for="item in statusItems" :key="item.key">
              <span class="status-dot" :style="{ backgroundColor: item.color }"></span>
              <span class="status-name">{{ item.label }}: {{ item.count }}</span>
            </li>
          </ul>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.revenue-page {
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(180deg, #f6f7fb 0%, #eef1f6 100%);
}

.toolbar-card,
.summary-card,
.chart-panel,
.status-panel {
  background: #ffffff;
  border: 1px solid #e9edf3;
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(31, 36, 48, 0.06);
}

.toolbar-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  margin-bottom: 24px;
}

.toolbar-range {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 48px 1fr;
  align-items: center;
  gap: 10px;
}

.toolbar-date {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #fff;
}

.toolbar-icon {
  color: #a0a8b7;
  font-size: 1rem;
}

.toolbar-input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #5d6575;
  font-weight: 500;
}

.toolbar-separator {
  text-align: center;
  color: #6d7586;
  font-weight: 700;
  font-size: 1.1rem;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.btn-apply,
.btn-reset,
.toggle-btn {
  border: 1px solid #d9e0ea;
  border-radius: 10px;
  padding: 10px 18px;
  background: #fff;
  color: #4b5464;
  font-weight: 600;
  transition: 0.2s ease;
}

.btn-apply,
.toggle-btn.active {
  background: #4ea6f5;
  border-color: #4ea6f5;
  color: #fff;
  box-shadow: 0 10px 20px rgba(78, 166, 245, 0.22);
}

.btn-reset:hover,
.toggle-btn:hover,
.btn-apply:hover {
  transform: translateY(-1px);
}

.loading-state {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 22px 28px;
}

.summary-title {
  margin: 0 0 16px;
  color: #80889a;
  font-size: 0.95rem;
  font-weight: 500;
}

.summary-value {
  margin: 0 0 10px;
  color: #171c28;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.summary-compare {
  margin: 0;
  color: #80889a;
  font-size: 0.95rem;
}

.summary-compare span {
  margin-left: 6px;
  font-weight: 700;
}

.compare-neutral {
  color: #98a2b3;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(320px, 0.8fr);
  gap: 18px;
}

.chart-panel,
.status-panel {
  padding: 22px 24px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-head h3,
.status-panel h3 {
  margin: 0;
  color: #1f2430;
  font-size: 1.15rem;
  font-weight: 800;
}

.panel-toggles {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.toggle-group {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  min-width: 76px;
  padding: 8px 14px;
}

.bar-chart-shell {
  position: relative;
  height: 420px;
  padding: 24px 14px 72px 72px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
  overflow: hidden;
}

.bar-chart-grid {
  position: absolute;
  inset: 24px 14px 72px 72px;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid #eaf0f6;
}

.grid-label {
  position: absolute;
  left: -68px;
  top: -10px;
  color: #94a0b2;
  font-size: 0.8rem;
}

.bars-wrap {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20px, 1fr));
  gap: 10px;
  align-items: end;
}

.bar-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  min-width: 0;
  height: 100%;
}

.bar-rail {
  width: 22px;
  height: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
}

.bar-fill {
  width: 100%;
  min-height: 0;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, #8fd1ff 0%, #53b2f8 100%);
  border: 1px solid #4ea6f5;
  box-shadow: 0 8px 14px rgba(78, 166, 245, 0.18);
}

.bar-label {
  margin-top: 10px;
  width: 100%;
  color: #7e8898;
  font-size: 0.7rem;
  line-height: 1.2;
  text-align: right;
  transform: rotate(-45deg);
  transform-origin: top right;
  white-space: nowrap;
}

.bar-label.ghost {
  opacity: 0;
}

.status-panel {
  display: flex;
  flex-direction: column;
}

.donut-shell {
  display: flex;
  justify-content: center;
  padding: 10px 0 14px;
}

.donut-ring {
  width: 252px;
  height: 252px;
  border-radius: 50%;
  position: relative;
}

.donut-ring::after {
  content: '';
  position: absolute;
  inset: 36px;
  border-radius: 50%;
  background: #fff;
}

.donut-center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-total {
  color: #171c28;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.donut-text {
  margin-top: 6px;
  color: #7f8797;
  font-size: 1rem;
  font-weight: 600;
}

.status-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}

.status-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #505868;
  font-size: 1rem;
  font-weight: 600;
}

.status-list li + li {
  margin-top: 12px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: 0 0 12px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-card {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-range {
    grid-template-columns: 1fr;
  }

  .toolbar-separator {
    display: none;
  }

  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-toggles {
    justify-content: space-between;
  }
}
</style>
