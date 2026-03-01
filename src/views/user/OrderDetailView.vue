<template>
  <div class="container py-5">
    <div class="row g-4">
      <!-- Sidebar (Kế thừa từ Account) -->
      <div class="col-lg-3">
        <div class="bg-white rounded-4 shadow-sm p-4 h-100">
          <div class="text-center mb-4 pb-4 border-bottom">
            <div class="avatar-placeholder bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
              <i class="fas fa-user fs-4 text-secondary"></i>
            </div>
            <h6 class="fw-bold mb-1 small">Nguyễn Văn A</h6>
          </div>
          
          <div class="nav flex-column nav-pills small">
            <router-link to="/account" class="nav-link text-dark text-start rounded-3 mb-2 px-3 py-2 fw-bold">
              <i class="far fa-user me-2"></i> Thông tin tài khoản
            </router-link>
            <router-link to="/orders" class="nav-link active border-0 text-start rounded-3 mb-2 px-3 py-2 fw-bold shadow-none">
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
              <button @click="router.push('/orders')" class="btn btn-outline-dark btn-sm rounded-circle me-3" style="width: 32px; height: 32px; padding: 0;">
                <i class="fas fa-arrow-left small"></i>
              </button>
              <h4 class="fw-bold mb-0">Chi Tiết Đơn Hàng <span class="text-danger">#{{ order.id }}</span></h4>
            </div>
            <span :class="['badge px-3 py-2 border rounded-pill small', order.status === 'ĐÃ GIAO' ? 'bg-light text-success border-success' : 'bg-light text-primary border-primary']">
              {{ order.status }}
            </span>
          </div>

          <!-- Order Progress -->
          <div class="order-progress mb-5 py-4 border-bottom">
            <div class="d-flex justify-content-between position-relative">
              <div class="progress-line position-absolute w-100 top-50 translate-middle-y bg-light" style="height: 2px; z-index: 0;"></div>
              <div class="progress-line-active position-absolute top-50 translate-middle-y bg-success" :style="{ height: '2px', zIndex: 1, width: order.status === 'ĐÃ GIAO' ? '100%' : '66%' }"></div>
              
              <div v-for="(step, index) in steps" :key="index" class="step-item text-center position-relative" style="z-index: 2; width: 80px;">
                <div :class="['step-icon mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2', step.completed ? 'bg-success text-white' : 'bg-light text-secondary']" style="width: 32px; height: 32px;">
                  <i :class="step.icon + ' small'"></i>
                </div>
                <span :class="['fw-bold small d-block', step.completed ? 'text-dark' : 'text-secondary']" style="font-size: 10px;">{{ step.label }}</span>
                <span class="text-secondary" style="font-size: 9px;">{{ step.time }}</span>
              </div>
            </div>
          </div>

          <!-- Info Sections -->
          <div class="row g-4 mb-5">
            <div class="col-md-6">
              <h6 class="fw-bold mb-3 small text-uppercase letter-spacing-1">Địa Chỉ Nhận Hàng</h6>
              <div class="p-3 bg-light rounded-3">
                <p class="fw-bold mb-1 small">Nguyễn Văn A</p>
                <p class="text-secondary mb-1 small">0987 654 321</p>
                <p class="text-secondary mb-0 small">Số 123, Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="fw-bold mb-3 small text-uppercase letter-spacing-1">Hình Thức Thanh Toán</h6>
              <div class="p-3 bg-light rounded-3">
                <p class="text-secondary mb-1 small">Thanh toán khi nhận hàng (COD)</p>
                <p class="text-success fw-bold mb-0 small"><i class="fas fa-check-circle me-1"></i> Đã hoàn thành</p>
              </div>
            </div>
          </div>

          <!-- Product Table -->
          <div class="table-responsive mb-4">
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
                <tr v-for="(item, index) in order.items" :key="index">
                  <td class="ps-3 py-3">
                    <div class="d-flex align-items-center">
                      <img :src="item.image" class="rounded-3 me-3" style="width: 60px; height: 75px; object-fit: cover;">
                      <div>
                        <h6 class="fw-bold mb-1 small">{{ item.name }}</h6>
                        <p class="text-secondary mb-0" style="font-size: 11px;">SIZE: {{ item.size }} | MÀU: {{ item.color }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="text-center fw-bold small">{{ item.price.toLocaleString() }}đ</td>
                  <td class="text-center small">x{{ item.quantity }}</td>
                  <td class="text-end pe-3 fw-bold text-danger small">{{ (item.price * item.quantity).toLocaleString() }}đ</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div class="row justify-content-end">
            <div class="col-md-5">
              <div class="d-flex justify-content-between mb-2 small">
                <span class="text-secondary">Tạm tính:</span>
                <span class="fw-bold">{{ order.total.toLocaleString() }}đ</span>
              </div>
              <div class="d-flex justify-content-between mb-2 small">
                <span class="text-secondary">Phí vận chuyển:</span>
                <span class="fw-bold">Miễn phí</span>
              </div>
              <div class="d-flex justify-content-between mb-3 small">
                <span class="text-secondary">Giảm giá:</span>
                <span class="fw-bold text-success">-0đ</span>
              </div>
              <hr>
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold text-uppercase">Tổng cộng:</span>
                <span class="fw-bold text-danger fs-4">{{ order.total.toLocaleString() }}đ</span>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-4 border-top text-end">
            <button @click="reorder" class="btn btn-dark rounded-pill px-5 py-2 fw-bold small">MUA LẠI ĐƠN HÀNG</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const order = ref({
  id: route.params.id || 'BS12341',
  status: 'ĐÃ GIAO',
  items: [
    { name: 'Áo Thun Running Bee Pro 2024', size: 'XL', color: 'ĐEN', quantity: 1, price: 450000, image: 'https://placehold.co/80x100' }
  ],
  total: 450000
});

const steps = ref([
  { label: 'Đơn hàng đã đặt', icon: 'fas fa-receipt', time: '10:30, 20/01/2024', completed: true },
  { label: 'Đã xác nhận', icon: 'fas fa-check-circle', time: '11:00, 20/01/2024', completed: true },
  { label: 'Đang giao hàng', icon: 'fas fa-truck', time: '14:30, 21/01/2024', completed: true },
  { label: 'Đã giao thành công', icon: 'fas fa-box-open', time: '09:15, 23/01/2024', completed: true }
]);

onMounted(() => {
  // Logic to fetch order by ID would go here
  if (order.value.id === 'BS12343') {
    order.value.status = 'ĐANG GIAO';
    steps.value[3].completed = false;
    steps.value[3].time = 'Dự kiến: 25/01/2024';
  }
});

const reorder = () => {
  alert(`Đã thêm sản phẩm từ đơn hàng ${order.value.id} vào giỏ hàng!`);
  router.push('/cart');
};
</script>

<style scoped>
.letter-spacing-1 { letter-spacing: 1px; }
.nav-pills .nav-link.active {
  background-color: #000;
  color: #fff !important;
}
.border-dashed { border-style: dashed !important; }
</style>
