<template>
  <div class="container py-4 py-md-5">
    <h2 class="fw-bold mb-4 mb-md-5 text-center">GIỎ HÀNG CỦA BẠN</h2>
    
    <div class="row g-4 g-lg-5">
      <!-- Cart Items -->
      <div class="col-lg-8">
        <div class="table-responsive-md bg-white rounded-4 shadow-sm p-3 p-md-4">
          <table class="table align-middle mb-0 cart-table">
            <thead class="text-secondary small d-none d-md-table-header-group">
              <tr>
                <th>SẢN PHẨM</th>
                <th>GIÁ</th>
                <th class="text-center">SỐ LƯỢNG</th>
                <th class="text-end">TỔNG</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 2" :key="i" class="cart-item">
                <td class="product-info-cell">
                  <div class="d-flex align-items-center">
                    <img src="https://via.placeholder.com/80x100" class="rounded-3 me-3" alt="Product">
                    <div>
                      <h6 class="fw-bold mb-1 small text-truncate-1">Áo Thun Running Bee Pro {{ i }}</h6>
                      <p class="text-secondary mb-0" style="font-size: 11px;">SIZE: L | MÀU: ĐEN</p>
                      <!-- Mobile only price -->
                      <div class="d-md-none mt-1 fw-bold text-danger">450.000đ</div>
                    </div>
                  </div>
                </td>
                <td class="d-none d-md-table-cell fw-bold small">450.000đ</td>
                <td class="quantity-cell">
                  <div class="input-group input-group-sm mx-auto mx-md-0" style="width: 100px;">
                    <button class="btn btn-outline-secondary border shadow-none px-2"><i class="fas fa-minus small"></i></button>
                    <input type="text" class="form-control text-center border-top border-bottom fw-bold px-1" value="1">
                    <button class="btn btn-outline-secondary border shadow-none px-2"><i class="fas fa-plus small"></i></button>
                  </div>
                </td>
                <td class="d-none d-md-table-cell text-end fw-bold text-danger small">450.000đ</td>
                <td class="text-end text-md-center">
                  <button class="btn btn-link text-secondary p-0 shadow-none"><i class="far fa-trash-alt"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
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
            <span class="text-secondary">Tạm tính:</span>
            <span class="fw-bold">900.000đ</span>
          </div>
          <div class="d-flex justify-content-between mb-3 small">
            <span class="text-secondary">Phí vận chuyển:</span>
            <span class="fw-bold">Miễn phí</span>
          </div>
          <hr>
          <div class="d-flex justify-content-between mb-4">
            <span class="fw-bold text-uppercase">Tổng cộng:</span>
            <span class="fw-bold text-danger fs-5">900.000đ</span>
          </div>
          <router-link to="/checkout" class="btn btn-dark w-100 rounded-pill py-3 fw-bold mb-3 shadow text-decoration-none d-block text-center">THANH TOÁN NGAY</router-link>
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

<script setup>
</script>

<style scoped>
.table th { border-top: none; }
.form-control:focus { background: #f8f9fa; }
</style>
