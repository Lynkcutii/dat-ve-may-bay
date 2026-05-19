<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { API_BASE_URL } from '@/config';
import returnApi from '@/api/returnApi';
import RefundBreakdown from '@/components/RefundBreakdown.vue';
import KhangNghiModal from '@/components/user/KhangNghiModal.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();

const order = ref(null);
const orderDetails = ref([]);
const returnRequest = ref(null);
const loading = ref(true);
const showKhangNghiModal = ref(false);
const authStore = useAuthStore();

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
      const returns = Array.isArray(res.data.returns) ? [...res.data.returns] : [];
      if (returns.length > 0) {
        const latest = returns.sort((a, b) => b.id - a.id)[0];
        const detail = await returnApi.userDetail(authStore.currentUser?.id, latest.id);
        returnRequest.value = detail.data;
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

const canKhangNghi = computed(() => {
  const st = returnRequest.value?.trangThai;
  if (!st) return false;
  return ['HOAN_THANH', 'TU_CHOI'].includes(st) && returnRequest.value?.daKhangNghi !== true;
});

const handleKhangNghiSaved = async () => {
  showKhangNghiModal.value = false;
  ElMessage.success('Đã gửi kháng nghị, đang chờ admin xem xét');
  await fetchReturnDetail();
};

const openOrderMoi = (id) => {
  if (!id) return;
  router.push(`/order/${id}`);
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
          <div
            v-if="returnRequest.trangThai === 'HOAN_THANH' && returnRequest.trangThaiThanhToan === 'DA_THANH_TOAN'"
            class="text-success mt-5 pt-3 border-top"
          >
            <h5 class="fw-bold mb-2">Đã hoàn tiền thành công</h5>
            <p class="mb-0 small">Số tiền {{ formatPrice(returnRequest.tongTienHoan) }} đã được hoàn cho bạn.</p>
          </div>
          <div
            v-else-if="returnRequest.trangThai === 'HOAN_THANH' && returnRequest.trangThaiThanhToan === 'DA_XAC_NHAN_NHAN'"
            class="text-success mt-5 pt-3 border-top"
          >
            <h5 class="fw-bold mb-2">Bạn đã xác nhận nhận tiền</h5>
            <p class="mb-0 small">Yêu cầu hoàn trả đã hoàn tất toàn bộ.</p>
          </div>
          <div
            v-else-if="returnRequest.trangThai === 'HOAN_THANH' && returnRequest.trangThaiThanhToan === 'KHONG_CAN_THANH_TOAN'"
            class="text-primary mt-5 pt-3 border-top"
          >
            <h5 class="fw-bold mb-2">Đổi hàng hoàn tất</h5>
            <p class="mb-0 small">Yêu cầu không phát sinh hoàn tiền bổ sung.</p>
          </div>
          <div
            v-else-if="returnRequest.trangThai === 'HOAN_THANH'"
            class="text-warning mt-5 pt-3 border-top"
          >
            <h5 class="fw-bold mb-2">Yêu cầu đã được duyệt, đang xử lý hoàn tiền</h5>
            <p class="mb-0 small">Hệ thống đang thực hiện hoàn tiền cho bạn.</p>
          </div>
          <div v-else-if="returnRequest.trangThai === 'TU_CHOI'" class="text-danger mt-5 pt-3 border-top">
            <h5 class="fw-bold mb-2">Yêu cầu bị từ chối</h5>
            <p class="mb-0 small">Rất tiếc, yêu cầu hoàn trả của bạn đã bị từ chối sau khi kiểm tra.</p>
            <p v-if="returnRequest.lyDoTuChoi" class="mb-0 small mt-2"><strong>Lý do:</strong> {{ returnRequest.lyDoTuChoi }}</p>
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
        <RefundBreakdown
          v-if="['DA_NHAN_HANG_KIEM_TRA','HOAN_THANH','KHANG_NGHI'].includes(returnRequest.trangThai)"
          :doiTra="returnRequest"
          class="mb-3"
        />

        <div class="d-flex justify-content-between align-items-center small mb-2">
          <div class="text-secondary">Phương thức hoàn</div>
          <div class="text-dark fw-bold">{{ returnRequest.phuongThucHoan || 'Chưa cập nhật' }}</div>
        </div>
        <div class="d-flex justify-content-between align-items-center small mb-2">
          <div class="text-secondary">Mã giao dịch hoàn</div>
          <div class="text-dark fw-bold">{{ returnRequest.maGiaoDichHoan || 'Chưa cập nhật' }}</div>
        </div>

        <div class="d-flex gap-2 flex-wrap mt-2" v-if="parseImages(returnRequest.anhChungTu).length">
          <img
            v-for="(url, idx) in parseImages(returnRequest.anhChungTu)"
            :key="`ct-${idx}`"
            :src="url"
            class="rounded-3 border shadow-sm"
            style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
            @click="window.open(url, '_blank')"
          >
        </div>

        <div v-if="returnRequest.hoaDonMoi" class="mt-3 p-3 border rounded-3 bg-light">
          <div class="fw-bold mb-2">Đơn đổi hàng mới</div>
          <div class="small mb-1">Mã đơn: <strong>{{ returnRequest.hoaDonMoi.maHoaDon }}</strong></div>
          <div class="small mb-1">Trạng thái: <strong>{{ returnRequest.hoaDonMoi.trangThaiDon }}</strong></div>
          <div class="small mb-2">Tổng tiền: <strong>{{ formatPrice(returnRequest.hoaDonMoi.tongThanhToan || 0) }}</strong></div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-outline-dark btn-sm rounded-pill" @click="openOrderMoi(returnRequest.hoaDonMoi.id)">Xem đơn mới</button>
            <button
              v-if="returnRequest.vnpayUrlThanhToanDonMoi && returnRequest.hoaDonMoi.trangThaiDon === 'CHO_THANH_TOAN'"
              class="btn btn-primary btn-sm rounded-pill"
              @click="window.location.href = returnRequest.vnpayUrlThanhToanDonMoi"
            >
              Thanh toán đơn đổi
            </button>
          </div>
        </div>

        <div class="mt-3" v-if="canKhangNghi">
          <button class="btn btn-outline-danger rounded-pill" @click="showKhangNghiModal = true">
            <i class="fas fa-gavel me-1"></i>Kháng nghị
          </button>
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

    <KhangNghiModal
      :show="showKhangNghiModal"
      :doiTraId="returnRequest?.id"
      @close="showKhangNghiModal = false"
      @saved="handleKhangNghiSaved"
    />
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
