<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWishlistStore } from '@/stores/wishlist';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const wishlistStore = useWishlistStore();
const cartStore = useCartStore();
const authStore = useAuthStore();

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const removeFromWishlist = async (productId) => {
  try {
    await wishlistStore.removeFromWishlist(productId);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
  }
};

const addToCart = async (product) => {
  if (!authStore.isAuthenticated) {
    alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
    router.push('/login');
    return;
  }

  router.push(`/product/${product.id}`);
};

onMounted(() => {
  wishlistStore.fetchWishlist();
  if (authStore.isAuthenticated) {
    cartStore.fetchCart();
  }
});
</script>

<template>
  <div class="container py-5">
    <div class="text-center mb-5">
      <h2 class="fw-bold">DANH SÁCH YÊU THÍCH</h2>
      <p class="text-secondary">Những sản phẩm bạn đã lưu để xem sau</p>
    </div>

    <div v-if="wishlistStore.loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="wishlistStore.items.length > 0" class="row g-4">
      <div class="col-6 col-md-4 col-lg-3" v-for="product in wishlistStore.items" :key="product.id">
        <div class="product-card card border-0 shadow-sm rounded-4 overflow-hidden h-100">
          <div class="position-relative overflow-hidden img-container">
            <img :src="product.image" class="card-img-top product-img" :alt="product.name">
            <div v-if="product.isNew" class="product-badge bg-danger text-white">MỚI</div>
            <div class="product-actions">
              <button class="btn btn-white btn-sm rounded-circle shadow-sm me-1" @click.stop="removeFromWishlist(product.id)">
                <i class="fas fa-heart text-danger"></i>
              </button>
              <button class="btn btn-white btn-sm rounded-circle shadow-sm" @click.stop="addToCart(product)">
                <i class="fas fa-shopping-bag"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-3 text-center">
            <h6 class="fw-bold mb-2 product-title text-truncate-2">{{ product.name }}</h6>
            <p class="text-danger fw-bold mb-0 small">{{ formatPrice(product.price) }}</p>
          </div>
          <router-link :to="'/product/' + product.id" class="stretched-link"></router-link>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5">
      <div class="mb-4">
        <i class="far fa-heart fa-4x text-light"></i>
      </div>
      <h4 class="fw-bold">Danh sách trống</h4>
      <p class="text-secondary mb-4">Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.</p>
      <router-link to="/products" class="btn btn-dark rounded-pill px-5 py-2 fw-bold">TIẾP TỤC MUA SẮM</router-link>
    </div>
  </div>
</template>

<style scoped>
.product-card { transition: 0.3s; background: #fff; position: relative; }
.product-card:hover { transform: translateY(-8px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
.img-container { height: 240px; }
.product-img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.product-card:hover .product-img { transform: scale(1.08); }
.product-actions { position: absolute; bottom: 15px; left: 0; right: 0; text-align: center; transition: 0.3s; z-index: 3; pointer-events: auto; }
.btn-white { background: #fff; border: none; width: 35px; height: 35px; display: inline-flex; align-items: center; justify-content: center; position: relative; z-index: 4; }
.btn-white:hover { background: #f8f9fa; transform: scale(1.1); }
.product-badge { position: absolute; top: 10px; left: 10px; font-size: 10px; padding: 2px 8px; border-radius: 50px; font-weight: bold; }
.product-title { font-size: 14px; height: 42px; overflow: hidden; color: #333; line-height: 1.5; }
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.stretched-link {
  z-index: 1;
}
</style>
