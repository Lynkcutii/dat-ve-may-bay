<script setup>
import { ref, computed } from 'vue';
import DateFilter from '@/components/DateFilter.vue';

const filterData = ref({ day: '', month: '', year: '' });

const stats = ref([
  { label: 'Doanh thu hôm nay', value: '5,000,000 VNĐ', icon: 'fa-coins', color: 'text-primary' },
  { label: 'Hóa đơn mới', value: '12', icon: 'fa-file-invoice-dollar', color: 'text-success' },
  { label: 'Sản phẩm đã bán', value: '45', icon: 'fa-box-open', color: 'text-warning' },
]);

const recentRevenue = ref([
  { date: '2024-01-21', orders: 15, revenue: 8500000 },
  { date: '2024-01-20', orders: 20, revenue: 12000000 },
  { date: '2024-01-19', orders: 12, revenue: 6000000 },
]);

const filteredRevenue = computed(() => {
  return recentRevenue.value.filter(item => {
    const date = new Date(item.date);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    if (filterData.value.day && d !== parseInt(filterData.value.day)) return false;
    if (filterData.value.month && m !== parseInt(filterData.value.month)) return false;
    if (filterData.value.year && y !== parseInt(filterData.value.year)) return false;

    return true;
  });
});

const handleFilter = (data) => {
  filterData.value = data;
};
</script>

<template>
  <div class="revenue-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0">Báo Cáo Doanh Thu</h4>
    </div>

    <DateFilter @filter="handleFilter" />

    <div class="row g-4 mb-4">
      <div v-for="stat in stats" :key="stat.label" class="col-md-4">
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
                <th>Doanh Thu</th>
                <th class="text-end pe-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredRevenue" :key="item.date">
                <td class="ps-4">{{ item.date }}</td>
                <td>{{ item.orders }}</td>
                <td class="fw-bold text-danger">{{ item.revenue.toLocaleString() }} VNĐ</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-dark"><i class="fas fa-search-plus"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
