<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

const apiBaseUrl = 'http://localhost:8080/api/user'; // Update if needed

const categories = ref([]);
const allProducts = ref([]);
const loading = ref(true);

// --- FETCH DATA ---
const fetchData = async () => {
  try {
    loading.value = true;
    const [catRes, prodRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/categories`),
      axios.get(`${apiBaseUrl}/products`)
    ]);
    categories.value = catRes.data;
    allProducts.value = prodRes.data.map(p => ({
      id: p.id,
      name: p.ten,
      price: p.giaGoc,
      category: p.danhMuc ? p.danhMuc.ten : 'Khác',
      isNew: true, // Logic for "new" can be added later
      image: p.hinhAnhs && p.hinhAnhs.length > 0 ? p.hinhAnhs[0].url : 'https://placehold.co/400x400?text=No+Image'
    }));
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// --- BIẾN LỌC ---
const maxPrice = ref(5000000);
const selectedCats = ref([]);
const currentPage = ref(1);
const itemsPerPage = 8;
const isFilterOpen = ref(false);

// --- HÀM HỖ TRỢ ---
const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const resetFilter = () => {
  maxPrice.value = 5000000;
  selectedCats.value = [];
  currentPage.value = 1;
};

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value;
};

// --- LOGIC LỌC SẢN PHẨM ---
const filteredProducts = computed(() => {
  return allProducts.value.filter(p => {
    const matchPrice = p.price <= maxPrice.value;
    const matchCat = selectedCats.value.length === 0 || selectedCats.value.includes(p.category);
    return matchPrice && matchCat;
  });
});

// --- LOGIC PHÂN TRANG ---
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});

// Reset về trang 1 khi lọc
watch([maxPrice, selectedCats], () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="container py-4 py-md-5">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Đang tải sản phẩm...</p>
    </div>
    <div v-else class="row g-4">
      <!-- Mobile Filter Toggle -->
      <div class="col-12 d-lg-none mb-2">
        <button class="btn btn-dark w-100 rounded-pill fw-bold" @click="toggleFilter">
          <i class="fas fa-filter me-2"></i> BỘ LỌC TÌM KIẾM
        </button>
      </div>

      <!-- 1. Sidebar Filters -->
      <div class="col-lg-3">
        <div 
          class="filter-sidebar p-4 bg-white rounded-4 shadow-sm"
          :class="{ 'show-mobile': isFilterOpen }"
        >
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0">BỘ LỌC</h5>
            <button class="btn d-lg-none p-0" @click="toggleFilter">
              <i class="fas fa-times fs-4"></i>
            </button>
          </div>
          
          <!-- Lọc theo Giá -->
          <div class="mb-4">
            <h6 class="fw-bold small mb-3 text-uppercase">Giá tối đa: <span class="text-danger">{{ formatPrice(maxPrice) }}</span></h6>
            <input type="range" class="form-range custom-range" min="0" max="10000000" step="100000" v-model="maxPrice">
            <div class="d-flex justify-content-between small text-secondary mt-2">
              <span>0đ</span>
              <span>10.000.000đ</span>
            </div>
          </div>

          <!-- Lọc theo Danh mục -->
          <div class="mb-4">
            <h6 class="fw-bold small mb-3 text-uppercase">Danh mục</h6>
            <div class="form-check mb-2" v-for="cat in categories" :key="cat.id">
              <input class="form-check-input shadow-none" type="checkbox" :id="'cat'+cat.id" :value="cat.ten" v-model="selectedCats">
              <label class="form-check-label small" :for="'cat'+cat.id">{{ cat.ten }}</label>
            </div>
          </div>

          <button class="btn btn-dark w-100 rounded-pill fw-bold btn-sm" @click="resetFilter(); isFilterOpen = false">XÓA BỘ LỌC</button>
        </div>
        <!-- Overlay for mobile filter -->
        <div v-if="isFilterOpen" class="filter-overlay d-lg-none" @click="toggleFilter"></div>
      </div>

      <!-- 2. Product Grid -->
      <div class="col-lg-9">
        <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-4 shadow-sm flex-wrap gap-2">
          <span class="text-secondary small">Tìm thấy <b>{{ filteredProducts.length }}</b> sản phẩm</span>
          <select class="form-select form-select-sm border-0 shadow-none w-auto fw-bold">
            <option>Mới nhất</option>
            <option>Giá thấp đến cao</option>
            <option>Giá cao đến thấp</option>
          </select>
        </div>

        <!-- Thông báo nếu không tìm thấy SP -->
        <div v-if="paginatedProducts.length === 0" class="text-center py-5">
          <i class="fas fa-search fa-3x text-light mb-3"></i>
          <p class="text-muted">Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>

        <!-- Grid sản phẩm -->
        <div class="row g-3 g-md-4">
          <div class="col-6 col-md-4 col-xl-3" v-for="product in paginatedProducts" :key="product.id">
            <div class="product-card card border-0 shadow-sm rounded-4 overflow-hidden h-100">
              <div class="position-relative overflow-hidden img-container">
                <img :src="product.image" class="card-img-top product-img" :alt="product.name">
                <div v-if="product.isNew" class="product-badge bg-danger text-white">MỚI</div>
                <div class="product-actions d-none d-md-block">
                  <button class="btn btn-white btn-sm rounded-circle shadow-sm me-1"><i class="far fa-heart"></i></button>
                  <button class="btn btn-white btn-sm rounded-circle shadow-sm"><i class="fas fa-shopping-bag"></i></button>
                </div>
              </div>
              <div class="card-body p-2 p-md-3 text-center">
                <h6 class="fw-bold mb-1 mb-md-2 product-title text-truncate-2">{{ product.name }}</h6>
                <p class="text-danger fw-bold mb-0 small">{{ formatPrice(product.price) }}</p>
              </div>
              <router-link :to="'/product/' + product.id" class="stretched-link"></router-link>
            </div>
          </div>
        </div>

        <!-- PHÂN TRANG -->
        <nav class="mt-5" v-if="totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage--"><i class="fas fa-chevron-left"></i></a>
            </li>
            <li class="page-item d-none d-sm-block" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
              <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage = page">{{ page }}</a>
            </li>
            <!-- Show only current page on mobile -->
            <li class="page-item d-sm-none active">
               <span class="page-link border-0 shadow-none">{{ currentPage }} / {{ totalPages }}</span>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage++"><i class="fas fa-chevron-right"></i></a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card { transition: 0.3s; background: #fff; }
.product-card:hover { transform: translateY(-8px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
.img-container { height: 180px; }
@media (min-width: 768px) { .img-container { height: 240px; } }

.product-img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.product-card:hover .product-img { transform: scale(1.08); }
.product-actions { position: absolute; bottom: -50px; left: 0; right: 0; text-align: center; transition: 0.3s; opacity: 0; }
.product-card:hover .product-actions { bottom: 15px; opacity: 1; }
.btn-white { background: #fff; border: none; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.product-badge { position: absolute; top: 10px; left: 10px; font-size: 8px; padding: 2px 6px; border-radius: 50px; font-weight: bold; }
.product-title { font-size: 12px; height: 36px; overflow: hidden; color: #333; line-height: 1.5; }
@media (min-width: 768px) { .product-title { font-size: 14px; height: 42px; } }

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-range::-webkit-slider-runnable-track { background: #eee; height: 4px; }
.custom-range::-webkit-slider-thumb { background: #dc3545; margin-top: -6px; }
.page-link { border-radius: 50% !important; margin: 0 3px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; color: #333; font-size: 13px; }
.page-item.active .page-link { background-color: #dc3545 !important; border: none; color: white !important; }

/* Filter Responsive */
@media (max-width: 991.98px) {
  .filter-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    width: 300px;
    height: 100vh;
    z-index: 1050;
    transition: 0.3s;
    overflow-y: auto;
  }
  .filter-sidebar.show-mobile {
    left: 0;
  }
  .filter-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 1040;
  }
}
@media (min-width: 992px) {
  .filter-sidebar {
    position: sticky;
    top: 100px;
  }
}
</style>
