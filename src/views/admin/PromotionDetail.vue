<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const props = defineProps(['id']);
const router = useRouter();
const isEdit = ref(!!props.id);

const promotion = ref({
  maDotGiamGia: '',
  tenDot: '',
  kieuGiamGia: 'PERCENT',
  giaTriGiam: 0,
  ngayBat_dau: '',
  ngayKet_thuc: '',
  trangThai: true
});

const selectedProductIds = ref([]);
const products = ref([]);

onMounted(async () => {
  // Fetch all products for selection
  try {
    const prodRes = await axios.get('http://localhost:8080/api/admin/products');
    products.value = prodRes.data.map(p => ({
      id: p.id,
      code: p.ma,
      name: p.ten
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  if (isEdit.value) {
    try {
      const promoRes = await axios.get(`http://localhost:8080/api/admin/promotions/${props.id}`);
      const p = promoRes.data;
      promotion.value = {
        ...p,
        ngayBat_dau: p.ngayBat_dau?.split('T')[0],
        ngayKet_thuc: p.ngayKet_thuc?.split('T')[0]
      };

      const selectedRes = await axios.get(`http://localhost:8080/api/admin/promotions/${props.id}/products`);
      selectedProductIds.value = selectedRes.data;
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    }
  }
});

const handleSave = async () => {
  try {
    await axios.post('http://localhost:8080/api/admin/promotions', {
      promotion: promotion.value,
      productIds: selectedProductIds.value
    });
    alert("Lưu khuyến mãi thành công!");
    router.push('/admin/promotions');
  } catch (error) {
    alert("Lưu thất bại!");
  }
};
</script>

<template>
  <div class="promotion-detail p-4">
    <h4 class="fw-bold mb-4">{{ isEdit ? 'Sửa Khuyến Mãi' : 'Thêm Khuyến Mãi' }}</h4>
    <div class="card border-0 shadow-sm p-4">
      <form @submit.prevent="handleSave">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Mã Đợt Giảm Giá</label>
            <input type="text" v-model="promotion.maDotGiamGia" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Tên chương trình</label>
            <input type="text" v-model="promotion.tenDot" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Kiểu giảm giá</label>
            <select v-model="promotion.kieuGiamGia" class="form-select">
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="AMOUNT">Số tiền cố định (VNĐ)</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Giá trị giảm</label>
            <input type="number" v-model="promotion.giaTriGiam" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Bắt đầu</label>
            <input type="date" v-model="promotion.ngayBat_dau" class="form-control" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">Kết thúc</label>
            <input type="date" v-model="promotion.ngayKet_thuc" class="form-control" required>
          </div>
          <div class="col-md-12">
            <label class="form-label d-block">Trạng thái</label>
            <div class="form-check form-switch mt-2">
              <input class="form-check-input" type="checkbox" v-model="promotion.trangThai">
              <label class="form-check-label">{{ promotion.trangThai ? 'Hoạt động' : 'Ngừng' }}</label>
            </div>
          </div>

          <div class="col-12 mt-4">
            <h6 class="fw-bold mb-3">Sản phẩm áp dụng</h6>
            <div class="table-responsive border rounded">
              <table class="table table-sm align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th width="40" class="ps-3">Chọn</th>
                    <th>Mã SP</th>
                    <th>Tên Sản Phẩm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in products" :key="p.id">
                    <td class="ps-3">
                      <input type="checkbox" :value="p.id" v-model="selectedProductIds" class="form-check-input">
                    </td>
                    <td>{{ p.code }}</td>
                    <td>{{ p.name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="col-12 text-end mt-4">
            <button type="submit" class="btn btn-danger px-4">Lưu</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
