<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import DateFilter from '@/components/DateFilter.vue';

const vouchers = ref([]);
const filterData = ref({ day: '', month: '', year: '' });

const filteredVouchers = computed(() => {
  return vouchers.value.filter(v => {
    if (!v.start) return true;
    const date = new Date(v.start);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    if (filterData.value.day && d !== parseInt(filterData.value.day)) return false;
    if (filterData.value.month && m !== parseInt(filterData.value.month)) return false;
    if (filterData.value.year && y !== parseInt(filterData.value.year)) return false;

    return true;
  }).sort((a, b) => b.id - a.id);
});

const handleFilter = (data) => {
  filterData.value = data;
};

const fetchVouchers = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/admin/vouchers');
    vouchers.value = response.data.map(v => ({
      id: v.id,
      code: v.maCode,
      type: v.kieuGiamGia,
      discount: v.giaTriGiam,
      maxDiscount: v.giaTriGiamToiDa,
      minOrder: v.giaTriToiThieu,
      quantity: v.soLuong,
      used: v.soLuongDaDung,
      start: v.ngayBatDau?.split('T')[0],
      end: v.ngayKetHuc?.split('T')[0],
      status: v.trangThai
    }));
  } catch (error) {
    console.error("Error fetching vouchers:", error);
  }
};

onMounted(fetchVouchers);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDiscount = (v) => {
  if (v.type === 'PERCENT') return `${v.discount}%`;
  return formatCurrency(v.discount);
};

const confirmDelete = async (id, code) => {
  if (window.confirm(`Xóa voucher "${code}"?`)) {
    try {
      await axios.delete(`http://localhost:8080/api/admin/vouchers/${id}`);
      window.alert("Xóa thành công!");
      fetchVouchers();
    } catch (error) {
      window.alert("Xóa thất bại!");
    }
  }
};
</script>

<template>
  <div class="voucher-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold">Quản Lý Voucher</h4>
      <router-link to="/admin/vouchers/add" class="btn btn-danger rounded-pill px-4">
        <i class="fas fa-plus me-2"></i>Thêm Voucher
      </router-link>
    </div>

    <DateFilter @filter="handleFilter" />

    <div class="card border-0 shadow-sm rounded-3">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">ID</th>
                <th>Mã Code</th>
                <th>Giảm giá</th>
                <th>Giảm tối đa</th>
                <th>Đơn tối thiểu</th>
                <th>Số lượng</th>
                <th>Bắt đầu</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th class="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in filteredVouchers" :key="v.id">
                <td class="ps-4">#{{ v.id }}</td>
                <td><span class="badge bg-danger fw-bold">{{ v.code }}</span></td>
                <td>{{ formatDiscount(v) }}</td>
                <td>{{ formatCurrency(v.maxDiscount) }}</td>
                <td>{{ formatCurrency(v.minOrder) }}</td>
                <td>{{ v.used }}/{{ v.quantity }}</td>
                <td>{{ v.start }}</td>
                <td>{{ v.end }}</td>
                <td>
                  <span :class="v.status ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ v.status ? 'Hoạt động' : 'Ngừng' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="d-flex justify-content-end gap-2">
                    <router-link :to="'/admin/vouchers/edit/' + v.id" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Sửa">
                      <i class="fas fa-edit text-primary"></i>
                    </router-link>
                    <button @click="confirmDelete(v.id, v.code)" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Xóa">
                      <i class="fas fa-trash text-danger"></i>
                    </button>
                  </div>
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
.btn-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s;
}
.btn-icon:hover {
  transform: translateY(-2px);
}
</style>
