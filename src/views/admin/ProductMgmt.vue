<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import DateFilter from '@/components/DateFilter.vue';

const products = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const filterData = ref({ day: '', month: '', year: '' });
const currentPage = ref(1);
const itemsPerPage = 10;

const filteredProducts = computed(() => {
  return products.value.filter(product => {
    if (!product.ngayTao) return true;
    const date = new Date(product.ngayTao);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    if (filterData.value.day && d !== parseInt(filterData.value.day)) return false;
    if (filterData.value.month && m !== parseInt(filterData.value.month)) return false;
    if (filterData.value.year && y !== parseInt(filterData.value.year)) return false;

    return true;
  });
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});

const handleFilter = (data) => {
  filterData.value = data;
  currentPage.value = 1;
};

function getTotalQuantity(product) {
  if (!product) return 0;
  if (typeof product.tongSoLuong === 'number') return product.tongSoLuong;
  if (!product.details) return 0;
  return product.details.reduce((sum, d) => sum + (d.soLuong || 0), 0);
}

const fetchProducts = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/products`);
    products.value = res.data;
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});

const toggleStatus = async (product) => {
  if (confirm(`Bạn có muốn ${product.trangThai ? 'ngừng bán' : 'tiếp tục bán'} sản phẩm "${product.tenSanPham}"?`)) {
    try {
      await axios.put(`${apiBaseUrl}/products/${product.id}/toggle-status`);
      alert('Cập nhật trạng thái thành công!');
      fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Cập nhật thất bại!');
    }
  }
};
</script>

<template>
  <div class="product-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold">Quản Lý Sản Phẩm</h4>
      <router-link to="/admin/products/add" class="btn btn-danger rounded-pill px-4">
        <i class="fas fa-plus me-2"></i>Thêm Sản Phẩm
      </router-link>
    </div>

    <DateFilter @filter="handleFilter" />

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Đang tải sản phẩm...</p>
    </div>

    <div v-else class="card border-0 shadow-sm rounded-3">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">ID</th>
                <th>Ảnh</th>
                <th>Tên Sản Phẩm</th>
                <th>Danh Mục</th>
                <th>Thương Hiệu</th>
                <th>Số Lượng</th>
                <th>Giá Gốc (VNĐ)</th>
                <th>Trạng Thái</th>
                <th class="text-end pe-4">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in paginatedProducts" :key="product.id">
                <td class="ps-4">#{{ product.id }}</td>
                <td>
                  <img
                    :src="(product.hinhAnhs && product.hinhAnhs.length > 0) ? product.hinhAnhs[0].url : 'https://via.placeholder.com/50'"
                    width="45"
                    height="45"
                    class="rounded border shadow-sm object-fit-cover"
                  >
                </td>
                <td class="fw-bold">{{ product.tenSanPham }}</td>
                <td>
                  <span class="badge bg-info text-dark opacity-75">
                    {{ product.danhMuc ? product.danhMuc.ten : 'N/A' }}
                  </span>
                </td>
                <td>
                  <span class="badge bg-light text-dark border opacity-75">
                    {{ product.thuongHieu ? product.thuongHieu.tenThuongHieu : 'N/A' }}
                  </span>
                </td>
                <td>
                  <span class="fw-bold" :class="getTotalQuantity(product) > 0 ? 'text-dark' : 'text-danger'">
                    {{ getTotalQuantity(product) }}
                  </span>
                </td>
                <td>{{ product.giaGoc?.toLocaleString() }}</td>
                <td>
                  <span :class="product.trangThai ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ product.trangThai ? 'Đang bán' : 'Ngừng bán' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <router-link :to="{ path: '/admin/products/edit/' + product.id, query: { mode: 'view' } }" class="btn btn-sm btn-outline-info me-2" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                  </router-link>
                  <router-link :to="'/admin/products/edit/' + product.id" class="btn btn-sm btn-outline-primary me-2" title="Sửa">
                    <i class="fas fa-edit"></i>
                  </router-link>
                  <button @click="toggleStatus(product)" class="btn btn-sm btn-outline-danger" title="Đổi trạng thái">
                    <i class="fas fa-trash"></i>
                  </button>
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
