<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const loading = ref(true);
const items = ref([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/admin/kho-loi`);
    items.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Lỗi load kho lỗi:', e);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (v) => (v ? new Date(v).toLocaleString('vi-VN') : 'N/A');

onMounted(fetchData);
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0"><i class="fas fa-exclamation-triangle me-2 text-warning"></i>Kho Lỗi</h4>
      <button class="btn btn-outline-dark btn-sm rounded-pill px-3" @click="fetchData">
        <i class="fas fa-sync-alt me-1"></i>Làm mới
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <div v-else-if="items.length === 0" class="text-center py-5 text-muted">
      <i class="fas fa-box-open fs-1 mb-2 d-block"></i>
      Chưa có dữ liệu hàng lỗi.
    </div>

    <div v-else class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>Sản phẩm</th>
            <th>Biến thể</th>
            <th>Mã HĐ gốc</th>
            <th class="text-center">SL</th>
            <th>Lý do</th>
            <th>Ngày nhập kho</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in items" :key="it.id">
            <td class="fw-bold">{{ it.productName || 'N/A' }}</td>
            <td>
              <div>{{ it.mauSac || 'N/A' }} / {{ it.kichThuoc || 'N/A' }}</div>
              <div class="small text-muted">{{ it.spctMa || 'N/A' }}</div>
            </td>
            <td>{{ it.maHoaDon || 'N/A' }}</td>
            <td class="text-center fw-bold">{{ it.soLuong || 0 }}</td>
            <td>{{ it.lyDo || 'N/A' }}</td>
            <td>{{ formatDate(it.ngayTao) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
