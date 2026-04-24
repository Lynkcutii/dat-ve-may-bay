<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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
  ghiChu: '',
});

const formErrors = ref({
  tenNguoiNhan: '',
  soDienThoai: '',
  email: '',
  tinh: '',
  huyen: '',
  xa: '',
  diaChiChiTiet: '',
  paymentMethodId: '',
});

const confirmModal = ref(false);
const successModal = ref(false);
const noticeModal = ref({
  visible: false,
  title: '',
  message: '',
  tone: 'info',
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
  await updateCheckoutInfo();
});

const fetchSavedAddresses = async () => {
  if (!authStore.currentUser?.id) return;

  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/addresses/${authStore.currentUser.id}`);
    savedAddresses.value = res.data || [];

    const defaultAddress =
      savedAddresses.value.find((addr) => addr.laMacDinh && hasAddressRegionData(addr)) ||
      savedAddresses.value.find((addr) => hasAddressRegionData(addr)) ||
      savedAddresses.value.find((addr) => addr.laMacDinh) ||
      savedAddresses.value[0];

    if (defaultAddress) {
      applyAddressToOrderInfo(defaultAddress);
    }
  } catch (error) {
    console.error('Error fetching addresses:', error);
  }
};

const formatSavedAddress = (address) =>
  [address?.diaChiChiTiet, address?.xa, address?.huyen, address?.tinh].filter(Boolean).join(', ');

const fetchPaymentMethods = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/payment-methods`);
    // Loc bo trung lap theo maPtThanhToan
    const uniqueMethods = [];
    const seenCodes = new Set();
    
    if (Array.isArray(res.data)) {
      for (const pm of res.data) {
        if (!seenCodes.has(pm.maPtThanhToan)) {
          seenCodes.add(pm.maPtThanhToan);
          uniqueMethods.push(pm);
        }
      }
    }
    
    paymentMethods.value = uniqueMethods;
    if (paymentMethods.value.length > 0) {
      selectedPaymentMethodId.value = paymentMethods.value[0].id;
    }
  } catch (error) {
    console.error('Error fetching payment methods:', error);
  }
};

const fetchVouchers = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/user/vouchers`);
    vouchers.value = res.data;
  } catch (error) {
    console.error('Error fetching vouchers:', error);
  }
};

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const subTotal = computed(() => cartStore.selectedTotalPrice);

const discountAmount = computed(() => {
  if (!selectedVoucher.value || subTotal.value < selectedVoucher.value.giaTriToiThieu) return 0;

  if (selectedVoucher.value.kieuGiamGia === 'PERCENT') {
    let amount = (subTotal.value * selectedVoucher.value.giaTriGiam) / 100;
    if (selectedVoucher.value.giaTriGiamToiDa && amount > selectedVoucher.value.giaTriGiamToiDa) {
      amount = selectedVoucher.value.giaTriGiamToiDa;
    }
    return amount;
  }

  return selectedVoucher.value.giaTriGiam;
});

const shippingFee = ref(30000);

const updateCheckoutInfo = async () => {
  if (cartStore.selectedItemIds.length === 0) return;

  try {
    const request = {
      userId: cartStore.userId,
      cartItemIds: cartStore.selectedItemIds,
      voucherId: selectedVoucher.value?.id || null,
      tinh: orderInfo.value.tinh,
    };
    const res = await axios.post(`${API_BASE_URL}/api/user/order/checkout`, request);
    shippingFee.value = res.data.phiVanChuyen || 30000;
  } catch (error) {
    console.error('Error updating checkout info:', error);
  }
};

// Watch for changes that affect checkout calculation
watch(
  [() => orderInfo.value.tinh, () => selectedVoucher.value, () => cartStore.selectedItemIds],
  () => {
    updateCheckoutInfo();
  },
  { deep: true },
);

const hasIncompleteSavedAddress = computed(
  () => savedAddresses.value.length > 0 && !hasAddressRegionData(savedAddresses.value[0]),
);
const getOriginalUnitPrice = (item) => Number(item?.sanPhamChiTiet?.giaBan || item?.donGia || 0);
const getSaleUnitPrice = (item) => Number(item?.donGia || item?.sanPhamChiTiet?.giaBan || 0);
const hasPromotion = (item) => getSaleUnitPrice(item) < getOriginalUnitPrice(item);

const total = computed(() => Math.max(0, subTotal.value + shippingFee.value - discountAmount.value));

const activePaymentMethod = computed(
  () => paymentMethods.value.find((pm) => pm.id === selectedPaymentMethodId.value) || null,
);

const openNotice = (title, message, tone = 'info') => {
  noticeModal.value = {
    visible: true,
    title,
    message,
    tone,
  };
};

const closeNotice = () => {
  noticeModal.value.visible = false;
};

const clearError = (field) => {
  formErrors.value[field] = '';
};

const fieldClass = (field) => ({
  'is-invalid': Boolean(formErrors.value[field]),
});

const validateForm = () => {
  const errors = {
    tenNguoiNhan: '',
    soDienThoai: '',
    email: '',
    tinh: '',
    huyen: '',
    xa: '',
    diaChiChiTiet: '',
    paymentMethodId: '',
  };

  const phone = String(orderInfo.value.soDienThoai || '').trim();
  const email = String(orderInfo.value.email || '').trim();

  if (!String(orderInfo.value.tenNguoiNhan || '').trim()) {
    errors.tenNguoiNhan = 'Vui lòng nhập họ và tên người nhận.';
  }

  if (!phone) {
    errors.soDienThoai = 'Vui lòng nhập số điện thoại.';
  } else if (!/^(0|\+84)\d{9,10}$/.test(phone.replace(/\s+/g, ''))) {
    errors.soDienThoai = 'Số điện thoại không hợp lệ.';
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email không hợp lệ.';
  }

  if (!String(orderInfo.value.diaChiChiTiet || '').trim()) {
    errors.diaChiChiTiet = 'Vui lòng nhập địa chỉ cụ thể.';
  }

  if (!String(orderInfo.value.tinh || '').trim()) {
    errors.tinh = 'Vui lòng nhập tỉnh / thành phố.';
  }

  if (!String(orderInfo.value.huyen || '').trim()) {
    errors.huyen = 'Vui lòng nhập quận / huyện.';
  }

  if (!String(orderInfo.value.xa || '').trim()) {
    errors.xa = 'Vui lòng nhập phường / xã.';
  }

  if (!selectedPaymentMethodId.value) {
    errors.paymentMethodId = 'Vui lòng chọn phương thức thanh toán.';
  }

  formErrors.value = errors;
  return !Object.values(errors).some(Boolean);
};

const selectVoucher = (voucher) => {
  if (subTotal.value < voucher.giaTriToiThieu) {
    openNotice(
      'Voucher chưa áp dụng được',
      `Đơn hàng tối thiểu ${formatPrice(voucher.giaTriToiThieu)} để áp dụng mã này.`,
      'warning',
    );
    return;
  }
  selectedVoucher.value = voucher;
};

const handlePlaceOrder = async () => {
  if (!cartStore.userId) {
    openNotice('Cần đăng nhập', 'Vui lòng đăng nhập để tiếp tục đặt hàng.', 'warning');
    router.push('/login');
    return;
  }

  if (!validateForm()) {
    openNotice(
      'Thông tin chưa đầy đủ',
      'Vui lòng kiểm tra lại thông tin giao hàng và phương thức thanh toán.',
      'warning',
    );
    return;
  }

  confirmModal.value = true;
};

const submitOrder = async () => {
  confirmModal.value = false;
  loading.value = true;

  try {
    const cleanItemIds = cartStore.selectedItemIds.filter((id) => id !== null && id !== undefined);

    if (cleanItemIds.length === 0) {
      openNotice('Chưa có sản phẩm', 'Vui lòng chọn ít nhất một sản phẩm để đặt hàng.', 'warning');
      loading.value = false;
      return;
    }

    const request = {
      userId: cartStore.userId,
      cartItemIds: cleanItemIds,
      voucherId: selectedVoucher.value?.id || null,
      paymentMethodId: selectedPaymentMethodId.value,
      tenNguoiNhan: orderInfo.value.tenNguoiNhan,
      soDienThoai: orderInfo.value.soDienThoai,
      tinh: orderInfo.value.tinh,
      huyen: orderInfo.value.huyen,
      xa: orderInfo.value.xa,
      diaChiChiTiet: orderInfo.value.diaChiChiTiet,
      ghiChu: orderInfo.value.ghiChu,
    };

    const res = await axios.post(`${API_BASE_URL}/api/user/order/create`, request);
    const { paymentUrl } = res.data;

    if (paymentUrl) {
      window.location.href = paymentUrl;
      return;
    }

    await cartStore.clearSelected();
    successModal.value = true;
  } catch (error) {
    console.error('Error placing order:', error);
    await cartStore.fetchCart();
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.';
    openNotice('Đặt hàng chưa thành công', message, 'danger');
  } finally {
    loading.value = false;
  }
};

const finishSuccess = () => {
  successModal.value = false;
  router.push('/order-history');
};
</script>

<template>
  <div class="container py-5">
    <h2 class="fw-bold mb-5 text-uppercase">Thanh toán</h2>

    <div class="row g-5">
      <div class="col-lg-7">
        <div class="bg-white rounded-4 shadow-sm p-4 mb-4">
          <h5 class="fw-bold mb-4 border-bottom pb-3">
            <i class="fas fa-shipping-fast me-2"></i> THÔNG TIN GIAO HÀNG
          </h5>

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
              Địa chỉ đang lưu chưa đầy đủ tỉnh / thành, quận / huyện, phường / xã. Vui lòng cập nhật lại.
            </div>
          </div>

          <form class="row g-3" @submit.prevent>
            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Họ và tên</label>
              <input
                v-model="orderInfo.tenNguoiNhan"
                type="text"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('tenNguoiNhan')"
                placeholder="Nhập họ tên người nhận"
                @input="clearError('tenNguoiNhan')"
              />
              <div v-if="formErrors.tenNguoiNhan" class="invalid-feedback d-block small">
                {{ formErrors.tenNguoiNhan }}
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Số điện thoại</label>
              <input
                v-model="orderInfo.soDienThoai"
                type="tel"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('soDienThoai')"
                placeholder="Nhập số điện thoại"
                @input="clearError('soDienThoai')"
              />
              <div v-if="formErrors.soDienThoai" class="invalid-feedback d-block small">
                {{ formErrors.soDienThoai }}
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Email</label>
              <input
                v-model="orderInfo.email"
                type="email"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('email')"
                placeholder="Nhập email"
                @input="clearError('email')"
              />
              <div v-if="formErrors.email" class="invalid-feedback d-block small">
                {{ formErrors.email }}
              </div>
            </div>

            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Địa chỉ cụ thể</label>
              <input
                v-model="orderInfo.diaChiChiTiet"
                type="text"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('diaChiChiTiet')"
                placeholder="Số nhà, tên đường..."
                @input="clearError('diaChiChiTiet')"
              />
              <div v-if="formErrors.diaChiChiTiet" class="invalid-feedback d-block small">
                {{ formErrors.diaChiChiTiet }}
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Tỉnh / Thành</label>
              <input
                v-model="orderInfo.tinh"
                type="text"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('tinh')"
                placeholder="Tỉnh / Thành"
                @input="clearError('tinh')"
              />
              <div v-if="formErrors.tinh" class="invalid-feedback d-block small">
                {{ formErrors.tinh }}
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Quận / Huyện</label>
              <input
                v-model="orderInfo.huyen"
                type="text"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('huyen')"
                placeholder="Quận / Huyện"
                @input="clearError('huyen')"
              />
              <div v-if="formErrors.huyen" class="invalid-feedback d-block small">
                {{ formErrors.huyen }}
              </div>
            </div>

            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Phường / Xã</label>
              <input
                v-model="orderInfo.xa"
                type="text"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                :class="fieldClass('xa')"
                placeholder="Phường / Xã"
                @input="clearError('xa')"
              />
              <div v-if="formErrors.xa" class="invalid-feedback d-block small">
                {{ formErrors.xa }}
              </div>
            </div>

            <div class="col-md-12">
              <label class="form-label small fw-bold text-uppercase">Ghi chú (Tùy chọn)</label>
              <textarea
                v-model="orderInfo.ghiChu"
                class="form-control border-0 bg-light rounded-3 px-3 py-2"
                rows="3"
                placeholder="Lưu ý cho người giao hàng..."
              ></textarea>
            </div>
          </form>
        </div>

        <div class="bg-white rounded-4 shadow-sm p-4">
          <h5 class="fw-bold mb-4 border-bottom pb-3">
            <i class="fas fa-credit-card me-2"></i> PHƯƠNG THỨC THANH TOÁN
          </h5>
          <div class="payment-methods">
            <div
              v-for="pm in paymentMethods"
              :key="pm.id"
              class="form-check payment-option mb-3 p-3 rounded-3 border"
              :class="{ active: selectedPaymentMethodId === pm.id, 'border-danger': formErrors.paymentMethodId }"
            >
              <input
                class="form-check-input ms-0 me-3"
                type="radio"
                name="payment"
                :id="'pm-' + pm.id"
                :value="pm.id"
                v-model="selectedPaymentMethodId"
                @change="clearError('paymentMethodId')"
              />
              <label class="form-check-label d-flex align-items-center w-100" :for="'pm-' + pm.id">
                <i v-if="pm.maPtThanhToan === 'COD'" class="fas fa-money-bill-wave fs-4 text-success me-3"></i>
                <i v-else-if="pm.maPtThanhToan === 'VNPAY'" class="fas fa-wallet fs-4 text-primary me-3"></i>
                <i v-else class="fas fa-credit-card fs-4 text-secondary me-3"></i>
                <div>
                  <div class="fw-bold">{{ pm.tenPttt }}</div>
                  <div class="small text-secondary">
                    {{ pm.maPtThanhToan === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán qua cổng VNPay' }}
                  </div>
                </div>
              </label>
            </div>
            <div v-if="formErrors.paymentMethodId" class="small text-danger">
              {{ formErrors.paymentMethodId }}
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="bg-white rounded-4 shadow-sm p-4 sticky-top" style="top: 100px;">
          <h5 class="fw-bold mb-4 border-bottom pb-3">ĐƠN HÀNG CỦA BẠN</h5>

          <div class="order-items mb-4">
            <div v-for="item in cartStore.selectedItems" :key="item.idGhct" class="d-flex align-items-center mb-3">
              <div class="position-relative">
                <img
                  :src="item.sanPhamChiTiet?.sanPham?.hinhAnhs?.[0]?.url || 'https://placehold.co/60x80'"
                  class="rounded-3 border"
                  width="60"
                  alt="Product"
                />
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary small-badge">
                  {{ item.soLuong }}
                </span>
              </div>
              <div class="ms-4 flex-grow-1">
                <h6 class="fw-bold mb-0 small">{{ item.sanPhamChiTiet?.sanPham?.tenSanPham || 'Sản phẩm' }}</h6>
                <div class="text-secondary mini-note mb-1">
                  MÃ: {{ item.sanPhamChiTiet?.sanPham?.ma || 'N/A' }}
                </div>
                <p class="text-secondary small mb-0">
                  KÍCH THƯỚC: {{ item.sanPhamChiTiet?.kichThuoc?.ten || 'N/A' }} | MÀU: {{ item.sanPhamChiTiet?.mauSac?.ten || 'N/A' }}
                </p>
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
                  <i class="fas fa-ticket-alt me-2"></i>{{ selectedVoucher.maCode }}
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
                      >
                        -{{ v.kieuGiamGia === 'PERCENT' ? `${v.giaTriGiam}%` : formatPrice(v.giaTriGiam) }}
                      </span>
                    </div>
                    <div class="small opacity-75">Đơn tối thiểu: {{ formatPrice(v.giaTriToiThieu) }}</div>
                  </a>
                </li>
                <li v-if="selectedVoucher">
                  <hr class="dropdown-divider mx-2" />
                  <a class="dropdown-item text-center small text-danger fw-bold rounded-2" href="#" @click.prevent="selectedVoucher = null">
                    Hủy chọn voucher
                  </a>
                </li>
              </ul>
            </div>
          </div>

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
              <span class="text-secondary">
                Giảm giá
                <span v-if="selectedVoucher" class="ms-1">
                  ({{ selectedVoucher.maCode }} - {{ selectedVoucher.kieuGiamGia === 'PERCENT' ? selectedVoucher.giaTriGiam + '%' : formatPrice(selectedVoucher.giaTriGiam) }}):
                </span>
                <span v-else>:</span>
              </span>
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

    <div v-if="noticeModal.visible" class="overlay-backdrop">
      <div class="status-modal" :class="`status-${noticeModal.tone}`">
        <div class="status-icon">
          <i class="fas" :class="noticeModal.tone === 'danger' ? 'fa-circle-exclamation' : noticeModal.tone === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'"></i>
        </div>
        <h4>{{ noticeModal.title }}</h4>
        <p>{{ noticeModal.message }}</p>
        <button class="btn btn-dark rounded-pill px-4" @click="closeNotice">Đã hiểu</button>
      </div>
    </div>

    <div v-if="confirmModal" class="overlay-backdrop">
      <div class="status-modal confirm-modal">
        <div class="status-icon confirm-icon">
          <i class="fas fa-bag-shopping"></i>
        </div>
        <h4>Xác nhận đặt hàng</h4>
        <p>
          Bạn sắp đặt <strong>{{ cartStore.selectedItemIds.length }}</strong> sản phẩm với tổng thanh toán
          <strong>{{ formatPrice(total) }}</strong>.
        </p>
        <div class="confirm-summary">
          <div><span>Người nhận</span><strong>{{ orderInfo.tenNguoiNhan }}</strong></div>
          <div><span>Điện thoại</span><strong>{{ orderInfo.soDienThoai }}</strong></div>
          <div><span>Thanh toán</span><strong>{{ activePaymentMethod?.tenPttt || 'Chưa chọn' }}</strong></div>
          <div v-if="selectedVoucher">
            <span>Giảm giá</span>
            <strong class="text-success">
              {{ selectedVoucher.maCode }} (-{{ selectedVoucher.kieuGiamGia === 'PERCENT' ? selectedVoucher.giaTriGiam + '%' : formatPrice(selectedVoucher.giaTriGiam) }})
            </strong>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light rounded-pill px-4" @click="confirmModal = false">Xem lại</button>
          <button class="btn btn-dark rounded-pill px-4" @click="submitOrder">Xác nhận</button>
        </div>
      </div>
    </div>

    <div v-if="successModal" class="overlay-backdrop">
      <div class="status-modal success-modal">
        <div class="status-icon success-icon">
          <i class="fas fa-circle-check"></i>
        </div>
        <h3>Cảm ơn quý khách đã đặt hàng</h3>
        <p>
          Đơn hàng của bạn đã được tiếp nhận thành công. BeeSport sẽ nhanh chóng xử lý và giao đến bạn trong
          thời gian sớm nhất.
        </p>
        <button class="btn btn-dark rounded-pill px-4 py-2 mt-3" @click="finishSuccess">
          Theo dõi đơn hàng
        </button>
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
  background-color: #111827;
  border-color: #111827;
}

.small-badge {
  font-size: 10px;
}

.overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 25, 0.58);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 2000;
}

.status-modal {
  width: min(100%, 460px);
  background: #ffffff;
  border-radius: 28px;
  padding: 32px 28px;
  box-shadow: 0 30px 80px rgba(14, 23, 38, 0.28);
  text-align: center;
}

.status-modal h3,
.status-modal h4 {
  margin: 0 0 12px;
  color: #111827;
  font-weight: 800;
}

.status-modal p {
  margin: 0;
  color: #5b6475;
  line-height: 1.7;
}

.status-icon {
  width: 82px;
  height: 82px;
  margin: 0 auto 18px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 2rem;
}

.status-info .status-icon {
  background: linear-gradient(135deg, #e0f2fe, #bfdbfe);
  color: #1d4ed8;
}

.status-warning .status-icon,
.confirm-icon {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
}

.status-danger .status-icon {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
}

.success-icon {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #16a34a;
}

.confirm-summary,
.success-card {
  margin-top: 18px;
  padding: 16px 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  text-align: left;
}

.confirm-summary div,
.success-card div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #374151;
  font-size: 0.95rem;
}

.confirm-summary div + div,
.success-card div + div {
  margin-top: 10px;
}

.confirm-summary span {
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

.is-invalid {
  border: 1px solid #ef4444 !important;
  background: #fff5f5 !important;
}

.invalid-feedback {
  color: #dc2626;
}

@media (max-width: 991.98px) {
  .sticky-top {
    position: static !important;
  }
}

@media (max-width: 575.98px) {
  .status-modal {
    padding: 26px 18px;
    border-radius: 22px;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
