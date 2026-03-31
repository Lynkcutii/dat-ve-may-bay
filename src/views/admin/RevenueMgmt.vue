<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';

const apiBaseUrl = 'http://localhost:8080/api/admin';

const loading = ref(true);
const recentRevenue = ref([]);

const dateRange = ref({
  fromDate: '',
  toDate: '',
});

const appliedRange = ref({
  fromDate: '',
  toDate: '',
});

const filteredRevenue = computed(() => {
  return recentRevenue.value.filter((item) => {
    const itemDate = normalizeDate(item.date);
    if (!itemDate) return false;

    const fromDate = appliedRange.value.fromDate ? normalizeDate(appliedRange.value.fromDate) : null;
    const toDate = appliedRange.value.toDate ? normalizeDate(appliedRange.value.toDate) : null;

    if (fromDate && itemDate < fromDate) return false;
    if (toDate && itemDate > toDate) return false;
    return true;
  });
});

const summaryStats = computed(() => {
  return filteredRevenue.value.reduce(
    (acc, item) => {
      acc.revenue += Number(item.revenue || 0);
      acc.orders += Number(item.orders || 0);
      acc.productsSold += Number(item.productsSold || 0);
      return acc;
    },
    { revenue: 0, orders: 0, productsSold: 0 },
  );
});

const statCards = computed(() => [
  { label: 'Tổng doanh thu', value: formatCurrency(summaryStats.value.revenue), icon: 'fa-coins', color: 'text-primary' },
  { label: 'Tổng đơn hàng', value: Number(summaryStats.value.orders).toLocaleString('vi-VN'), icon: 'fa-file-invoice-dollar', color: 'text-success' },
  { label: 'Tổng sản phẩm bán', value: Number(summaryStats.value.productsSold).toLocaleString('vi-VN'), icon: 'fa-box-open', color: 'text-warning' },
]);

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : 'Không có');

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const handleFilter = () => {
  if (dateRange.value.fromDate && dateRange.value.toDate) {
    const from = normalizeDate(dateRange.value.fromDate);
    const to = normalizeDate(dateRange.value.toDate);
    if (from && to && from > to) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
  }

  appliedRange.value = { ...dateRange.value };
};

const handleReset = () => {
  dateRange.value = { fromDate: '', toDate: '' };
  appliedRange.value = { fromDate: '', toDate: '' };
};

const fetchRevenue = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/revenue`);
    recentRevenue.value = res.data?.dailyRevenue || [];
  } catch (error) {
    console.error('Error fetching revenue:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchRevenue);
</script>

<template>
  <div class="revenue-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0">Báo Cáo Doanh Thu</h4>
    </div>

    <div class="date-range-filter d-flex flex-wrap gap-3 align-items-end bg-white p-3 rounded-3 shadow-sm mb-4">
      <div class="filter-item">
        <label class="form-label small fw-bold text-secondary mb-1">Từ ngày</label>
        <input v-model="dateRange.fromDate" type="date" class="form-control form-control-sm border-0 bg-light" />
      </div>

      <div class="filter-item">
        <label class="form-label small fw-bold text-secondary mb-1">Đến ngày</label>
        <input v-model="dateRange.toDate" type="date" class="form-control form-control-sm border-0 bg-light" />
      </div>

      <div class="filter-actions d-flex gap-2">
        <button @click="handleFilter" class="btn btn-sm btn-danger rounded-pill px-3">
          <i class="fas fa-filter me-1"></i>Lọc
        </button>
        <button @click="handleReset" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
          <i class="fas fa-undo me-1"></i>Reset
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <template v-else>
      <div class="row g-4 mb-4">
        <div v-for="stat in statCards" :key="stat.label" class="col-md-4">
          <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body d-flex align-items-center p-4">
              <div :class="['rounded-circle p-3 bg-light me-3', stat.color]">
                <i :class="['fas fa-lg', stat.icon]"></i>
              </div>
              <div>
                <p class="text-secondary small mb-1">{{ stat.label }}</p>
                <h5 class="fw-bold mb-0">{{ stat.value }}</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-3">
        <div class="card-header bg-white border-0 py-3">
          <h5 class="mb-0 fw-bold">Lịch Sử Doanh Thu</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Ngày</th>
                  <th>Số Đơn Hàng</th>
                  <th>Sản phẩm bán</th>
                  <th>Doanh Thu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredRevenue" :key="item.date">
                  <td class="ps-4">{{ formatDate(item.date) }}</td>
                  <td>{{ Number(item.orders || 0).toLocaleString('vi-VN') }}</td>
                  <td>{{ Number(item.productsSold || 0).toLocaleString('vi-VN') }}</td>
                  <td class="fw-bold text-danger">{{ formatCurrency(item.revenue) }}</td>
                </tr>
                <tr v-if="filteredRevenue.length === 0">
                  <td colspan="4" class="text-center text-muted py-4">Không có dữ liệu doanh thu phù hợp.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.date-range-filter {
  max-width: fit-content;
}

.filter-item {
  min-width: 180px;
}

.form-control:focus {
  box-shadow: none;
  background-color: #f8f9fa;
}

.table thead th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 15px 10px;
}

.table tbody td {
  padding: 15px 10px;
}
</style>
