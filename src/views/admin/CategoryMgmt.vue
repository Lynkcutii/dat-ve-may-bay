<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const categories = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const showModal = ref(false);
const modalType = ref('add');
const form = ref({ id: null, ten: '', ma: '', trangThai: true });

const fetchCategories = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/categories`);
    categories.value = res.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  modalType.value = 'add';
  form.value = { id: null, ten: '', ma: '', trangThai: true };
  showModal.value = true;
};

const openEditModal = (category) => {
  modalType.value = 'edit';
  form.value = { ...category };
  showModal.value = true;
};

const saveCategory = async () => {
  if (!form.value.ten.trim()) {
    alert('Vui lòng nhập tên danh mục!');
    return;
  }

  try {
    if (modalType.value === 'add' && !form.value.ma) {
      form.value.ma = 'DM' + Date.now();
    }
    await axios.post(`${apiBaseUrl}/categories`, form.value);
    alert('Lưu thành công!');
    showModal.value = false;
    fetchCategories();
  } catch (error) {
    console.error("Error saving category:", error);
    alert('Lưu thất bại!');
  }
};

const deleteCategory = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
  try {
    // API backend có thể chưa có DELETE category, nên t sẽ check lại AdminController
    // Nếu chưa có thì t sẽ chỉ báo lỗi hoặc disable nút xóa.
    // Trong AdminController không thấy DELETE /categories.
    alert('Chức năng xóa đang được cập nhật!');
  } catch (error) {
    console.error("Error deleting category:", error);
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div class="category-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold">Quản Lý Danh Mục</h4>
      <button class="btn btn-danger rounded-pill px-4" @click="openAddModal">
        <i class="fas fa-plus me-2"></i>Thêm Danh Mục
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Đang tải danh mục...</p>
    </div>

    <div v-else class="card border-0 shadow-sm rounded-3">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">ID</th>
                <th>Tên Danh Mục</th>
                <th>Trạng thái</th>
                <th class="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td class="ps-4">#{{ category.id }}</td>
                <td class="fw-bold">{{ category.ten }}</td>
                <td>
                  <span :class="category.trangThai ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ category.trangThai ? 'Hoạt động' : 'Ngừng hoạt động' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-icon btn-light rounded-circle shadow-sm" title="Sửa" @click="openEditModal(category)">
                      <i class="fas fa-edit text-primary"></i>
                    </button>
                    <button class="btn btn-icon btn-light rounded-circle shadow-sm" title="Xóa" @click="deleteCategory(category.id)">
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

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop fade show"></div>
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <h5 class="modal-title fw-bold">{{ modalType === 'add' ? 'Thêm Danh Mục Mới' : 'Cập Nhật Danh Mục' }}</h5>
            <button type="button" class="btn-close shadow-none" @click="showModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted text-uppercase">Tên Danh Mục</label>
              <input v-model="form.ten" type="text" class="form-control border-0 bg-light shadow-none py-2 px-3 rounded-3" placeholder="Nhập tên danh mục...">
            </div>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" v-model="form.trangThai" id="categoryStatus">
              <label class="form-check-label small fw-bold text-muted" for="categoryStatus">Trạng thái (Hoạt động)</label>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0 px-4 pb-4">
            <button class="btn btn-light rounded-pill px-4 fw-bold" @click="showModal = false">Đóng</button>
            <button class="btn btn-danger rounded-pill px-4 fw-bold shadow-sm" @click="saveCategory">
              {{ modalType === 'add' ? 'Thêm mới' : 'Lưu thay đổi' }}
            </button>
          </div>
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

.modal-backdrop {
  z-index: 1040;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  z-index: 1050;
}
</style>
