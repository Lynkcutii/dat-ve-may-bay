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
            <h6 class="fw-bold mb-1 small">Nguyễn Văn A</h6>
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
            <button class="nav-link text-danger text-start rounded-3 px-3 py-2 fw-bold text-nowrap">
              <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="col-lg-9">
        <div class="bg-white rounded-4 shadow-sm p-4 p-md-5">
          <h4 class="fw-bold mb-4">Lịch Sử Đơn Hàng</h4>

          <!-- Filter Tabs -->
          <div class="d-flex gap-3 mb-4 overflow-auto pb-2 border-bottom">
            <button 
              v-for="tab in ['Tất cả', 'Chờ xác nhận', 'Đang giao', 'Đã giao']" 
              :key="tab"
              @click="activeTab = tab"
              :class="['btn btn-sm fw-bold border-0 rounded-0 px-3', activeTab === tab ? 'text-danger border-bottom border-2 border-danger' : 'text-secondary']"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Order List -->
          <div class="order-list">
            <div v-for="order in filteredOrders" :key="order.id" class="order-item border rounded-4 p-3 mb-4 p-md-4">
              <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom flex-wrap gap-2">
                <span class="fw-bold small">Mã đơn: <span class="text-danger">#{{ order.id }}</span></span>
                <span :class="['badge small px-3 py-2 border', order.status === 'ĐÃ GIAO' ? 'bg-light text-success border-success' : 'bg-light text-primary border-primary']">
                  {{ order.status }}
                </span>
              </div>
              
              <div v-for="(item, index) in order.items" :key="index" class="d-flex gap-3 mb-3">
                <img :src="item.image" class="rounded-3" :alt="item.name" style="width: 80px; height: 100px; object-fit: cover;">
                <div class="flex-grow-1">
                  <h6 class="fw-bold mb-1 small">{{ item.name }}</h6>
                  <p class="text-secondary mb-0" style="font-size: 11px;">SIZE: {{ item.size }} | MÀU: {{ item.color }}</p>
                  <p class="mb-0 fw-bold small">x{{ item.quantity }} <span class="ms-4">{{ item.price.toLocaleString() }}đ</span></p>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center pt-3 border-top flex-wrap gap-3">
                <p class="mb-0 small fw-bold">Tổng tiền: <span class="text-danger fs-5">{{ order.total.toLocaleString() }}đ</span></p>
                <div class="d-flex gap-2">
                  <button @click="viewDetail(order.id)" class="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold">CHI TIẾT</button>
                  <button @click="reorder(order)" class="btn btn-dark btn-sm rounded-pill px-4 fw-bold">MUA LẠI</button>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activeTab = ref('Tất cả');

const orders = ref([
  {
    id: 'BS12341',
    status: 'ĐÃ GIAO',
    items: [
      { name: 'Áo Thun Running Bee Pro 2024', size: 'XL', color: 'ĐEN', quantity: 1, price: 450000, image: 'https://placehold.co/80x100' }
    ],
    total: 450000
  },
  {
    id: 'BS12342',
    status: 'ĐÃ GIAO',
    items: [
      { name: 'Áo Thun Running Bee Pro 2024', size: 'XL', color: 'ĐEN', quantity: 1, price: 450000, image: 'https://placehold.co/80x100' }
    ],
    total: 450000
  },
  {
    id: 'BS12343',
    status: 'ĐANG GIAO',
    items: [
      { name: 'Giày Chạy Bộ Bee Speed', size: '42', color: 'TRẮNG', quantity: 1, price: 1250000, image: 'https://placehold.co/80x100' }
    ],
    total: 1250000
  }
]);

const filteredOrders = computed(() => {
  if (activeTab.value === 'Tất cả') return orders.value;
  return orders.value.filter(order => order.status.toLowerCase() === activeTab.value.toLowerCase());
});

const viewDetail = (orderId) => {
  router.push(`/order/${orderId}`);
};

const reorder = (order) => {
  alert(`Đã thêm sản phẩm từ đơn hàng ${order.id} vào giỏ hàng!`);
  router.push('/cart');
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
