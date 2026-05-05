<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import DateFilter from '@/components/DateFilter.vue';

const router = useRouter();
const selectedStaff = ref(null);
const staffList = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const filterData = ref({ day: '', month: '', year: '' });

const filteredStaff = computed(() => {
  return staffList.value.filter(staff => {
    if (!staff.ngayTao) return true;
    const date = new Date(staff.ngayTao);
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

const fetchStaff = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/users/role/2`);
    staffList.value = res.data;
  } catch (error) {
    console.error("Error fetching staff:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStaff();
});

const getStatusClass = (status) => {
  return status ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
};

const showDetail = (staff) => {
  selectedStaff.value = staff;
};

const toggleStatus = async (staff) => {
  if (confirm(`Thay đổi trạng thái nhân viên ${staff.hoTen}?`)) {
    try {
      // For now just toggle in UI or implement a specific API if needed
      // Here we assume we might need a PUT API to update user
      // await axios.put(`${apiBaseUrl}/users/${staff.id}/toggle-status`);
      staff.trangThai = !staff.trangThai;
      alert("Đã cập nhật trạng thái!");
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }
};
</script>

<template>
  <div class="card border-0 shadow-sm rounded-4">
    <div class="card-body p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="fw-bold m-0 text-dark">Quản Lý Nhân Viên</h4>
        <button @click="router.push('/admin/staff/add')" class="btn btn-danger rounded-pill px-4 fw-bold shadow-sm">
          <i class="fas fa-plus-circle me-2"></i>Thêm Nhân Viên
        </button>
      </div>

      <DateFilter @filter="handleFilter" />

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-danger" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Đang tải nhân viên...</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th class="py-3 px-3">ID</th>
              <th class="py-3">HỌ TÊN</th>
              <th class="py-3 text-center">TRẠNG THÁI</th>
              <th class="py-3 text-center">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in filteredStaff" :key="staff.id">
              <td class="px-3 fw-bold">#{{ staff.id }}</td>
              <td>
                <div class="fw-bold">{{ staff.hoTen }}</div>
                <div class="text-secondary small">{{ staff.email }}</div>
              </td>
              <td class="text-center">
                <span :class="getStatusClass(staff.trangThai)" class="badge rounded-pill px-3 py-2">
                  {{ staff.trangThai ? 'Đang làm việc' : 'Đã nghỉ việc' }}
                </span>
              </td>
              <td class="text-center">
                <div class="d-flex justify-content-center gap-2">
                  <button @click="showDetail(staff)" class="btn-action btn-view" data-bs-toggle="modal" data-bs-target="#staffModal" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button @click="router.push('/admin/staff/edit/' + staff.id)" class="btn-action btn-edit-custom" title="Chỉnh sửa">
                    <i class="far fa-edit"></i> 
                  </button>
                  <button @click="toggleStatus(staff)" class="btn-action" :class="staff.trangThai ? 'btn-status-off' : 'btn-status-on'">
                    <i class="fas" :class="staff.trangThai ? 'fa-user-slash' : 'fa-user-check'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL XEM CHI TIẾT NHÂN VIÊN -->
    <div class="modal fade" id="staffModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 pb-0">
            <h5 class="fw-bold">Thông Tin Nhân Viên</h5>
            <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4" v-if="selectedStaff">
            <div class="text-center mb-4">
                <div class="avatar-lg mx-auto mb-3 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center display-6 fw-bold">
                    {{ selectedStaff.hoTen?.charAt(0) }}
                </div>
                <h4 class="fw-bold mb-1">{{ selectedStaff.hoTen }}</h4>
                <span class="text-muted small fw-bold">{{ selectedStaff.vaiTro?.ten }}</span>
            </div>
            
            <div class="row g-3">
                <div class="col-6 border-end">
                    <label class="small text-muted d-block">Mã số</label>
                    <span class="fw-bold">BS-{{ selectedStaff.id }}</span>
                </div>
                <div class="col-6">
                    <label class="small text-muted d-block">Trạng thái</label>
                    <span class="fw-bold">{{ selectedStaff.trangThai ? 'Đang làm việc' : 'Nghỉ việc' }}</span>
                </div>
                <div class="col-12">
                    <label class="small text-muted d-block">Địa chỉ Email</label>
                    <span class="fw-bold">{{ selectedStaff.email }}</span>
                </div>
                <div class="col-12">
                    <label class="small text-muted d-block">Ngày gia nhập</label>
                    <span class="fw-bold">{{ new Date(selectedStaff.ngayTao).toLocaleDateString() }}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-action {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #eee; background: white; transition: 0.3s;
}
/* Kiểu dáng nút sửa giống hình mẫu */
.btn-edit-custom {
  width: 34px;
  height: 34px;
  border-radius: 6px; /* Bo góc nhẹ để ra hình vuông */
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1.5px solid #007bff !important; /* Viền màu xanh dương */
  color: #007bff !important;           /* Icon màu xanh dương */
  transition: 0.3s;
}

.btn-edit-custom:hover {
  background-color: #007bff !important; /* Đổi nền xanh khi di chuột vào */
  color: white !important;             /* Đổi icon trắng khi di chuột vào */
}

/* Các nút khác giữ nguyên hoặc chỉnh tương tự */
.btn-view {
  border: 1.5px solid #6c757d;
  color: #6c757d;
}
.btn-view:hover { background: #6c757d; color: white; }

.btn-status-off {
  border: 1.5px solid #dc3545;
  color: #dc3545;
}
.btn-status-off:hover { background: #dc3545; color: white; }
.btn-view:hover { background: #e0f7fa; color: #00acc1; }
.btn-edit:hover { background: #e8eaf6; color: #3f51b5; }
.btn-status-off:hover { background: #fff3e0; color: #fb8c00; }
.btn-status-on:hover { background: #e8f5e9; color: #43a047; }
.avatar-lg { width: 70px; height: 70px; }
.table thead th { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #888; border: none; }
</style>