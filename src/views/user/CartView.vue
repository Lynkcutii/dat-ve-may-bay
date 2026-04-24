<script setup>
import { onMounted, computed, ref, watch } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const router = useRouter();
const SHIPPING_FEE = 30000;

const noticeModal = ref({
  visible: false,
  title: '',
  message: '',
  tone: 'info',
});

const removeTargetId = ref(null);

onMounted(() => {
  cartStore.fetchCart();
});

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

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

const getAvailableStock = (item) => Number(item?.sanPhamChiTiet?.soLuong || 0);

const hasInsufficientStock = (item) => Number(item?.soLuong || 0) > getAvailableStock(item);

const getStockWarning = (item) => {
  const availableStock = getAvailableStock(item);
  if (availableStock <= 0) {
    return 'Sản phẩm này đã hết hàng, không thể thanh toán.';
  }
  return `Sản phẩm này chỉ còn ${availableStock} trong kho. Vui lòng giảm số lượng trước khi thanh toán.`;
};

const getErrorMessage = (error, fallbackMessage) => {
  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data ||
    error?.message ||
    '';

  const normalizedMessage = String(rawMessage);
  if (
    normalizedMessage.toLowerCase().includes('tồn kho') ||
    normalizedMessage.toLowerCase().includes('ton kho') ||
    normalizedMessage.toLowerCase().includes('vượt quá') ||
    normalizedMessage.toLowerCase().includes('vuot qua')
  ) {
    return 'Sản phẩm vượt mức tồn kho. Vui lòng giảm số lượng hoặc chọn sản phẩm khác.';
  }

  return normalizedMessage || fallbackMessage;
};

const handleUpdateQuantity = async (spctId, delta) => {
  try {
    await cartStore.addToCart(spctId, delta);
  } catch (error) {
    openNotice('Cập nhật thất bại', getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật số lượng.'), 'danger');
    cartStore.fetchCart();
  }
};

const handleManualQuantity = async (spctId, newVal, oldVal, maxStock) => {
  if (Number.isNaN(newVal) || newVal < 1) {
    openNotice('Số lượng chưa hợp lệ', 'Số lượng sản phẩm phải lớn hơn hoặc bằng 1.', 'warning');
    cartStore.fetchCart();
    return;
  }

  if (newVal > maxStock) {
    openNotice('Vượt quá tồn kho', `Sản phẩm này hiện chỉ còn ${maxStock} trong kho.`, 'warning');
    cartStore.fetchCart();
    return;
  }

  const delta = newVal - oldVal;
  if (delta === 0) return;

  try {
    await cartStore.addToCart(spctId, delta);
  } catch (error) {
    openNotice('Cập nhật thất bại', getErrorMessage(error, 'Không thể cập nhật số lượng sản phẩm.'), 'danger');
    cartStore.fetchCart();
  }
};

const askRemoveItem = (itemId) => {
  removeTargetId.value = itemId;
};

const cancelRemoveItem = () => {
  removeTargetId.value = null;
};

const confirmRemoveItem = async () => {
  if (!removeTargetId.value) return;

  try {
    await cartStore.removeFromCart(removeTargetId.value);
  } catch (error) {
    openNotice('Xóa sản phẩm thất bại', getErrorMessage(error, 'Có lỗi xảy ra khi xóa sản phẩm khỏi giỏ hàng.'), 'danger');
  } finally {
    removeTargetId.value = null;
  }
};

const isAllSelected = computed(() => {
  const selectableItems = cartStore.items.filter((item) => !hasInsufficientStock(item));
  return selectableItems.length > 0 && cartStore.selectedItemIds.length === selectableItems.length;
});

const invalidCartItems = computed(() => cartStore.items.filter(hasInsufficientStock));

const cartTotal = computed(() => {
  if (cartStore.selectedItemIds.length === 0) return 0;
  return cartStore.selectedTotalPrice + SHIPPING_FEE;
});

const handleToggleAll = (event) => {
  if (event.target.checked) {
    cartStore.selectedItemIds = cartStore.items
      .filter((item) => !hasInsufficientStock(item))
      .map((item) => item.idGhct);
    return;
  }
  cartStore.toggleAll(false);
};

const handleItemSelection = (item) => {
  if (hasInsufficientStock(item)) {
    openNotice('Không thể chọn sản phẩm', getStockWarning(item), 'warning');
    return;
  }
  cartStore.toggleSelection(item.idGhct);
};

const handleCheckout = () => {
  if (cartStore.selectedItemIds.length === 0) {
    openNotice('Chưa có sản phẩm được chọn', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'warning');
    return;
  }
  if (invalidCartItems.value.length > 0) {
    openNotice('Giỏ hàng có sản phẩm vượt tồn kho', 'Hãy giảm số lượng hoặc xóa các sản phẩm đang vượt tồn trước khi thanh toán.', 'warning');
    return;
  }
  router.push('/checkout');
};

watch(
  () => cartStore.items.map((item) => ({
    idGhct: item.idGhct,
    invalid: hasInsufficientStock(item),
  })),
  (items) => {
    const invalidIds = new Set(items.filter((item) => item.invalid).map((item) => item.idGhct));
    if (invalidIds.size === 0) return;
    cartStore.selectedItemIds = cartStore.selectedItemIds.filter((id) => !invalidIds.has(id));
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="container py-4 py-md-5">
    <h2 class="fw-bold mb-4 mb-md-5 text-center">GIỎ HÀNG CỦA BẠN</h2>

    <div v-if="cartStore.loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>

    <div v-else-if="cartStore.items.length === 0" class="text-center py-5">
      <i class="fas fa-shopping-cart fa-3x text-light mb-3"></i>
      <p class="text-muted">Giỏ hàng của bạn đang trống.</p>
      <router-link to="/products" class="btn btn-danger rounded-pill px-4">MUA SẮM NGAY</router-link>
    </div>

    <div v-else class="row g-4 g-lg-5">
      <div class="col-lg-8">
        <div class="bg-white rounded-4 shadow-sm p-3 p-md-4">
          <div class="d-flex align-items-center mb-3 pb-3 border-bottom d-md-none">
            <div class="form-check mb-0">
              <input
                id="selectAllMobile"
                class="form-check-input"
                type="checkbox"
                :checked="isAllSelected"
                @change="handleToggleAll"
              />
              <label class="form-check-label fw-bold small ms-2" for="selectAllMobile">CHỌN TẤT CẢ</label>
            </div>
          </div>

          <div class="table-responsive-md">
            <table class="table align-middle mb-0 cart-table">
              <thead class="text-secondary small d-none d-md-table-header-group">
                <tr>
                  <th>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" :checked="isAllSelected" @change="handleToggleAll" />
                    </div>
                  </th>
                  <th>SẢN PHẨM</th>
                  <th>GIÁ</th>
                  <th class="text-center">SỐ LƯỢNG</th>
                  <th class="text-end">TỔNG</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cartStore.items" :key="item.idGhct" class="cart-item">
                  <td>
                    <div class="form-check">
                      <input
                        type="checkbox"
                        class="form-check-input shadow-none"
                        :disabled="hasInsufficientStock(item)"
                        :checked="cartStore.selectedItemIds.includes(item.idGhct)"
                        @change="handleItemSelection(item)"
                      />
                    </div>
                  </td>
                  <td class="product-info-cell">
                    <div class="d-flex align-items-center">
                      <img
                        :src="item.sanPhamChiTiet?.sanPham?.hinhAnhs?.[0]?.url || 'https://placehold.co/80x100'"
                        class="rounded-3 me-3"
                        alt="Product"
                        style="width: 80px; height: 100px; object-fit: cover;"
                      />
                      <div class="flex-grow-1 min-width-0">
                        <h6 class="fw-bold mb-1 small text-truncate-1">
                          {{ item.sanPhamChiTiet?.sanPham?.tenSanPham || 'Sản phẩm' }}
                        </h6>
                        <div class="text-secondary mini-note mb-1">
                          MÃ: {{ item.sanPhamChiTiet?.sanPham?.ma || 'N/A' }}
                        </div>
                        <p class="text-secondary mb-1 small">
                          KÍCH THƯỚC: {{ item.sanPhamChiTiet?.kichThuoc?.ten || 'N/A' }} | MÀU:
                          {{ item.sanPhamChiTiet?.mauSac?.ten || 'N/A' }}
                        </p>

                        <div v-if="hasInsufficientStock(item)" class="mb-1">
                          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-normal small">
                            <i class="fas fa-triangle-exclamation me-1"></i>{{ getStockWarning(item) }}
                          </span>
                        </div>

                        <div v-if="item.donGia < item.sanPhamChiTiet?.giaBan" class="mb-1">
                          <span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-normal small">
                            <i class="fas fa-tag me-1"></i>Đang giảm giá
                          </span>
                        </div>

                        <div class="d-md-none mt-1 fw-bold">
                          <template v-if="item.donGia < item.sanPhamChiTiet?.giaBan">
                            <span class="text-muted text-decoration-line-through me-2 small fw-normal">
                              {{ formatPrice(item.sanPhamChiTiet.giaBan) }}
                            </span>
                            <span class="text-danger">{{ formatPrice(item.donGia) }}</span>
                          </template>
                          <span v-else class="text-dark">{{ formatPrice(item.sanPhamChiTiet?.giaBan || 0) }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="d-none d-md-table-cell fw-bold small">
                    <div v-if="item.donGia < item.sanPhamChiTiet?.giaBan">
                      <div class="text-muted text-decoration-line-through fw-normal mb-1 small">
                        {{ formatPrice(item.sanPhamChiTiet.giaBan) }}
                      </div>
                      <div class="text-danger">{{ formatPrice(item.donGia) }}</div>
                      <div class="text-danger-emphasis mt-1 mini-note">
                        <i class="fas fa-check-circle me-1"></i>Đã áp dụng giá tốt
                      </div>
                    </div>
                    <div v-else>{{ formatPrice(item.sanPhamChiTiet?.giaBan || 0) }}</div>
                  </td>
                  <td class="quantity-cell">
                    <div class="input-group input-group-sm mx-auto mx-md-0 quantity-box">
                      <button
                        class="btn btn-outline-secondary border shadow-none px-2"
                        :disabled="item.soLuong <= 1"
                        @click="handleUpdateQuantity(item.sanPhamChiTiet.id, -1)"
                      >
                        <i class="fas fa-minus small"></i>
                      </button>
                      <input
                        type="number"
                        class="form-control text-center border-top border-bottom fw-bold px-1"
                        :value="item.soLuong"
                        min="1"
                        :max="getAvailableStock(item)"
                        @change="(e) => handleManualQuantity(item.sanPhamChiTiet.id, parseInt(e.target.value, 10), item.soLuong, getAvailableStock(item))"
                      />
                      <button
                        class="btn btn-outline-secondary border shadow-none px-2"
                        :disabled="item.soLuong >= getAvailableStock(item)"
                        @click="handleUpdateQuantity(item.sanPhamChiTiet.id, 1)"
                      >
                        <i class="fas fa-plus small"></i>
                      </button>
                    </div>
                  </td>
                  <td class="d-none d-md-table-cell text-end fw-bold text-danger small">
                    {{ formatPrice((item.donGia || item.sanPhamChiTiet.giaBan) * item.soLuong) }}
                  </td>
                  <td class="text-end text-md-center">
                    <button class="btn btn-link text-secondary p-0 shadow-none" @click="askRemoveItem(item.idGhct)">
                      <i class="far fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <router-link to="/products" class="btn btn-link text-dark text-decoration-none mt-4 p-0 small fw-bold d-inline-block">
          <i class="fas fa-arrow-left me-2"></i> TIẾP TỤC MUA SẮM
        </router-link>
      </div>

      <div class="col-lg-4">
        <div class="bg-white rounded-4 shadow-sm p-4 sticky-top" style="top: 100px;">
          <h5 class="fw-bold mb-4">TỔNG ĐƠN HÀNG</h5>
          <div class="d-flex justify-content-between mb-3 small">
            <span class="text-secondary">Sản phẩm đã chọn:</span>
            <span class="fw-bold">{{ cartStore.selectedItemIds.length }}</span>
          </div>
          <div class="d-flex justify-content-between mb-3 small">
            <span class="text-secondary">Tạm tính:</span>
            <span class="fw-bold">{{ formatPrice(cartStore.selectedTotalPrice) }}</span>
          </div>
          <div class="d-flex justify-content-between mb-3 small">
            <span class="text-secondary">Phí vận chuyển:</span>
            <span class="fw-bold">{{ formatPrice(SHIPPING_FEE) }}</span>
          </div>
          <hr />
          <div class="d-flex justify-content-between mb-4">
            <span class="fw-bold text-uppercase">Tổng cộng:</span>
            <span class="fw-bold text-danger fs-5">{{ formatPrice(cartTotal) }}</span>
          </div>
          <p v-if="invalidCartItems.length > 0" class="small text-warning-emphasis bg-warning-subtle border border-warning-subtle rounded-3 p-3">
            Có {{ invalidCartItems.length }} sản phẩm trong giỏ đang vượt tồn kho. Bạn cần giảm số lượng hoặc xóa chúng trước khi thanh toán.
          </p>
          <button
            class="btn btn-dark w-100 rounded-pill py-3 fw-bold mb-3 shadow text-decoration-none d-block text-center border-0"
            :disabled="cartStore.selectedItemIds.length === 0 || invalidCartItems.length > 0"
            @click="handleCheckout"
          >
            THANH TOÁN NGAY
          </button>
          <div class="text-center pt-2">
            <img src="https://img.icons8.com/color/48/000000/visa.png" width="30" class="mx-1 opacity-75" />
            <img src="https://img.icons8.com/color/48/000000/mastercard.png" width="30" class="mx-1 opacity-75" />
            <img src="https://img.icons8.com/color/48/000000/paypal.png" width="30" class="mx-1 opacity-75" />
          </div>
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

    <div v-if="removeTargetId" class="overlay-backdrop">
      <div class="status-modal confirm-remove-modal">
        <div class="status-icon remove-icon">
          <i class="fas fa-trash"></i>
        </div>
        <h4>Xóa sản phẩm khỏi giỏ hàng?</h4>
        <p>Sản phẩm này sẽ được xóa khỏi giỏ hàng của bạn. Bạn vẫn có thể thêm lại bất cứ lúc nào.</p>
        <div class="modal-actions">
          <button class="btn btn-light rounded-pill px-4" @click="cancelRemoveItem">Hủy</button>
          <button class="btn btn-dark rounded-pill px-4" @click="confirmRemoveItem">Đồng ý xóa</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table th {
  border-top: none;
}

.form-control:focus {
  background: #f8f9fa;
}

.quantity-box {
  width: 100px;
}

.mini-note {
  font-size: 11px;
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
  width: min(100%, 430px);
  background: #ffffff;
  border-radius: 28px;
  padding: 30px 26px;
  box-shadow: 0 30px 80px rgba(14, 23, 38, 0.28);
  text-align: center;
}

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
  width: 78px;
  height: 78px;
  margin: 0 auto 18px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 1.8rem;
}

.status-info .status-icon {
  background: linear-gradient(135deg, #e0f2fe, #bfdbfe);
  color: #1d4ed8;
}

.status-warning .status-icon {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
}

.status-danger .status-icon,
.remove-icon {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

@media (max-width: 767.98px) {
  .cart-table thead {
    display: none;
  }

  .cart-item {
    display: block;
    position: relative;
    padding: 15px 0;
    border-bottom: 1px solid #eee;
  }

  .cart-item td {
    display: block;
    border: none;
    padding: 5px 0;
  }

  .quantity-cell {
    position: absolute;
    bottom: 15px;
    right: 0;
  }

  .product-info-cell {
    padding-right: 110px !important;
  }

  .cart-item:last-child {
    border-bottom: none;
  }
}

.text-truncate-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
