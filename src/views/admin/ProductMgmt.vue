<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { ElMessageBox, ElMessage } from 'element-plus';

const products = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  
  const query = searchQuery.value.toLowerCase();
  return products.value.filter(product => {
    return (
      product.tenSanPham?.toLowerCase().includes(query) ||
      product.id?.toString().includes(query) ||
      product.ma?.toLowerCase().includes(query)
    );
  });
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});

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
  try {
    await ElMessageBox.confirm(
      `Bạn có muốn ${product.trangThai ? 'ngừng bán' : 'tiếp tục bán'} sản phẩm "${product.tenSanPham}"?`,
      'Xác nhận thay đổi',
      {
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        type: 'warning',
      }
    );
    try {
      await axios.put(`${apiBaseUrl}/products/${product.id}/toggle-status`);
      ElMessage.success('Cập nhật trạng thái thành công!');
      fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      ElMessage.error('Cập nhật thất bại!');
    }
  } catch (error) {
    // User cancelled
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

    <div class="card border-0 shadow-sm rounded-3 mb-4">
      <div class="card-body p-3">
        <div class="row align-items-center">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <i class="fas fa-search text-muted"></i>
              </span>
              <input 
                v-model="searchQuery" 
                type="text" 
                class="form-control border-start-0 ps-0" 
                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                @input="currentPage = 1"
              >
            </div>
          </div>
          <div class="col-md-6 text-end">
            <button @click="searchQuery = ''; currentPage = 1" class="btn btn-outline-secondary rounded-pill px-3">
              <i class="fas fa-undo me-1"></i> Làm mới
            </button>
          </div>
        </div>
      </div>
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
                  <div class="d-flex justify-content-end gap-2">
                    <router-link :to="{ path: '/admin/products/edit/' + product.id, query: { mode: 'view' } }" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Xem chi tiết">
                      <i class="fas fa-eye text-info"></i>
                    </router-link>
                    <router-link :to="'/admin/products/edit/' + product.id" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Sửa">
                      <i class="fas fa-edit text-primary"></i>
                    </router-link>
                    <button @click="toggleStatus(product)" class="btn btn-icon btn-light rounded-circle shadow-sm" title="Đổi trạng thái">
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

.transition-all {
  transition: all 0.25s ease-in-out;
}
</style>
