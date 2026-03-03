<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

const paymentMethod = ref('cod');
const selectedVoucher = ref(null);
const vouchers = ref([]);
const loading = ref(false);

const orderInfo = ref({
  tenNguoiNhan: authStore.currentUser?.hoTen || '',
  soDienThoai: authStore.currentUser?.soDienThoai || '',
  email: authStore.currentUser?.email || '',
  tinh: '',
  huyen: '',
  xa: '',
  diaChiChiTiet: '',
  ghiChu: ''
});

onMounted(async () => {
  if (cartStore.selectedItemIds.length === 0) {
    router.push('/cart');
    return;
  }
  await fetchVouchers();
});

const fetchVouchers = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/user/vouchers');
    vouchers.value = res.data;
  } catch (error) {
    console.error("Error fetching vouchers:", error);
  }
};

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const subTotal = computed(() => cartStore.selectedTotalPrice);

const discountAmount = computed(() => {
  if (!selectedVoucher.value || subTotal.value < selectedVoucher.value.giaTriToiThieu) return 0;
  
  if (selectedVoucher.value.kieuGiamGia === 'PERCENT') {
    let amount = (subTotal.value * selectedVoucher.value.giaTriGiam) / 100;
    if (selectedVoucher.value.giaTriGiamToiDa && amount > selectedVoucher.value.giaTriGiamToiDa) {
      amount = selectedVoucher.value.giaTriGiamToiDa;
    }
    return amount;
  } else {
    return selectedVoucher.value.giaTriGiam;
  }
});

const shippingFee = ref(0);

const total = computed(() => {
  return Math.max(0, subTotal.value + shippingFee.value - discountAmount.value);
});

const selectVoucher = (voucher) => {
  if (subTotal.value < voucher.giaTriToiThieu) {
    alert(`Đơn hàng tối thiểu ${formatPrice(voucher.giaTriToiThieu)} để áp dụng mã này!`);
    return;
  }
  selectedVoucher.value = voucher;
};

const handlePlaceOrder = async () => {
  // Validation
  if (!orderInfo.value.tenNguoiNhan || !orderInfo.value.soDienThoai || !orderInfo.value.tinh || !orderInfo.value.huyen || !orderInfo.value.xa || !orderInfo.value.diaChiChiTiet) {
    alert("Vui lòng điền đầy đủ thông tin giao hàng!");
    return;
  }

  loading.value = true;
  try {
    const request = {
      userId: cartStore.userId,
      cartItemIds: cartStore.selectedItemIds,
      voucherId: selectedVoucher.value?.id,
      tenNguoiNhan: orderInfo.value.tenNguoiNhan,
      soDienThoai: orderInfo.value.soDienThoai,
      tinh: orderInfo.value.tinh,
      huyen: orderInfo.value.huyen,
      xa: orderInfo.value.xa,
      diaChiChiTiet: orderInfo.value.diaChiChiTiet,
      ghiChu: orderInfo.value.ghiChu
    };

    const res = await axios.post('http://localhost:8080/api/user/order/create', request);
    alert('Đơn hàng của bạn đã được tiếp nhận!');
    cartStore.selectedItemIds = []; // Clear selected items
    router.push('/order-history');
  } catch (error) {
    console.error("Error placing order:", error);
    alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
  } finally {
    loading.value = false;
  }
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
              <input type="text" v-model="orderInfo.tenNguoiNhan" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Nhập họ tên người nhận">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Số điện thoại</label>
              <input type="tel" v-model="orderInfo.soDienThoai" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Nhập số điện thoại">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Email</label>
              <input type="email" v-model="orderInfo.email" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Nhập email">
            </div>
            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Địa chỉ cụ thể</label>
              <input type="text" v-model="orderInfo.diaChiChiTiet" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Số nhà, tên đường...">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Tỉnh / Thành</label>
              <input type="text" v-model="orderInfo.tinh" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Tỉnh/Thành">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Quận / Huyện</label>
              <input type="text" v-model="orderInfo.huyen" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Quận/Huyện">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Phường / Xã</label>
              <input type="text" v-model="orderInfo.xa" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Phường/Xã">
            </div>
            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Ghi chú (Tùy chọn)</label>
              <textarea v-model="orderInfo.ghiChu" class="form-control border-0 bg-light rounded-3 px-3 py-2" rows="3" placeholder="Lưu ý cho người giao hàng..."></textarea>
            </div>
          </form>
        </div>

        <!-- 2. Payment Methods -->
        <div class="bg-white rounded-4 shadow-sm p-4">
          <h5 class="fw-bold mb-4 border-bottom pb-3"><i class="fas fa-credit-card me-2"></i> PHƯƠNG THỨC THANH TOÁN</h5>
          <div class="payment-methods">
            <div class="form-check payment-option mb-3 p-3 rounded-3 border" :class="{ 'active': paymentMethod === 'cod' }">
              <input class="form-check-input ms-0 me-3" type="radio" name="payment" id="cod" value="cod" v-model="paymentMethod">
              <label class="form-check-label d-flex align-items-center w-100" for="cod">
                <i class="fas fa-money-bill-wave fs-4 text-success me-3"></i>
                <div>
                  <div class="fw-bold">Thanh toán khi nhận hàng (COD)</div>
                  <div class="small text-secondary">Thanh toán bằng tiền mặt khi nhận hàng</div>
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
            <div v-for="item in cartStore.selectedItems" :key="item.id" class="d-flex align-items-center mb-3">
              <div class="position-relative">
                <img :src="item.sanPhamChiTiet.sanPham.hinhAnhs?.[0]?.url || 'https://placehold.co/60x80'" class="rounded-3 border" width="60" alt="Product">
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style="font-size: 10px;">{{ item.soLuong }}</span>
              </div>
              <div class="ms-4 flex-grow-1">
                <h6 class="fw-bold mb-0 small">{{ item.sanPhamChiTiet.sanPham.ten }}</h6>
                <p class="text-secondary small mb-0">SIZE: {{ item.sanPhamChiTiet.kichThuoc.ten }} | MÀU: {{ item.sanPhamChiTiet.mauSac.ten }}</p>
              </div>
              <div class="fw-bold small">{{ formatPrice(item.sanPhamChiTiet.sanPham.giaGoc * item.soLuong) }}</div>
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
                  <i class="fas fa-ticket-alt me-2"></i>{{ selectedVoucher.maCode }} (-{{ selectedVoucher.kieuGiamGia === 'PERCENT' ? selectedVoucher.giaTriGiam + '%' : formatPrice(selectedVoucher.giaTriGiam) }})
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
                      <span class="fw-bold small">{{ v.maCode }}</span>
                      <span 
                        class="badge rounded-pill" 
                        :class="selectedVoucher?.id === v.id ? 'bg-white text-danger' : 'bg-danger-subtle text-danger'"
                        style="font-size: 10px;"
                      >
                        -{{ v.kieuGiamGia === 'PERCENT' ? v.giaTriGiam + '%' : formatPrice(v.giaTriGiam) }}
                      </span>
                    </div>
                    <div class="small opacity-75" style="font-size: 11px;">Đơn tối thiểu: {{ formatPrice(v.giaTriToiThieu) }}</div>
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

          <button @click="handlePlaceOrder" class="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-lg" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            ĐẶT HÀNG NGAY
          </button>
          
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
