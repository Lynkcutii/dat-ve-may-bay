<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

const paymentMethods = ref([]);
const selectedPaymentMethodId = ref(null);
const selectedVoucher = ref(null);
const vouchers = ref([]);
const loading = ref(false);
const savedAddresses = ref([]);

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

const hasAddressRegionData = (address) => Boolean(address?.tinh && address?.huyen && address?.xa);

const applyAddressToOrderInfo = (address) => {
  if (!address) return;
  orderInfo.value.tenNguoiNhan = address.tenNguoiNhan || orderInfo.value.tenNguoiNhan;
  orderInfo.value.soDienThoai = address.soDienThoai || orderInfo.value.soDienThoai;
  orderInfo.value.tinh = address.tinh || '';
  orderInfo.value.huyen = address.huyen || '';
  orderInfo.value.xa = address.xa || '';
  orderInfo.value.diaChiChiTiet = address.diaChiChiTiet || orderInfo.value.diaChiChiTiet;
};

onMounted(async () => {
  if (cartStore.selectedItemIds.length === 0) {
    router.push('/cart');
    return;
  }
  await fetchSavedAddresses();
  await fetchVouchers();
  await fetchPaymentMethods();
});

const fetchSavedAddresses = async () => {
  if (!authStore.currentUser?.id) return;

  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/addresses/${authStore.currentUser.id}`);
    savedAddresses.value = res.data || [];

    const defaultAddress =
      savedAddresses.value.find(addr => addr.laMacDinh && hasAddressRegionData(addr)) ||
      savedAddresses.value.find(addr => hasAddressRegionData(addr)) ||
      savedAddresses.value.find(addr => addr.laMacDinh) ||
      savedAddresses.value[0];
    if (defaultAddress) {
      applyAddressToOrderInfo(defaultAddress);
    }
  } catch (error) {
    console.error("Error fetching addresses:", error);
  }
};

const formatSavedAddress = (address) => {
  return [
    address?.diaChiChiTiet,
    address?.xa,
    address?.huyen,
    address?.tinh
  ].filter(Boolean).join(', ');
};

const fetchPaymentMethods = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/payment-methods`);
    paymentMethods.value = res.data;
    if (paymentMethods.value.length > 0) {
      selectedPaymentMethodId.value = paymentMethods.value[0].id; // Default to first
    }
  } catch (error) {
    console.error("Error fetching payment methods:", error);
  }
};

const fetchVouchers = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/vouchers`);
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

const shippingFee = ref(30000);
const hasIncompleteSavedAddress = computed(() => savedAddresses.value.length > 0 && !hasAddressRegionData(savedAddresses.value[0]));
const getOriginalUnitPrice = (item) => Number(item?.sanPhamChiTiet?.giaBan || item?.donGia || 0);
const getSaleUnitPrice = (item) => Number(item?.donGia || item?.sanPhamChiTiet?.giaBan || 0);
const hasPromotion = (item) => getSaleUnitPrice(item) < getOriginalUnitPrice(item);

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

  if (!selectedPaymentMethodId.value) {
    alert("Vui lòng chọn phương thức thanh toán!");
    return;
  }

  if (!cartStore.userId) {
    alert("Vui lòng đăng nhập để thực hiện đặt hàng!");
    router.push('/login');
    return;
  }

  loading.value = true;
 try {
    // Lọc bỏ các ID bị null/undefined để đảm bảo mảng sạch
    const cleanItemIds = cartStore.selectedItemIds.filter(id => id !== null && id !== undefined);

    if (cleanItemIds.length === 0) {
      alert("Danh sách sản phẩm chọn mua không hợp lệ!");
      loading.value = false;
      return;
    }

    const request = {
      userId: cartStore.userId,
      cartItemIds: cleanItemIds, // Sử dụng mảng đã lọc sạch
      voucherId: selectedVoucher.value?.id || null,
      paymentMethodId: selectedPaymentMethodId.value,
      tenNguoiNhan: orderInfo.value.tenNguoiNhan,
      soDienThoai: orderInfo.value.soDienThoai,
      tinh: orderInfo.value.tinh,
      huyen: orderInfo.value.huyen,
      xa: orderInfo.value.xa,
      diaChiChiTiet: orderInfo.value.diaChiChiTiet,
      ghiChu: orderInfo.value.ghiChu
    };
      console.log("Dữ liệu gửi lên BE:", request); 

    const res = await axios.post(`${API_BASE_URL}/api/user/order/create`, request);
    const { hoaDon, paymentUrl } = res.data;
    
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      alert('Đặt hàng thành công!');
      await cartStore.clearSelected();
      router.push('/order-history');
    }
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
          <div v-if="savedAddresses.length > 0" class="mb-4 p-3 rounded-3 border bg-light-subtle">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div>
                <div class="small text-uppercase fw-bold text-secondary mb-2">Địa chỉ đã lưu</div>
                <div class="fw-bold">{{ orderInfo.tenNguoiNhan }}</div>
                <div class="small text-secondary">{{ orderInfo.soDienThoai }}</div>
                <div class="small text-secondary">{{ formatSavedAddress(orderInfo) }}</div>
              </div>
              <router-link to="/account" class="btn btn-sm btn-outline-dark rounded-pill px-3 fw-bold">
                Sổ địa chỉ
              </router-link>
            </div>
            <div v-if="hasIncompleteSavedAddress" class="mt-3 small text-danger">
              Địa chỉ đang lưu trong DB chưa có đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã. Hãy vào Sổ địa chỉ để cập nhật lại địa chỉ.
            </div>
          </div>
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
            <div v-for="pm in paymentMethods" :key="pm.id" class="form-check payment-option mb-3 p-3 rounded-3 border" :class="{ 'active': selectedPaymentMethodId === pm.id }">
              <input class="form-check-input ms-0 me-3" type="radio" name="payment" :id="'pm-'+pm.id" :value="pm.id" v-model="selectedPaymentMethodId">
              <label class="form-check-label d-flex align-items-center w-100" :for="'pm-'+pm.id">
                <i v-if="pm.maPtThanhToan === 'COD'" class="fas fa-money-bill-wave fs-4 text-success me-3"></i>
                <i v-else-if="pm.maPtThanhToan === 'VNPAY'" class="fas fa-wallet fs-4 text-primary me-3"></i>
                <i v-else class="fas fa-credit-card fs-4 text-secondary me-3"></i>
                <div>
                  <div class="fw-bold">{{ pm.tenPttt }}</div>
                  <div class="small text-secondary">{{ pm.maPtThanhToan === 'COD' ? 'Thanh toán bằng tiền mặt khi nhận hàng' : 'Thanh toán trực tuyến qua cổng VNPay' }}</div>
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
            <div v-for="item in cartStore.selectedItems" :key="item.idGhct" class="d-flex align-items-center mb-3">
              <div class="position-relative">
                <img :src="item.sanPhamChiTiet?.sanPham?.hinhAnhs?.[0]?.url || 'https://placehold.co/60x80'" class="rounded-3 border" width="60" alt="Product">
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style="font-size: 10px;">{{ item.soLuong }}</span>
              </div>
              <div class="ms-4 flex-grow-1">
                <h6 class="fw-bold mb-0 small">{{ item.sanPhamChiTiet?.sanPham?.tenSanPham || 'Sản phẩm' }}</h6>
                <p class="text-secondary small mb-0">SIZE: {{ item.sanPhamChiTiet?.kichThuoc?.ten || 'N/A' }} | MÀU: {{ item.sanPhamChiTiet?.mauSac?.ten || 'N/A' }}</p>
              </div>
              <div class="text-end">
                <div v-if="hasPromotion(item)" class="text-muted text-decoration-line-through small">
                  {{ formatPrice(getOriginalUnitPrice(item) * item.soLuong) }}
                </div>
                <div class="fw-bold small" :class="{ 'text-danger': hasPromotion(item) }">
                  {{ formatPrice(getSaleUnitPrice(item) * item.soLuong) }}
                </div>
              </div>
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
              <span class="fw-bold">{{ formatPrice(shippingFee) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="d-flex justify-content-between mb-2 small">
              <span class="text-secondary">Giảm giá:</span>
              <span class="fw-bold text-danger">-{{ formatPrice(discountAmount) }}</span>
            </div>
            <div class="d-flex justify-content-between mt-3">
              <h5 class="fw-bold mb-0">TỔNG CỘNG:</h5>
              <h5 class="fw-bold text-danger mb-0">{{ formatPrice(total) }}</h5>
            </div>
          </div>

          <button 
            @click="handlePlaceOrder" 
            class="btn btn-dark w-100 rounded-pill py-3 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm"></span>
            {{ loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY' }}
          </button>
          
          <router-link to="/cart" class="btn btn-link w-100 text-dark text-decoration-none small fw-bold">
            <i class="fas fa-arrow-left me-2"></i> Quay lại giỏ hàng
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-option {
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-option:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.payment-option.active {
  border-color: #0d6efd !important;
  background-color: #f8fbff;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.sticky-top {
  z-index: 10;
}
</style>
