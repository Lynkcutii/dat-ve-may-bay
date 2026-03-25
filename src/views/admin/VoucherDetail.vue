<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

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
    }
  }
});

const handleSave = async () => {
  try {
    await axios.post('http://localhost:8080/api/admin/vouchers', voucher.value);
    alert("Lưu voucher thành công!");
    router.push('/admin/vouchers');
  } catch (error) {
    alert("Lưu thất bại!");
  }
};
</script>

<template>
  <div class="voucher-detail p-4">
    <h4 class="fw-bold mb-4">{{ isEdit ? 'Sửa Voucher' : 'Thêm Voucher' }}</h4>
    <div class="card border-0 shadow-sm p-4">
      <form @submit.prevent="handleSave">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Mã Voucher</label>
            <input type="text" v-model="voucher.maCode" class="form-control" required>
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
