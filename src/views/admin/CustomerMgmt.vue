<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const customers = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const fetchCustomers = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/users/role/3`);
    customers.value = res.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
});

const searchQuery = ref('');
const selectedCustomer = ref(null);

const filteredCustomers = computed(() => {
  return customers.value.filter(c => 
    c.hoTen?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const viewDetails = (customer) => {
  selectedCustomer.value = customer;
};

const toggleStatus = async (customer) => {
  const isLocking = customer.trangThai;
  const message = isLocking 
    ? `Bạn có chắc chắn muốn KHÓA tài khoản của ${customer.hoTen}? Khách hàng này sẽ không thể đăng nhập.`
    : `Bạn có muốn MỞ KHÓA cho tài khoản của ${customer.hoTen}?`;

  if (confirm(message)) {
    try {
      customer.trangThai = !customer.trangThai;
      alert("Đã cập nhật trạng thái!");
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }
};
</script>

<template>
  <div class="customer-mgmt p-3">
    <!-- THỐNG KÊ NHANH -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <div class="small fw-bold text-secondary text-uppercase">TỔNG KHÁCH</div>
          <div class="h3 fw-bold m-0 text-danger">{{ customers.length }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <div class="small fw-bold text-secondary text-uppercase">ĐANG HOẠT ĐỘNG</div>
          <div class="h3 fw-bold m-0 text-danger">{{ customers.filter(c => c.trangThai).length }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <div class="small fw-bold text-secondary text-uppercase">BỊ KHÓA</div>
          <div class="h3 fw-bold m-0 text-danger">{{ customers.filter(c => !c.trangThai).length }}</div>
        </div>
      </div>
    </div>

    <!-- DANH SÁCH KHÁCH HÀNG -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h5 class="fw-bold m-0"><i class="fas fa-users me-2"></i>QUẢN LÝ KHÁCH HÀNG</h5>
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input v-model="searchQuery" type="text" placeholder="Tìm tên hoặc Email...">
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Đang tải khách hàng...</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr class="small text-secondary">
                <th class="border-0 px-3">KHÁCH HÀNG</th>
                <th class="border-0">THÔNG TIN LIÊN HỆ</th>
                <th class="border-0 text-center">TRẠNG THÁI</th>
                <th class="border-0 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in filteredCustomers" :key="customer.id">
                <td class="px-3">
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">{{ customer.hoTen?.charAt(0) }}</div>
                    <div>
                      <div class="fw-bold text-dark">{{ customer.hoTen }}</div>
                      <div class="text-muted small">ID: #{{ customer.id }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="small"><i class="fas fa-envelope me-2 text-muted"></i>{{ customer.email }}</div>
                  <div class="small text-muted">Ngày tham gia: {{ new Date(customer.ngayTao).toLocaleDateString() }}</div>
                </td>
                <td class="text-center">
                  <span :class="customer.trangThai ? 'badge-active' : 'badge-locked'">
                    {{ customer.trangThai ? 'Hoạt động' : 'Bị khóa' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-2">
                    <button @click="viewDetails(customer)" class="btn-tool btn-view" data-bs-toggle="modal" data-bs-target="#detailModal">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button @click="toggleStatus(customer)" class="btn-tool" :class="customer.trangThai ? 'btn-lock' : 'btn-unlock'">
                      <i class="fas" :class="customer.trangThai ? 'fa-user-slash' : 'fa-user-check'"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT KHÁCH HÀNG -->
    <div class="modal fade" id="detailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4" v-if="selectedCustomer">
          <div class="modal-header border-0 pb-0">
            <h5 class="fw-bold m-0">Hồ Sơ Khách Hàng</h5>
            <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="text-center mb-4">
              <div class="avatar-large mx-auto mb-3">{{ selectedCustomer.hoTen?.charAt(0) }}</div>
              <h4 class="fw-bold mb-1">{{ selectedCustomer.hoTen }}</h4>
              <span class="badge bg-danger rounded-pill px-3">Mã: KH{{ selectedCustomer.id }}</span>
            </div>

            <div class="row g-3">
              <div class="col-12 border-bottom pb-2">
                <label class="small text-muted d-block">Email</label>
                <span class="fw-bold">{{ selectedCustomer.email }}</span>
              </div>
              <div class="col-12 border-bottom pb-2">
                <label class="small text-muted d-block">Ngày tham gia</label>
                <span class="fw-bold">{{ new Date(selectedCustomer.ngayTao).toLocaleDateString() }}</span>
              </div>
              <div class="col-12 mt-3">
                <label class="small text-muted d-block mb-1 text-uppercase fw-bold" style="font-size: 10px;">Trạng thái tài khoản</label>
                <div class="small">• Trạng thái hiện tại: <b :class="selectedCustomer.trangThai ? 'text-success' : 'text-danger'">{{ selectedCustomer.trangThai ? 'Hoạt động' : 'Bị khóa' }}</b></div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-dark rounded-pill px-4" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Thanh tìm kiếm */
.search-box {
  display: flex; align-items: center; background: #f1f3f5;
  padding: 8px 20px; border-radius: 50px; width: 300px;
}
.search-box input { border: none; background: transparent; outline: none; margin-left: 10px; width: 100%; font-size: 14px; }
.search-box i { color: #adb5bd; }

/* Avatar */
.avatar-circle {
  width: 42px; height: 42px; background: #343a40; color: white;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; font-weight: bold; font-size: 18px;
}
.avatar-large {
  width: 80px; height: 80px; background: #dc3545; color: white;
  display: flex; align-items: center; justify-content: center;
  border-radius: 20px; font-weight: bold; font-size: 32px;
}

/* Badge Trạng thái */
.badge-active { background: #e6fcf5; color: #0ca678; padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }
.badge-locked { background: #fff5f5; color: #f03e3e; padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }

/* Nút công cụ */
.btn-tool {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid #eee;
  background: white; transition: 0.3s;
}
.btn-view:hover { background: #e7f1ff; color: #0d6efd; border-color: #0d6efd; }
.btn-lock:hover { background: #fff5f5; color: #e03131; border-color: #f03e3e; }
.btn-unlock:hover { background: #ebfbee; color: #2f9e44; border-color: #40c057; }

/* Table */
thead th { font-size: 11px; letter-spacing: 0.5px; }
tr { transition: 0.2s; cursor: default; }
</style>