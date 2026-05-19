<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps(['id']);
const router = useRouter();
const isEdit = ref(!!props.id);

const voucher = ref({
  id: null,
  maCode: '',
  kieuGiamGia: 'PERCENT',
  giaTriGiam: 0,
  giaTriGiamToiDa: 0,
  giaTriToiThieu: 0,
  soLuong: 0,
  ngayBatDau: '',
  ngayKetHuc: '',
  trangThai: true
});

onMounted(async () => {
  if (isEdit.value) {
    try {
      const response = await axios.get(`http://localhost:8080/api/admin/vouchers/${props.id}`);
      const v = response.data;
      voucher.value = {
        ...v,
        ngayBatDau: v.ngayBatDau?.split('T')[0],
        ngayKetHuc: v.ngayKetHuc?.split('T')[0]
      };
    } catch (error) {
      console.error("Error fetching voucher:", error);
      ElMessage.error("Không thể tải thông tin voucher");
    }
  } else {
    // Tự động tạo mã voucher
    voucher.value.maCode = 'VOUCHER' + Date.now();
  }
});

const handleSave = async () => {
  try {
    if (!isEdit.value) {
      await ElMessageBox.confirm(
        'Xác nhận thêm mới voucher này?',
        'Xác nhận',
        {
          confirmButtonText: 'Đồng ý',
          cancelButtonText: 'Hủy bỏ',
          type: 'info',
        }
      );
    }

    // Format lại ngày tháng để phù hợp với LocalDateTime của Backend
    const payload = {
      ...voucher.value,
      ngayBatDau: voucher.value.ngayBatDau ? `${voucher.value.ngayBatDau}T00:00:00` : null,
      ngayKetHuc: voucher.value.ngayKetHuc ? `${voucher.value.ngayKetHuc}T23:59:59` : null
    };

    await axios.post('http://localhost:8080/api/admin/vouchers', payload);
    ElMessage.success(isEdit.value ? "Cập nhật voucher thành công!" : "Thêm mới voucher thành công!");
    router.push('/admin/vouchers');
  } catch (error) {
    if (error !== 'cancel') {
      console.error("Lỗi khi lưu voucher:", error.response?.data);
      ElMessage.error(error.response?.data?.message || "Lưu thất bại, vui lòng kiểm tra lại!");
    }
  }
};
</script>

<template>
  <div class="voucher-detail container-fluid py-4">
    <div class="d-flex align-items-center mb-4">
      <button @click="router.back()" class="btn btn-white shadow-sm rounded-circle me-3">
        <i class="fas fa-arrow-left text-secondary"></i>
      </button>
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1">
            <li class="breadcrumb-item small">
              <router-link to="/admin/vouchers" class="text-decoration-none text-muted">Voucher</router-link>
            </li>
            <li class="breadcrumb-item small active" aria-current="page">{{ isEdit ? 'Chỉnh sửa' : 'Thêm mới' }}</li>
          </ol>
        </nav>
        <h4 class="fw-bold mb-0 text-dark">{{ isEdit ? 'SỬA VOUCHER' : 'THÊM VOUCHER MỚI' }}</h4>
      </div>
    </div>
    <div class="card border-0 shadow-sm p-4 rounded-4">
      <form @submit.prevent="handleSave">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Mã Voucher</label>
            <input type="text" v-model="voucher.maCode" class="form-control bg-light" readonly placeholder="Mã tự động">
          </div>
          <div class="col-md-6">
            <label class="form-label">Kiểu giảm giá</label>
            <select v-model="voucher.kieuGiamGia" class="form-select">
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="AMOUNT">Số tiền cố định (VNĐ)</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Giá trị giảm</label>
            <input type="number" v-model="voucher.giaTriGiam" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Giảm tối đa</label>
            <input type="number" v-model="voucher.giaTriGiamToiDa" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Đơn tối thiểu</label>
            <input type="number" v-model="voucher.giaTriToiThieu" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Số lượng</label>
            <input type="number" v-model="voucher.soLuong" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Bắt đầu</label>
            <input type="date" v-model="voucher.ngayBatDau" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Kết thúc</label>
            <input type="date" v-model="voucher.ngayKetHuc" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label d-block">Trạng thái</label>
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" v-model="voucher.trangThai">
              <label class="form-check-label">{{ voucher.trangThai ? 'Hoạt động' : 'Ngừng' }}</label>
            </div>
          </div>
          <div class="col-12 text-end">
            <button type="submit" class="btn btn-danger px-4">Lưu</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.btn-white {
  background: white;
  border: none;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-white:hover {
  background-color: #f8f9fa;
  transform: scale(1.05);
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "/";
}

.voucher-detail {
  background-color: #f8f9fa;
  min-height: 100vh;
}
</style>
