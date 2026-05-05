<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import DateFilter from '@/components/DateFilter.vue';

const promotions = ref([]);
const filterData = ref({ day: '', month: '', year: '' });

const filteredPromotions = computed(() => {
  return promotions.value.filter(p => {
    if (!p.start) return true;
    const date = new Date(p.start);
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

const fetchPromotions = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/admin/promotions');
    promotions.value = response.data.map(p => ({
      id: p.id,
      code: p.maDotGiamGia,
      name: p.tenDot,
      type: p.kieuGiamGia,
      discount: p.giaTriGiam,
      start: p.ngayBatDau?.split('T')[0],
      end: p.ngayKetHuc?.split('T')[0],
      status: p.trangThai
    }));
  } catch (error) {
    console.error("Error fetching promotions:", error);
  }
};

onMounted(fetchPromotions);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDiscount = (p) => {
  if (p.type === 'PERCENT') return `${p.discount}%`;
  return formatCurrency(p.discount);
};

const confirmDelete = async (id, name) => {
  if (confirm(`Xóa khuyến mãi "${name}"?`)) {
    try {
      await axios.delete(`http://localhost:8080/api/admin/promotions/${id}`);
      alert("Xóa thành công!");
      fetchPromotions();
    } catch (error) {
      alert("Xóa thất bại!");
    }
  }
};
</script>

<template>
  <div class="promotion-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold">Quản Lý Khuyến Mãi</h4>
      <router-link to="/admin/promotions/add" class="btn btn-danger rounded-pill px-4">
        <i class="fas fa-plus me-2"></i>Thêm Khuyến Mãi
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
                <th>Mã Đợt</th>
                <th>Tên Đợt</th>
                <th>Giảm giá</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Trạng thái</th>
                <th class="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredPromotions" :key="p.id">
                <td class="ps-4">#{{ p.id }}</td>
                <td><span class="badge bg-danger fw-bold">{{ p.code }}</span></td>
                <td class="fw-bold">{{ p.name }}</td>
                <td>{{ formatDiscount(p) }}</td>
                <td>{{ p.start }}</td>
                <td>{{ p.end }}</td>
                <td>
                  <span :class="p.status ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ p.status ? 'Hoạt động' : 'Ngừng' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="d-flex justify-content-end gap-2">
                    <router-link :to="'/admin/promotions/edit/' + p.id" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Sửa">
                      <i class="fas fa-edit text-primary"></i>
                    </router-link>
                    <button @click="confirmDelete(p.id, p.name)" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Xóa">
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
