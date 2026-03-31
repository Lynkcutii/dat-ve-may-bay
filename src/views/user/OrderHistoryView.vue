<template>
  <div class="container py-5">
    <div class="row g-4">
      <!-- Sidebar (Kế thừa từ Account) -->
      <div class="col-lg-3">
        <div class="bg-white rounded-4 shadow-sm p-3 p-md-4 h-100">
          <div class="text-center mb-4 pb-4 border-bottom d-none d-lg-block">
            <div class="avatar-placeholder bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-user fs-4 text-secondary"></i>
            </div>
            <h6 class="fw-bold mb-1 small">{{ user.hoTen }}</h6>
          </div>
          
          <div class="nav flex-lg-column nav-pills small flex-nowrap overflow-auto pb-2 pb-lg-0">
            <router-link to="/account" class="nav-link text-dark text-start rounded-3 mb-lg-2 me-2 me-lg-0 px-3 py-2 fw-bold text-nowrap">
              <i class="far fa-user me-2"></i> Thông tin tài khoản
            </router-link>
            <button class="nav-link active border-0 text-start rounded-3 mb-lg-2 me-2 me-lg-0 px-3 py-2 fw-bold shadow-none text-nowrap">
              <i class="fas fa-history me-2"></i> Lịch sử đơn hàng
            </button>
            <button class="nav-link text-dark text-start rounded-3 mb-lg-2 me-2 me-lg-0 px-3 py-2 fw-bold text-nowrap">
              <i class="fas fa-map-marker-alt me-2"></i> Sổ địa chỉ
            </button>
            <div class="d-none d-lg-block"><hr></div>
            <button @click="handleLogout" class="nav-link text-danger text-start rounded-3 px-3 py-2 fw-bold text-nowrap">
              <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="col-lg-9">
        <div class="bg-white rounded-4 shadow-sm p-4 p-md-5">
          <h4 class="fw-bold mb-4">Lịch Sử Đơn Hàng</h4>

          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-danger" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <template v-else>
            <!-- Filter Tabs -->
            <div class="d-flex gap-3 mb-4 overflow-auto pb-2 border-bottom">
              <button 
                v-for="tab in tabs" 
                :key="tab.value"
                @click="activeTab = tab.value"
                :class="['btn btn-sm fw-bold border-0 rounded-0 px-3', activeTab === tab.value ? 'text-danger border-bottom border-2 border-danger' : 'text-secondary']"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Order List -->
            <div class="order-list">
              <div v-for="order in filteredOrders" :key="order.id" class="order-item border rounded-4 p-3 mb-4 p-md-4">
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom flex-wrap gap-2">
                  <span class="fw-bold small">Mã đơn: <span class="text-danger">#{{ order.maHoaDon }}</span></span>
                  <span :class="['badge small px-3 py-2 border', getStatusClass(order.trangThaiDon)]">
                    {{ formatStatus(order.trangThaiDon) }}
                  </span>
                </div>
                
                <div class="d-flex justify-content-between align-items-center pt-3 flex-wrap gap-3">
                  <div>
                    <p class="mb-1 small">Ngày đặt: {{ formatDate(order.ngayTao) }}</p>
                    <p class="mb-0 small fw-bold">Tổng thanh toán: <span class="text-danger fs-5">{{ formatPrice(order.tongThanhToan) }}</span></p>
                  </div>
                  <div class="d-flex gap-2">
                    <button @click="viewDetail(order.id)" class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold">CHI TIẾT</button>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="filteredOrders.length === 0" class="text-center py-5">
                <i class="fas fa-box-open fs-1 text-light mb-3"></i>
                <p class="text-secondary">Không tìm thấy đơn hàng nào trong mục này.</p>
                <router-link to="/products" class="btn btn-danger btn-sm rounded-pill px-4">MUA SẮM NGAY</router-link>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { API_BASE_URL } from '@/config';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const activeTab = ref('ALL');
const orders = ref([]);
const loading = ref(true);

const user = authStore.currentUser || { hoTen: 'Khách' };

onMounted(() => {
  fetchOrders();
  if (route.query.payment === 'success') {
    alert('Thanh toán thành công!');
    cartStore.clearSelected();
  } else if (route.query.payment === 'failed') {
    alert('Thanh toán thất bại hoặc đã bị hủy.');
  }
});

const handleLogout = () => {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    authStore.logout();
    router.push('/login');
  }
};

const tabs = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đã đặt', value: 'DA_DAT' },
  { label: 'Chờ xác nhận', value: 'CHO_XAC_NHAN' },
  { label: 'Đã xác nhận', value: 'DA_XAC_NHAN' },
  { label: 'Đang giao', value: 'DANG_GIAO' },
  { label: 'Đã giao', value: 'DA_GIAO' },
  { label: 'Đã hủy', value: 'DA_HUY' },
  { label: 'Hoàn trả', value: 'HOAN_TRA' }
];

const fetchOrders = async () => {
  if (!cartStore.userId) {
    orders.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/orders/${cartStore.userId}`);
    // Sắp xếp đơn hàng mới nhất lên đầu (dựa vào id hoặc ngayTao)
    orders.value = res.data.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error("Error fetching orders:", error);
  } finally {
    loading.value = false;
  }
};

const filteredOrders = computed(() => {
  if (activeTab.value === 'ALL') return orders.value;
  return orders.value.filter(order => order.trangThaiDon === activeTab.value);
});

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
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

const viewDetail = (orderId) => {
  router.push(`/order/${orderId}`);
};
</script>

<style scoped>
.order-item { transition: 0.3s; }
.order-item:hover { border-color: #000 !important; }
.nav-pills .nav-link.active {
  background-color: #000;
  color: #fff !important;
}
</style>
