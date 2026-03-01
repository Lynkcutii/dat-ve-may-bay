<script setup>
import { ref, computed } from 'vue';

const paymentMethod = ref('cod');
const selectedVoucher = ref(null);

const checkoutItems = ref([
  { id: 1, name: 'Áo Thun Running Bee Pro 1', price: 450000, quantity: 1, image: 'https://placehold.co/60x80' },
  { id: 2, name: 'Áo Thun Running Bee Pro 2', price: 450000, quantity: 1, image: 'https://placehold.co/60x80' },
]);

const vouchers = ref([
  { id: 1, code: 'BEESPORT10', discount: 10, type: 'percent', minOrder: 500000 },
  { id: 2, code: 'GIAM50K', discount: 50000, type: 'fixed', minOrder: 300000 },
  { id: 3, code: 'XUAN2024', discount: 20, type: 'percent', minOrder: 1000000 },
]);

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const subTotal = computed(() => {
  return checkoutItems.value.reduce((acc, item) => acc + (item.price * item.quantity), 0);
});

const discountAmount = computed(() => {
  if (!selectedVoucher.value || subTotal.value < selectedVoucher.value.minOrder) return 0;
  
  if (selectedVoucher.value.type === 'percent') {
    return (subTotal.value * selectedVoucher.value.discount) / 100;
  } else {
    return selectedVoucher.value.discount;
  }
});

const shippingFee = ref(0);

const total = computed(() => {
  return Math.max(0, subTotal.value + shippingFee.value - discountAmount.value);
});

const selectVoucher = (voucher) => {
  if (subTotal.value < voucher.minOrder) {
    alert(`Đơn hàng tối thiểu ${formatPrice(voucher.minOrder)} để áp dụng mã này!`);
    return;
  }
  selectedVoucher.value = voucher;
};

const handlePlaceOrder = () => {
  alert('Đơn hàng của bạn đã được tiếp nhận!');
};
</script>

<template>
  <div class="container py-5">
    <h2 class="fw-bold mb-5">THANH TOÁN</h2>
    
    <div class="row g-5">
      <!-- Left Column: Info & Shipping -->
      <div class="col-lg-7">
        <!-- 1. Customer Info & Address -->
        <div class="bg-white rounded-4 shadow-sm p-4 mb-4">
          <h5 class="fw-bold mb-4 border-bottom pb-3"><i class="fas fa-shipping-fast me-2"></i> THÔNG TIN GIAO HÀNG</h5>
          <form class="row g-3">
            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Họ và tên</label>
              <input type="text" class="form-control border-0 bg-light rounded-3 px-3 py-2" value="Nguyễn Văn A">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Số điện thoại</label>
              <input type="tel" class="form-control border-0 bg-light rounded-3 px-3 py-2" value="0987654321">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Email</label>
              <input type="email" class="form-control border-0 bg-light rounded-3 px-3 py-2" value="nguyenvana@gmail.com">
            </div>
            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Địa chỉ cụ thể</label>
              <input type="text" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Số nhà, tên đường...">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Tỉnh / Thành</label>
              <select class="form-select border-0 bg-light rounded-3 px-3 py-2">
                <option selected>Hà Nội</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Quận / Huyện</label>
              <select class="form-select border-0 bg-light rounded-3 px-3 py-2">
                <option selected>Cầu Giấy</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Phường / Xã</label>
              <select class="form-select border-0 bg-light rounded-3 px-3 py-2">
                <option selected>Dịch Vọng Hậu</option>
              </select>
            </div>
            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Ghi chú (Tùy chọn)</label>
              <textarea class="form-control border-0 bg-light rounded-3 px-3 py-2" rows="3" placeholder="Lưu ý cho người giao hàng..."></textarea>
            </div>
          </form>
        </div>

        <!-- 2. Payment Methods -->
        <div class="bg-white rounded-4 shadow-sm p-4">
          <h5 class="fw-bold mb-4 border-bottom pb-3"><i class="fas fa-credit-card me-2"></i> PHƯƠNG THỨC THANH TOÁN</h5>
          <div class="payment-methods">
            <div class="form-check payment-option mb-3 p-3 rounded-3 border" :class="{ 'active': paymentMethod === 'cod' }">
              <input class="form-check-input ms-0 me-3" type="radio" name="payment" id="cod" value="cod" v-model="paymentMethod" checked>
              <label class="form-check-label d-flex align-items-center w-100" for="cod">
                <i class="fas fa-money-bill-wave fs-4 text-success me-3"></i>
                <div>
                  <div class="fw-bold">Thanh toán khi nhận hàng (COD)</div>
                  <div class="small text-secondary">Thanh toán bằng tiền mặt khi nhận hàng</div>
                </div>
              </label>
            </div>
            <div class="form-check payment-option mb-3 p-3 rounded-3 border" :class="{ 'active': paymentMethod === 'vnpay' }">
              <input class="form-check-input ms-0 me-3" type="radio" name="payment" id="vnpay" value="vnpay" v-model="paymentMethod">
              <label class="form-check-label d-flex align-items-center w-100" for="vnpay">
                <i class="fas fa-university fs-4 text-primary me-3"></i>
                <div>
                  <div class="fw-bold">Chuyển khoản Ngân hàng / VNPay</div>
                  <div class="small text-secondary">Thanh toán qua cổng VNPay hoặc chuyển khoản</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Order Summary -->
      <div class="col-lg-5">
        <div class="bg-white rounded-4 shadow-sm p-4 sticky-top" style="top: 100px;">
          <h5 class="fw-bold mb-4 border-bottom pb-3">ĐƠN HÀNG CỦA BẠN</h5>
          
          <!-- Order Items -->
          <div class="order-items mb-4">
            <div v-for="item in checkoutItems" :key="item.id" class="d-flex align-items-center mb-3">
              <div class="position-relative">
                <img :src="item.image" class="rounded-3 border" width="60" alt="Product">
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style="font-size: 10px;">{{ item.quantity }}</span>
              </div>
              <div class="ms-4 flex-grow-1">
                <h6 class="fw-bold mb-0 small">{{ item.name }}</h6>
                <p class="text-secondary small mb-0">Phân loại: L, Đen</p>
              </div>
              <div class="fw-bold small">{{ formatPrice(item.price * item.quantity) }}</div>
            </div>
          </div>

          <!-- Voucher Section -->
          <div class="mb-4">
            <label class="form-label small fw-bold text-uppercase">Mã giảm giá (Voucher)</label>
            <div class="dropdown">
              <button 
                class="btn btn-light w-100 rounded-3 text-start d-flex justify-content-between align-items-center border-0 bg-light px-3 py-2 shadow-none" 
                type="button" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span v-if="!selectedVoucher" class="text-secondary small">
                  <i class="fas fa-ticket-alt me-2"></i>Chọn voucher áp dụng...
                </span>
                <span v-else class="fw-bold small text-danger">
                  <i class="fas fa-ticket-alt me-2"></i>{{ selectedVoucher.code }} (-{{ selectedVoucher.type === 'percent' ? selectedVoucher.discount + '%' : formatPrice(selectedVoucher.discount) }})
                </span>
                <i class="fas fa-chevron-down small opacity-50"></i>
              </button>
              <ul class="dropdown-menu w-100 shadow-sm border-0 rounded-3 mt-1 p-2">
                <li v-for="v in vouchers" :key="v.id">
                  <a 
                    class="dropdown-item rounded-2 py-2 mb-1" 
                    href="#" 
                    @click.prevent="selectVoucher(v)"
                    :class="{ 'active bg-danger text-white': selectedVoucher?.id === v.id }"
                  >
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="fw-bold small">{{ v.code }}</span>
                      <span 
                        class="badge rounded-pill" 
                        :class="selectedVoucher?.id === v.id ? 'bg-white text-danger' : 'bg-danger-subtle text-danger'"
                        style="font-size: 10px;"
                      >
                        -{{ v.type === 'percent' ? v.discount + '%' : formatPrice(v.discount) }}
                      </span>
                    </div>
                    <div class="small opacity-75" style="font-size: 11px;">Đơn tối thiểu: {{ formatPrice(v.minOrder) }}</div>
                  </a>
                </li>
                <li v-if="selectedVoucher">
                  <hr class="dropdown-divider mx-2">
                  <a class="dropdown-item text-center small text-danger fw-bold rounded-2" href="#" @click.prevent="selectedVoucher = null">
                    Hủy chọn voucher
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Totals -->
          <div class="order-totals py-3 border-top border-bottom mb-4">
            <div class="d-flex justify-content-between mb-2 small">
              <span class="text-secondary">Tạm tính:</span>
              <span class="fw-bold">{{ formatPrice(subTotal) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2 small">
              <span class="text-secondary">Phí vận chuyển:</span>
              <span class="fw-bold">{{ shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee) }}</span>
            </div>
            <div class="d-flex justify-content-between small text-success" v-if="discountAmount > 0">
              <span>Giảm giá:</span>
              <span class="fw-bold">-{{ formatPrice(discountAmount) }}</span>
            </div>
          </div>

          <div class="d-flex justify-content-between mb-4">
            <span class="fw-bold text-uppercase fs-5">Tổng cộng:</span>
            <span class="fw-bold text-danger fs-4">{{ formatPrice(total) }}</span>
          </div>

          <button @click="handlePlaceOrder" class="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-lg">ĐẶT HÀNG NGAY</button>
          
          <router-link to="/cart" class="btn btn-link text-dark text-decoration-none mt-3 w-100 text-center small fw-bold p-0">
            <i class="fas fa-arrow-left me-2"></i> Quay lại giỏ hàng
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-control:focus, .form-select:focus {
  background-color: #eee;
  box-shadow: none;
}
.payment-option {
  cursor: pointer;
  transition: 0.3s;
}
.payment-option:hover {
  background-color: #f8f9fa;
}
.payment-option.active {
  border-color: #000 !important;
  background-color: #f8f9fa;
}
.payment-option input {
  cursor: pointer;
}
</style>
