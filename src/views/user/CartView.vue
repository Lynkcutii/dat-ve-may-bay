<script setup>
import { onMounted, computed } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const router = useRouter();

onMounted(() => {
  cartStore.fetchCart();
});

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const handleUpdateQuantity = async (spctId, delta) => {
  try {
    await cartStore.addToCart(spctId, delta);
  } catch (error) {
    alert("Có lỗi xảy ra khi cập nhật số lượng.");
  }
};

const handleRemoveItem = async (itemId) => {
  if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
    try {
      await cartStore.removeFromCart(itemId);
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa sản phẩm.");
    }
  }
};

const isAllSelected = computed(() => {
  return cartStore.items.length > 0 && cartStore.selectedItemIds.length === cartStore.items.length;
});

const handleToggleAll = (event) => {
  cartStore.toggleAll(event.target.checked);
};

const handleCheckout = () => {
  if (cartStore.selectedItemIds.length === 0) {
    alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
    return;
  }
  router.push('/checkout');
};
</script>

<template>
  <div class="container py-4 py-md-5">
    <h2 class="fw-bold mb-4 mb-md-5 text-center">GIỎ HÀNG CỦA BẠN</h2>
    
    <div v-if="cartStore.loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="cartStore.items.length === 0" class="text-center py-5">
      <i class="fas fa-shopping-cart fa-3x text-light mb-3"></i>
      <p class="text-muted">Giỏ hàng của bạn đang trống.</p>
      <router-link to="/products" class="btn btn-danger rounded-pill px-4">MUA SẮM NGAY</router-link>
    </div>
    <div v-else class="row g-4 g-lg-5">
      <!-- Cart Items -->
      <div class="col-lg-8">
        <div class="bg-white rounded-4 shadow-sm p-3 p-md-4">
          <div class="d-flex align-items-center mb-3 pb-3 border-bottom d-md-none">
            <div class="form-check mb-0">
              <input class="form-check-input" type="checkbox" id="selectAllMobile" :checked="isAllSelected" @change="handleToggleAll">
              <label class="form-check-label fw-bold small ms-2" for="selectAllMobile">CHỌN TẤT CẢ</label>
            </div>
          </div>
          <div class="table-responsive-md">
            <table class="table align-middle mb-0 cart-table">
            <thead class="text-secondary small d-none d-md-table-header-group">
              <tr>
                <th>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" :checked="isAllSelected" @change="handleToggleAll">
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
  :checked="cartStore.selectedItemIds.includes(item.idGhct)" 
  @change="cartStore.toggleSelection(item.idGhct)" 
>
                  </div>
                </td>
                <td class="product-info-cell">
                  <div class="d-flex align-items-center">
                    <img :src="item.sanPhamChiTiet.sanPham.hinhAnhs?.[0]?.url || 'https://placehold.co/80x100'" class="rounded-3 me-3" alt="Product" style="width: 80px; height: 100px; object-fit: cover;">
                    <div>
                      <h6 class="fw-bold mb-1 small text-truncate-1">{{ item.sanPhamChiTiet.sanPham.tenSanPham }}</h6>
                      <p class="text-secondary mb-0" style="font-size: 11px;">
                        SIZE: {{ item.sanPhamChiTiet.kichThuoc.ten }} | MÀU: {{ item.sanPhamChiTiet.mauSac.ten }}
                      </p>
                      <!-- Mobile only price -->
                      <div class="d-md-none mt-1 fw-bold text-danger">{{ formatPrice(item.sanPhamChiTiet.giaBan) }}</div>
                    </div>
                  </div>
                </td>
                <td class="d-none d-md-table-cell fw-bold small">{{ formatPrice(item.sanPhamChiTiet.giaBan) }}</td>
                <td class="quantity-cell">
                  <div class="input-group input-group-sm mx-auto mx-md-0" style="width: 100px;">
                    <button @click="handleUpdateQuantity(item.sanPhamChiTiet.id, -1)" class="btn btn-outline-secondary border shadow-none px-2" :disabled="item.soLuong <= 1"><i class="fas fa-minus small"></i></button>
                    <input type="text" class="form-control text-center border-top border-bottom fw-bold px-1" :value="item.soLuong" readonly>
                    <button @click="handleUpdateQuantity(item.sanPhamChiTiet.id, 1)" class="btn btn-outline-secondary border shadow-none px-2"><i class="fas fa-plus small"></i></button>
                  </div>
                </td>
                <td class="d-none d-md-table-cell text-end fw-bold text-danger small">{{ formatPrice(item.sanPhamChiTiet.giaBan * item.soLuong) }}</td>
                <td class="text-end text-md-center">
                  <button @click="handleRemoveItem(item.idGhct)" class="btn btn-link text-secondary p-0 shadow-none"><i class="far fa-trash-alt"></i></button>
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

    <!-- Summary -->
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
            <span class="fw-bold">Miễn phí</span>
          </div>
          <hr>
          <div class="d-flex justify-content-between mb-4">
            <span class="fw-bold text-uppercase">Tổng cộng:</span>
            <span class="fw-bold text-danger fs-5">{{ formatPrice(cartStore.selectedTotalPrice) }}</span>
          </div>
          <button @click="handleCheckout" class="btn btn-dark w-100 rounded-pill py-3 fw-bold mb-3 shadow text-decoration-none d-block text-center border-0">THANH TOÁN NGAY</button>
          <div class="text-center pt-2">
            <img src="https://img.icons8.com/color/48/000000/visa.png" width="30" class="mx-1 opacity-75">
            <img src="https://img.icons8.com/color/48/000000/mastercard.png" width="30" class="mx-1 opacity-75">
            <img src="https://img.icons8.com/color/48/000000/paypal.png" width="30" class="mx-1 opacity-75">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table th { border-top: none; }
.form-control:focus { background: #f8f9fa; }

@media (max-width: 767.98px) {
  .cart-table thead { display: none; }
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
  .cart-item:last-child { border-bottom: none; }
}

.text-truncate-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
