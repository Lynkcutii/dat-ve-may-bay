<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { useWishlistStore } from '@/stores/wishlist';
import { useRouter } from 'vue-router';

const router = useRouter();
const wishlistStore = useWishlistStore();
const apiBaseUrl = `${API_BASE_URL}/api/user`;

const bestSellers = ref([]);
const loading = ref(true);

// --- SLIDER BANNER (Theo ảnh mẫu) ---
const currentSlide = ref(0);
const slides = [
  {
    image: '/src/img/sl1.jpg',
    badge: 'NEW COLLECTION 2024',
    title: 'BEE SPORT',
    subtitle: 'RACQUET COLLECTION',
    description: 'Nâng tầm phong độ với những thiết kế đột phá, chất liệu cao cấp dành riêng cho phái mạnh.',
  },
  {
    image: '/src/img/sl2.jpg',
    badge: 'NEW COLLECTION 2024',
    title: 'TRAINING GEAR',
    subtitle: 'POWER COLLECTION',
    description: 'Tự tin bứt phá mọi giới hạn với trang phục thể thao hiện đại, thoáng mát.',
  },
  {
    image: '/src/img/b4.jpg',
    badge: 'NEW COLLECTION 2024',
    title: 'ACTIVE WEAR',
    subtitle: 'MODERN COLLECTION',
    description: 'Thanh lịch, gọn gàng và dễ phối cho phong cách tập luyện chuyên nghiệp.',
  },
];

let slideInterval;
onMounted(() => {
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length;
  }, 5000);
});

onUnmounted(() => {
  clearInterval(slideInterval);
});

// --- API DATA ---
const fetchBestSellers = async () => {
  try {
    loading.value = true;
    const prodRes = await axios.get(`${apiBaseUrl}/products`);
    bestSellers.value = prodRes.data.slice(0, 4).map(p => ({
      id: p.id,
      name: p.tenSanPham,
      price: p.giaBanMin,
      originalPrice: p.giaGoc,
      hasPromotion: p.giaBanMin < p.giaGoc,
      image: p.hinhAnhs && p.hinhAnhs.length > 0 ? p.hinhAnhs[0].url : 'https://placehold.co/400x400?text=No+Image'
    }));
  } catch (error) {
    console.error("Error fetching best sellers:", error);
  } finally {
    loading.value = false;
  }
};

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

onMounted(() => {
  fetchBestSellers();
  wishlistStore.fetchWishlist();
});

const featuredCategories = [
  {
    title: 'CHẠY BỘ',
    subtitle: 'Bứt phá tốc độ',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop',
    accent: 'Running',
  },
  {
    title: 'CẦU LÔNG',
    subtitle: 'Làm chủ mọi đường cầu',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    accent: 'Badminton',
  },
  {
    title: 'ĐÁ BÓNG',
    subtitle: 'Giữ vững niềm đam mê',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
    accent: 'Football',
  },
]
</script>

<template>
  <div class="home-page">
    <!-- SLIDER BANNER (Mẫu BEE SPORT) -->
    <section class="banner-slider">
      <div 
        v-for="(slide, index) in slides" 
        :key="index"
        class="slide"
        :class="{ active: currentSlide === index }"
        :style="{ backgroundImage: `url(${slide.image})` }"
      >
        <div class="container h-100 position-relative">
          <div class="slide-content text-start">
            <span class="slide-badge mb-3">{{ slide.badge }}</span>
            <div class="title-group mb-4">
              <h1 class="slide-title">{{ slide.title }}</h1>
              <h2 class="slide-subtitle">{{ slide.subtitle }}</h2>
            </div>
            <p class="slide-desc mb-5">{{ slide.description }}</p>
            <div class="slide-actions d-flex gap-3">
              <router-link to="/products" class="btn btn-red-dark rounded-pill px-4 py-2 fw-bold">MUA NGAY</router-link>
              <router-link to="/about" class="btn btn-outline-white rounded-pill px-4 py-2 fw-bold">TÌM HIỂU THÊM</router-link>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Slider indicators (dots) -->
      <div class="slider-indicators">
        <span 
          v-for="(_, index) in slides" 
          :key="index" 
          class="indicator"
          :class="{ active: currentSlide === index }"
          @click="currentSlide = index"
        ></span>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="category-section py-5">
      <div class="container">
        <div class="section-heading text-center mb-5">
          <span class="section-kicker">Danh muc noi bat</span>
          <h2>CHỌN NHANH BỘ SƯU TẬP</h2>
        </div>

        <div class="category-grid">
          <router-link
            v-for="category in featuredCategories"
            :key="category.title"
            to="/products"
            class="category-card"
          >
            <img :src="category.image" :alt="category.title">
            <div class="category-overlay"></div>
            <div class="category-content text-center">
              <span>{{ category.accent }}</span>
              <h3>{{ category.title }}</h3>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- BEST SELLERS -->
    <section class="best-sellers py-5 bg-white">
      <div class="container">
        <div class="section-heading text-center mb-5">
          <h2 class="fw-bold">SẢN PHẨM BÁN CHẠY</h2>
          <p class="text-muted">Khám phá những mẫu thiết kế được yêu thích nhất.</p>
        </div>
        
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status"></div>
        </div>
        <div v-else class="row g-4">
          <div class="col-6 col-md-3" v-for="product in bestSellers" :key="product.id">
            <div class="product-card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
              <div class="img-wrapper position-relative" style="height: 250px; overflow: hidden;">
                <img :src="product.image" class="w-100 h-100 object-fit-cover transition-all" :alt="product.name">
                <div v-if="product.hasPromotion" class="badge bg-danger position-absolute top-0 start-0 m-3">SALE</div>
              </div>
              <div class="p-3 text-center">
                <h6 class="fw-bold text-truncate mb-2">{{ product.name }}</h6>
                <div class="d-flex justify-content-center align-items-center gap-2">
                  <span class="text-danger fw-bold">{{ formatPrice(product.price) }}</span>
                  <small v-if="product.hasPromotion" class="text-muted text-decoration-line-through">{{ formatPrice(product.originalPrice) }}</small>
                </div>
              </div>
              <router-link :to="'/product/' + product.id" class="stretched-link"></router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* BANNER SLIDER (BEE SPORT Style) */
.banner-slider {
  position: relative;
  height: 600px;
  overflow: hidden;
  background: #000;
}

.slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  display: flex;
  align-items: center;
}

.slide.active {
  opacity: 1;
  z-index: 1;
}

.slide-content {
  z-index: 2;
  max-width: 600px;
  color: #fff;
  padding-left: 20px;
}

.slide-badge {
  display: inline-block;
  background: rgba(139, 0, 0, 0.8);
  color: #fff;
  padding: 5px 15px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
}

.slide-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  line-height: 0.9;
  margin: 0;
  letter-spacing: -2px;
  color: rgba(255, 255, 255, 0.95);
}

.slide-subtitle {
  font-size: clamp(1rem, 3vw, 2.5rem);
  font-weight: 700;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 2px;
}

.slide-desc {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 500px;
  line-height: 1.6;
}

.btn-red-dark {
  background: #5c1414;
  color: #fff;
  border: none;
  font-size: 13px;
  letter-spacing: 1px;
}

.btn-outline-white {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.5);
  font-size: 13px;
  letter-spacing: 1px;
}

.btn-red-dark:hover, .btn-outline-white:hover {
  transform: scale(1.05);
  color: #fff;
}

.slider-indicators {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  gap: 15px;
}

.indicator {
  width: 30px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: 0.3s;
}

.indicator.active {
  background: #fff;
  width: 50px;
}

/* CATEGORY & PRODUCTS */
.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.category-card {
  position: relative;
  display: block;
  min-height: 400px;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.category-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1s ease;
}

.category-card:hover img {
  transform: scale(1.1);
}

.category-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 50%);
}

.category-content {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  color: #fff;
}

.category-content h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.product-card:hover img {
  transform: scale(1.1);
}

.transition-all {
  transition: all 0.5s ease;
}

@media (max-width: 991px) {
  .banner-slider { height: 450px; }
  .category-grid { grid-template-columns: 1fr; }
  .feature-strip .col-6 { border-bottom: none; }
}
</style>
