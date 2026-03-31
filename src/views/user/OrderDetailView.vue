<template>
  <div class="container py-5">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="!order" class="text-center py-5">
      <p>Không tìm thấy đơn hàng.</p>
      <router-link to="/order-history" class="btn btn-dark rounded-pill">Quay lại danh sách</router-link>
    </div>
    <div v-else class="row g-4">
      <!-- Sidebar (Kế thừa từ Account) -->
      <div class="col-lg-3">
        <div class="bg-white rounded-4 shadow-sm p-4 h-100">
          <div class="text-center mb-4 pb-4 border-bottom">
            <div class="avatar-placeholder bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-user fs-4 text-secondary"></i>
            </div>
            <h6 class="fw-bold mb-1 small">{{ order.nguoiDung.hoTen }}</h6>
          </div>
          
          <div class="nav flex-column nav-pills small">
            <router-link to="/account" class="nav-link text-dark text-start rounded-3 mb-2 px-3 py-2 fw-bold">
              <i class="far fa-user me-2"></i> Thông tin tài khoản
            </router-link>
            <router-link to="/order-history" class="nav-link active border-0 text-start rounded-3 mb-2 px-3 py-2 fw-bold shadow-none">
              <i class="fas fa-history me-2"></i> Lịch sử đơn hàng
            </router-link>
            <button class="nav-link text-dark text-start rounded-3 mb-2 px-3 py-2 fw-bold">
              <i class="fas fa-map-marker-alt me-2"></i> Sổ địa chỉ
            </button>
            <hr>
            <button class="nav-link text-danger text-start rounded-3 px-3 py-2 fw-bold">
              <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="col-lg-9">
        <div class="bg-white rounded-4 shadow-sm p-4 p-md-5">
          <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <div class="d-flex align-items-center">
              <button @click="router.push('/order-history')" class="btn btn-outline-dark btn-sm rounded-circle me-3" style="width: 32px; height: 32px; padding: 0;">
                <i class="fas fa-arrow-left small"></i>
              </button>
              <h4 class="fw-bold mb-0">Chi Tiết Đơn Hàng <span class="text-danger">#{{ order.maHoaDon }}</span></h4>
            </div>
            <span :class="['badge px-3 py-2 border rounded-pill small', getStatusClass(order.trangThaiDon)]">
              {{ formatStatus(order.trangThaiDon) }}
            </span>
          </div>

          <!-- Order Progress -->
          <div class="order-progress mb-5 py-4 border-bottom" v-if="order.trangThaiDon !== 'DA_HUY' && order.trangThaiDon !== 'HOAN_TRA'">
            <div class="d-flex justify-content-between position-relative">
              <div class="progress-line position-absolute w-100 top-50 translate-middle-y bg-light" style="height: 2px; z-index: 0;"></div>
              <div class="progress-line-active position-absolute top-50 translate-middle-y bg-success" :style="{ height: '2px', zIndex: 1, width: getProgressWidth(order.trangThaiDon) }"></div>
              
              <div v-for="(step, index) in steps" :key="index" class="step-item text-center position-relative" style="z-index: 2; width: 80px;">
                <div :class="['step-icon mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2', isStepCompleted(order.trangThaiDon, step.value) ? 'bg-success text-white' : 'bg-light text-secondary']" style="width: 32px; height: 32px;">
                  <i :class="step.icon + ' small'"></i>
                </div>
                <span :class="['fw-bold small d-block', isStepCompleted(order.trangThaiDon, step.value) ? 'text-dark' : 'text-secondary']" style="font-size: 10px;">{{ step.label }}</span>
              </div>
            </div>
          </div>

          <!-- Cancellation Message -->
          <div v-if="order.trangThaiDon === 'DA_HUY'" class="alert alert-danger rounded-4 p-4 mb-5 border-0">
            <div class="d-flex align-items-center">
              <i class="fas fa-times-circle fs-2 me-3"></i>
              <div>
                <h6 class="fw-bold mb-1">Đơn hàng đã bị hủy</h6>
                <p class="mb-0 small">Đơn hàng này đã bị hủy và không còn hiệu lực.</p>
              </div>
            </div>
          </div>

          <!-- Return Message -->
          <div v-if="order.trangThaiDon === 'HOAN_TRA'" class="alert alert-warning rounded-4 p-4 mb-5 border-0">
            <div class="d-flex align-items-center">
              <i class="fas fa-undo-alt fs-2 me-3"></i>
              <div>
                <h6 class="fw-bold mb-1">Đơn hàng đã được hoàn trả</h6>
                <p class="mb-0 small">Sản phẩm đã được hoàn trả thành công.</p>
              </div>
            </div>
          </div>

          <!-- Info Sections -->
          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <h6 class="fw-bold mb-3 small text-uppercase letter-spacing-1">Địa Chỉ Nhận Hàng</h6>
              <div class="p-3 bg-light rounded-3">
                <p class="fw-bold mb-1 small">{{ order.tenNguoiNhan }}</p>
                <p class="text-secondary mb-1 small">{{ order.soDienThoai }}</p>
                <p class="text-secondary mb-0 small">{{ order.diaChiChiTiet }}, {{ order.xa }}, {{ order.huyen }}, {{ order.tinh }}</p>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="fw-bold mb-3 small text-uppercase letter-spacing-1">Hình Thức Thanh Toán</h6>
              <div class="p-3 bg-light rounded-3">
                <p class="text-secondary mb-1 small">Thanh toán khi nhận hàng (COD)</p>
                <p class="text-success fw-bold mb-0 small"><i class="fas fa-check-circle me-1"></i> {{ order.trangThaiDon === 'DA_GIAO' ? 'Đã thanh toán' : 'Chưa thanh toán' }}</p>
              </div>
            </div>
          </div>

          <!-- Product Table -->
          <div class="table-responsive mb-4" v-if="orderDetails">
            <table class="table align-middle border-bottom">
              <thead class="bg-light small">
                <tr>
                  <th class="ps-3 border-0 py-3">SẢN PHẨM</th>
                  <th class="text-center border-0 py-3">GIÁ</th>
                  <th class="text-center border-0 py-3">SỐ LƯỢNG</th>
                  <th class="text-end pe-3 border-0 py-3">TỔNG CỘNG</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in orderDetails" :key="item.id">
                  <td class="ps-3 py-3">
                    <div class="d-flex align-items-center">
                      <img :src="item.sanPhamChiTiet.sanPham.hinhAnhs?.[0]?.url || 'https://placehold.co/60x80'" class="rounded-3 me-3" style="width: 60px; height: 75px; object-fit: cover;">
                      <div>
                        <h6 class="fw-bold mb-1 small">{{ item.tenSanPham }}</h6>
                        <p class="text-secondary mb-0" style="font-size: 11px;">SIZE: {{ item.kichThuoc }} | MÀU: {{ item.mauSac }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="text-center fw-bold small">{{ formatPrice(item.donGia) }}</td>
                  <td class="text-center small">x{{ item.soLuong }}</td>
                  <td class="text-end pe-3 fw-bold text-danger small">{{ formatPrice(item.thanhTien) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div class="row justify-content-end">
            <div class="col-md-5">
              <div class="d-flex justify-content-between mb-2 small">
                <span class="text-secondary">Tạm tính:</span>
                <span class="fw-bold">{{ formatPrice(order.tongTienHang) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2 small">
                <span class="text-secondary">Phí vận chuyển:</span>
                <span class="fw-bold">{{ formatPrice(order.phiVanChuyen) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-3 small" v-if="order.tienGiam > 0">
                <span class="text-secondary">Giảm giá:</span>
                <span class="fw-bold text-success">-{{ formatPrice(order.tienGiam) }}</span>
              </div>
              <hr>
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold text-uppercase">Tổng cộng:</span>
                <span class="fw-bold text-danger fs-4">{{ formatPrice(order.tongThanhToan) }}</span>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-4 border-top text-end d-flex justify-content-end gap-3">
            <button v-if="order.trangThaiDon === 'DA_DAT' || order.trangThaiDon === 'CHO_XAC_NHAN'" @click="handleCancelOrder" class="btn btn-outline-danger rounded-pill px-5 py-2 fw-bold small">HỦY ĐƠN HÀNG</button>
            <button v-if="order.trangThaiDon === 'DA_GIAO'" @click="reorder" class="btn btn-dark rounded-pill px-5 py-2 fw-bold small">MUA LẠI ĐƠN HÀNG</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const route = useRoute();
const router = useRouter();

const order = ref(null);
const orderDetails = ref([]);
const loading = ref(true);

const steps = [
  { label: 'Đã đặt', value: 'DA_DAT', icon: 'fas fa-receipt' },
  { label: 'Chờ xác nhận', value: 'CHO_XAC_NHAN', icon: 'fas fa-clock' },
  { label: 'Đã xác nhận', value: 'DA_XAC_NHAN', icon: 'fas fa-check-circle' },
  { label: 'Đang giao', value: 'DANG_GIAO', icon: 'fas fa-truck' },
  { label: 'Đã giao', value: 'DA_GIAO', icon: 'fas fa-box-open' }
];

const fetchOrder = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/order/${route.params.id}`);
    if (res.data) {
      order.value = res.data.bill;
      orderDetails.value = res.data.items;
    }
  } catch (error) {
    console.error("Error fetching order:", error);
  } finally {
    loading.value = false;
  }
};

const handleCancelOrder = async () => {
  if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
    try {
      await axios.post(`${API_BASE_URL}/api/user/order/${order.value.id}/cancel`);
      alert("Đã hủy đơn hàng thành công");
      fetchOrder();
    } catch (error) {
      alert(error.response?.data || "Hủy đơn hàng thất bại");
    }
  }
};

onMounted(fetchOrder);

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatStatus = (status) => {
  const map = {
    'DA_DAT': 'Đã đặt',
    'CHO_XAC_NHAN': 'Chờ xác nhận',
    'DA_XAC_NHAN': 'Đã xác nhận',
    'DANG_GIAO': 'Đang giao',
    'DA_GIAO': 'Đã giao',
    'DA_HUY': 'Đã hủy',
    'HOAN_TRA': 'Hoàn trả'
  };
  return map[status] || status;
};

const getStatusClass = (status) => {
  if (status === 'DA_GIAO') return 'bg-light text-success border-success';
  if (status === 'DA_HUY') return 'bg-light text-danger border-danger';
  return 'bg-light text-primary border-primary';
};

const getProgressWidth = (status) => {
  const statusOrder = ['DA_DAT', 'CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO'];
  const index = statusOrder.indexOf(status);
  if (index === -1) return '0%';
  return (index / (statusOrder.length - 1)) * 100 + '%';
};

const isStepCompleted = (currentStatus, stepValue) => {
  const statusOrder = ['DA_DAT', 'CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(stepValue);
  return stepIndex <= currentIndex && currentIndex !== -1;
};

const reorder = () => {
  router.push('/cart');
};
</script>

<style scoped>
.letter-spacing-1 { letter-spacing: 1px; }
.nav-pills .nav-link.active {
  background-color: #000;
  color: #fff !important;
}
</style>
