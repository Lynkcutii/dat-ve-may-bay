<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const route = useRoute();
const router = useRouter();

const order = ref(null);
const orderDetails = ref([]);
const returnRequest = ref(null);
const loading = ref(true);

const steps = [
  { label: 'Trả hàng', value: 'CHO_XAC_NHAN_HOAN', icon: 'fas fa-undo' },
  { label: 'Kiểm tra hàng hoàn', value: 'DA_NHAN_HANG_KIEM_TRA', icon: 'fas fa-search' },
  { label: 'Hoàn tiền', value: 'HOAN_THANH', icon: 'fas fa-money-bill-wave' }
];

const fetchReturnDetail = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/order/${route.params.id}`);
    if (res.data) {
      order.value = res.data.bill;
      orderDetails.value = res.data.items;
      // Lấy yêu cầu đổi trả mới nhất
      if (res.data.returns && res.data.returns.length > 0) {
        returnRequest.value = res.data.returns.sort((a, b) => b.id - a.id)[0];
      }
    }
  } catch (error) {
    console.error("Error fetching return detail:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchReturnDetail);

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
};

const parseImages = (jsonStr) => {
  if (!jsonStr) return [];
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return [];
  }
};

const getStepStatus = (stepValue) => {
  if (!returnRequest.value) return 'pending';
  const status = returnRequest.value.trangThai;
  
  const statusOrder = ['CHO_XAC_NHAN_HOAN', 'CHO_GIAO_HANG', 'DA_NHAN_HANG_KIEM_TRA', 'HOAN_THANH'];
  const currentIndex = statusOrder.indexOf(status);
  const stepIndex = statusOrder.indexOf(stepValue);

  if (status === 'TU_CHOI') return 'rejected';
  if (stepIndex <= currentIndex && currentIndex !== -1) return 'completed';
  return 'pending';
};

const getProgressWidth = () => {
  if (!returnRequest.value) return '0%';
  const status = returnRequest.value.trangThai;
  if (status === 'TU_CHOI') return '0%';
  
  const statusOrder = ['CHO_XAC_NHAN_HOAN', 'DA_NHAN_HANG_KIEM_TRA', 'HOAN_THANH'];
  const currentIndex = statusOrder.indexOf(status);
  if (currentIndex === -1) {
      if (status === 'CHO_GIAO_HANG') return '25%';
      return '0%';
  }
  return (currentIndex / (statusOrder.length - 1)) * 100 + '%';
};

</script>

<template>
  <div class="container py-5">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else-if="!returnRequest" class="text-center py-5">
      <div class="mb-4">
        <i class="fas fa-exclamation-circle fs-1 text-secondary"></i>
      </div>
      <h4 class="fw-bold">Không tìm thấy yêu cầu hoàn trả</h4>
      <p class="text-secondary">Đơn hàng này chưa có yêu cầu hoàn trả nào được ghi nhận.</p>
      <router-link to="/order-history" class="btn btn-dark rounded-pill px-5 mt-3">QUAY LẠI</router-link>
    </div>

    <div v-else class="return-detail-container">
      <!-- Header with Back Button -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <button @click="router.back()" class="btn btn-link text-dark text-decoration-none p-0 d-flex align-items-center fw-bold">
          <i class="fas fa-chevron-left me-2"></i> QUAY LẠI
        </button>
        <div class="text-secondary small">
          Mã Yêu Cầu: <span class="fw-bold text-dark">{{ returnRequest.maDoiTra }}</span>
          <span class="mx-2">|</span>
          Hoàn Tiền Vào: <span class="fw-bold text-dark">{{ formatDate(returnRequest.ngayYeuCau) }}</span>
        </div>
      </div>

      <!-- Status Progress Bar -->
      <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div class="card-body py-5 px-4">
          <div class="position-relative mb-5" style="height: 4px; background-color: #f0f0f0; margin: 0 40px;">
            <div class="progress-bar-fill position-absolute bg-success h-100 transition-all" :style="{ width: getProgressWidth() }"></div>
            
            <div class="d-flex justify-content-between position-absolute top-50 w-100 translate-middle-y">
              <div v-for="step in steps" :key="step.value" class="step-point text-center" style="width: 100px; margin: 0 -50px;">
                <div 
                  class="step-circle mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm transition-all"
                  :class="[
                    getStepStatus(step.value) === 'completed' ? 'bg-success text-white' : 
                    getStepStatus(step.value) === 'rejected' ? 'bg-danger text-white' : 'bg-white text-secondary border'
                  ]"
                  style="width: 24px; height: 24px; position: relative; z-index: 2;"
                >
                  <i class="fas fa-check small" v-if="getStepStatus(step.value) === 'completed'"></i>
                  <i class="fas fa-times small" v-else-if="getStepStatus(step.value) === 'rejected'"></i>
                </div>
                <div class="step-label fw-bold small text-nowrap" :class="getStepStatus(step.value) !== 'pending' ? 'text-dark' : 'text-secondary'">
                  {{ step.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Refund Status Message -->
          <div v-if="returnRequest.trangThai === 'HOAN_THANH'" class="text-danger mt-5 pt-3 border-top">
            <h5 class="fw-bold mb-2">Đã hoàn tiền</h5>
            <p class="mb-0 small">Số tiền {{ formatPrice(returnRequest.tongTienHoan) }} đã được hoàn vào ví của bạn trong vòng 24 giờ.</p>
          </div>
          <div v-else-if="returnRequest.trangThai === 'TU_CHOI'" class="text-danger mt-5 pt-3 border-top">
            <h5 class="fw-bold mb-2">Yêu cầu bị từ chối</h5>
            <p class="mb-0 small">Rất tiếc, yêu cầu hoàn trả của bạn đã bị từ chối sau khi kiểm tra.</p>
          </div>
          <div v-else class="text-primary mt-5 pt-3 border-top">
            <h5 class="fw-bold mb-2">Đang xử lý yêu cầu</h5>
            <p class="mb-0 small">Hệ thống đang xử lý yêu cầu hoàn tiền của bạn. Vui lòng đợi kết quả kiểm tra.</p>
          </div>
        </div>
      </div>

      <!-- Shop Info & Product List -->
      <div class="card border-0 shadow-sm rounded-4 mb-4 p-4">
        <div class="d-flex align-items-center mb-4 pb-3 border-bottom">
          <div class="shop-badge bg-danger text-white rounded-1 px-2 py-1 small fw-bold me-2">BeeSport</div>
          <button class="btn btn-light btn-sm rounded-pill px-3 fw-bold small">
            <i class="fas fa-store me-1"></i> Xem Shop
          </button>
        </div>

        <div v-for="item in returnRequest.chiTiets" :key="item.id" class="product-item mb-4 last-child-mb-0">
          <div class="d-flex align-items-start gap-3">
            <img :src="item.hoaDonChiTiet.sanPhamChiTiet.sanPham.hinhAnhs?.[0]?.url || 'https://placehold.co/80x100'" class="rounded-3 border" style="width: 80px; height: 100px; object-fit: cover;">
            <div class="flex-grow-1">
              <h6 class="fw-bold mb-1">{{ item.hoaDonChiTiet.tenSanPham }}</h6>
              <div class="text-secondary small mb-1">{{ item.hoaDonChiTiet.mauSac }}, {{ item.hoaDonChiTiet.kichThuoc }}</div>
              <div class="text-dark small">x {{ item.soLuongTra }}</div>
            </div>
            <div class="text-end fw-bold">{{ formatPrice(item.giaTriHoan) }}</div>
          </div>
        </div>
      </div>

      <!-- Refund Info Summary -->
      <div class="card border-0 shadow-sm rounded-4 mb-4 p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="text-secondary">Số tiền hoàn nhận được</div>
          <div class="fs-4 fw-bold text-danger">{{ formatPrice(returnRequest.tongTienHoan) }}</div>
        </div>
        <div class="d-flex justify-content-between align-items-center small mb-3">
          <div class="text-secondary">Hoàn tiền vào</div>
          <div class="text-dark">Ví điện tử / Tài khoản gốc</div>
        </div>
        <div class="text-center py-2 bg-light rounded-3 cursor-pointer">
          <span class="small fw-bold text-secondary">Xem Chi Tiết <i class="fas fa-chevron-down ms-1"></i></span>
        </div>
      </div>

      <!-- Return Reason & Images -->
      <div class="card border-0 shadow-sm rounded-4 p-4">
        <h6 class="fw-bold mb-4 border-bottom pb-3">Lý do: {{ returnRequest.lyDo }}</h6>
        
        <p class="text-secondary small mb-3">Hình ảnh minh chứng:</p>
        <div class="evidence-images d-flex gap-2 flex-wrap">
          <img 
            v-for="(url, idx) in parseImages(returnRequest.danhSachAnh)" 
            :key="idx" 
            :src="url" 
            class="rounded-3 border shadow-sm"
            style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
            @click="window.open(url, '_blank')"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transition-all { transition: all 0.3s ease; }
.last-child-mb-0:last-child { margin-bottom: 0 !important; }
.cursor-pointer { cursor: pointer; }

.return-detail-container {
  max-width: 900px;
  margin: 0 auto;
}

.step-circle {
  border-width: 2px !important;
}

.step-label {
  margin-top: 8px;
}

.product-item {
  position: relative;
}
</style>
