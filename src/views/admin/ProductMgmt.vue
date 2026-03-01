<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const products = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const fetchProducts = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/products`);
    products.value = res.data;
  } catch (error) {
    console.error("Error fetching products:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});

const confirmDelete = async (product) => {
  if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.ten}"?`)) {
    try {
      await axios.delete(`${apiBaseUrl}/products/${product.id}`);
      alert("Đã xóa thành công!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Xóa thất bại!");
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
                <th>Tên Sản Phẩm</th>
                <th>Danh Mục</th>
                <th>Giá Gốc (VNĐ)</th>
                <th>Trạng thái</th>
                <th class="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td class="ps-4">#{{ product.id }}</td>
                <td class="fw-bold">{{ product.ten }}</td>
                <td><span class="badge bg-info text-dark opacity-75">{{ product.danhMuc ? product.danhMuc.ten : 'N/A' }}</span></td>
                <td>{{ product.giaGoc?.toLocaleString() }}</td>
                <td>
                  <span :class="product.trangThai ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ product.trangThai ? 'Đang bán' : 'Ngừng bán' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <router-link :to="'/admin/products/edit/' + product.id" class="btn btn-sm btn-outline-info me-2" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                  </router-link>
                  <router-link :to="'/admin/products/edit/' + product.id" class="btn btn-sm btn-outline-primary me-2">
                    <i class="fas fa-edit"></i>
                  </router-link>
                  <button @click="confirmDelete(product)" class="btn btn-sm btn-outline-danger">
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
