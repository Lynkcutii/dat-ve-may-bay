<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cart';
import { API_BASE_URL } from '@/config';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const apiBaseUrl = `${API_BASE_URL}/api/user`;

const product = ref(null);
const variants = ref([]);
const loading = ref(true);
const quantity = ref(1);
const selectedImage = ref('');

const selectedColor = ref(null);
const selectedSize = ref(null);

const normalizeColorName = (color) => {
  const rawName = color?.ten ?? '';
  const code = String(color?.ma ?? rawName).trim().toUpperCase();

  const colorMap = {
    DEN: 'Đen',
    TRANG: 'Trắng',
    DO: 'Đỏ',
    XANH: 'Xanh',
    XANH_DUONG: 'Xanh dương',
    XANH_LA: 'Xanh lá',
    VANG: 'Vàng',
    HONG: 'Hồng',
    XAM: 'Xám',
    CAM: 'Cam'
  };

  return colorMap[code] || rawName;
};

const fetchData = async () => {
  try {
    loading.value = true;
    const [prodRes, varRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/products/${route.params.id}`),
      axios.get(`${apiBaseUrl}/products/${route.params.id}/variants`)
    ]);
    product.value = prodRes.data;
    variants.value = varRes.data.map(variant => ({
      ...variant,
      mauSac: variant.mauSac
        ? { ...variant.mauSac, ten: normalizeColorName(variant.mauSac) }
        : variant.mauSac
    }));
    selectedImage.value = product.value?.hinhAnhs?.[0]?.url || 'https://placehold.co/600x750';
    
    if (variants.value.length > 0) {
      selectedColor.value = variants.value[0].mauSac.ten;
      selectedSize.value = variants.value[0].kichThuoc.ten;
    }
  } catch (error) {
    console.error("Error fetching product detail:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const handleSelectImage = (imageUrl) => {
  selectedImage.value = imageUrl;
};

const colors = computed(() => {
  const uniqueColors = [];
  const seen = new Set();
  variants.value.forEach(v => {
    if (v.mauSac && !seen.has(v.mauSac.id)) {
      seen.add(v.mauSac.id);
      uniqueColors.push(v.mauSac);
    }
  });
  return uniqueColors;
});

const sizes = computed(() => {
  const allSizes = variants.value
    .filter(v => v.mauSac.ten === selectedColor.value)
    .map(v => v.kichThuoc.ten);
  return [...new Set(allSizes)];
});

const selectedVariant = computed(() => {
  return variants.value.find(v => v.mauSac.ten === selectedColor.value && v.kichThuoc.ten === selectedSize.value);
});

const isOutOfStock = computed(() => {
  return selectedVariant.value && selectedVariant.value.soLuong <= 0;
});

const isColorOutOfStock = (colorName) => {
  const colorVariants = variants.value.filter(v => v.mauSac.ten === colorName);
  return colorVariants.every(v => v.soLuong <= 0);
};

const isSizeOutOfStock = (sizeName) => {
  const variant = variants.value.find(v => v.mauSac.ten === selectedColor.value && v.kichThuoc.ten === sizeName);
  return variant ? variant.soLuong <= 0 : true;
};

const getDiscountedPrice = (variant) => {
  if (!variant) return 0;
  // logic khuyến mại đã được BE tính toán sẵn (giả sử BE trả về giá sau giảm trong variants nếu cần)
  // Tuy nhiên ở đây BE trả về SanPhamChiTiet.giaBan là giá gốc.
  // Ta cần check khuyến mại từ product.giaSauGiam / giaGoc tỉ lệ
  if (!product.value || !product.value.giaGoc) return variant.giaBan;
  
  const ratio = (product.value.giaSauGiam || product.value.giaGoc) / product.value.giaGoc;
  return variant.giaBan * ratio;
};

const hasPromotion = computed(() => {
  return product.value && product.value.giaSauGiam < product.value.giaGoc;
});

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getColorCode = (colorName) => {
  const colorMap = {
    'DEN': '#000000',
    'TRANG': '#FFFFFF',
    'DO': '#FF0000',
    'XANH': '#0000FF',
    'XANH_DUONG': '#0000FF',
    'XANH_LA': '#00FF00',
    'VANG': '#FFFF00',
    'HONG': '#FFC0CB',
    'XAM': '#808080',
    'CAM': '#FFA500',
    'Đen': '#000000',
    'Trắng': '#FFFFFF',
    'Đỏ': '#FF0000',
    'Xanh': '#0000FF',
    'Xanh dương': '#0000FF',
    'Xanh lá': '#00FF00',
    'Vàng': '#FFFF00',
    'Hồng': '#FFC0CB',
    'Xám': '#808080',
    'Cam': '#FFA500'
  };
  return colorMap[colorName] || '#CCCCCC';
};

const handleAddToCart = async () => {
  if (!cartStore.userId) {
    alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
    router.push('/login');
    return;
  }
  
  if (!selectedVariant.value) {
    alert("Vui lòng chọn màu sắc và kích thước!");
    return;
  }

  // Debug thử xem ID và số lượng có chuẩn không
  const finalPrice = getDiscountedPrice(selectedVariant.value);
  console.log("Adding to cart - ID:", selectedVariant.value.id, "Qty:", quantity.value, "Price:", finalPrice);

  try {
    await cartStore.addToCart(selectedVariant.value.id, quantity.value, finalPrice);
    alert("Đã thêm vào giỏ hàng!");
  } catch (error) {
    // In lỗi chi tiết ra console để xem BE trả về gì
    console.error("Chi tiết lỗi:", error.response?.data);
    alert("Lỗi từ hệ thống: " + (error.response?.data?.message || "Có lỗi xảy ra"));
  }
};

const incrementQty = () => {
  quantity.value++;
};

const decrementQty = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};
</script>

<template>
  <div class="container py-5">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="product" class="row g-5">
      <!-- Product Images -->
      <div class="col-lg-7">
        <div class="row g-3">
          <div class="col-2">
            <div class="d-flex flex-column gap-3 thumb-container">
              <img
                v-for="(img, i) in product.hinhAnhs"
                :key="i"
                :src="img.url"
                class="img-fluid rounded-3 cursor-pointer border shadow-sm thumb"
                :class="{ active: selectedImage === img.url }"
                alt="Thumb"
                @click="handleSelectImage(img.url)"
              >
              <img v-if="!product.hinhAnhs || product.hinhAnhs.length === 0" src="https://placehold.co/100x120" class="img-fluid rounded-3 cursor-pointer border shadow-sm thumb" alt="Thumb">
            </div>
          </div>
          <div class="col-10">
            <div class="main-img-container bg-white rounded-4 shadow-sm overflow-hidden border">
              <img :src="selectedImage || 'https://placehold.co/600x750'" class="img-fluid w-100 h-100 object-fit-cover" alt="Main Product Image">
            </div>
          </div>
        </div>
      </div>

      <!-- Product Info -->
      <div class="col-lg-5">
        <div class="ps-lg-4">
          <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb small">
              <li class="breadcrumb-item"><router-link to="/" class="text-secondary text-decoration-none">TRANG CHỦ</router-link></li>
              <li class="breadcrumb-item"><router-link to="/products" class="text-secondary text-decoration-none">SẢN PHẨM</router-link></li>
              <li class="breadcrumb-item active fw-bold text-dark">CHI TIẾT</li>
            </ol>
          </nav>

          <h2 class="fw-bold mb-3">{{ product.tenSanPham }}</h2>
          <div class="d-flex align-items-center mb-4">
            <div class="text-warning me-2 small">
              <i class="fas fa-star" v-for="i in 5" :key="i"></i>
            </div>
            <span class="text-secondary small">(12 đánh giá)</span>
          </div>

          <div v-if="hasPromotion" class="mb-4">
            <span class="text-muted text-decoration-line-through me-3 fs-5">
              {{ selectedVariant ? formatPrice(selectedVariant.giaBan) : formatPrice(product.giaGoc) }}
            </span>
            <span class="text-danger fw-bold fs-2">
              {{ selectedVariant ? formatPrice(getDiscountedPrice(selectedVariant)) : formatPrice(product.giaSauGiam) }}
            </span>
          </div>
          <h3 v-else class="text-danger fw-bold mb-4 fs-2">
            {{ selectedVariant ? formatPrice(selectedVariant.giaBan) : formatPrice(product.giaGoc) }}
          </h3>
          
          <p class="text-secondary mb-5 small lh-lg">
            {{ product.moTa }}
          </p>

          <div class="mb-4">
            <h6 class="fw-bold small mb-3 text-uppercase">Màu sắc: <span class="text-secondary fw-normal">{{ selectedColor }}</span></h6>
            <div class="d-flex gap-2">
              <div 
                v-for="color in colors" 
                :key="color.id" 
                class="color-swatch" 
                :style="{ backgroundColor: getColorCode(color.ten) }"
                :class="{ active: selectedColor === color.ten, 'out-of-stock': isColorOutOfStock(color.ten) }"
                @click="selectedColor = color.ten"
                :title="color.ten + (isColorOutOfStock(color.ten) ? ' (Hết hàng)' : '')"
              ></div>
            </div>
          </div>

          <div class="mb-5">
            <h6 class="fw-bold small mb-3 text-uppercase">Kích thước: <span class="text-secondary fw-normal">{{ selectedSize }}</span></h6>
            <div class="d-flex gap-2">
              <div 
                v-for="size in sizes" 
                :key="size" 
                class="size-box"
                :class="{ active: selectedSize === size, 'out-of-stock': isSizeOutOfStock(size) }"
                @click="selectedSize = size"
              >{{ size }}</div>
            </div>
            <p v-if="selectedVariant" class="mt-3 small mb-0" :class="isOutOfStock ? 'text-danger fw-bold' : 'text-secondary'">
              {{ isOutOfStock ? 'Hết hàng' : 'Còn lại: ' + selectedVariant.soLuong }}
            </p>
          </div>

          <!-- Actions -->
          <div class="row g-3 mb-5">
            <div class="col-4">
              <div class="qty-container d-flex align-items-center justify-content-between border rounded-pill px-3 py-1">
                <button @click="decrementQty" class="btn btn-link text-dark p-0 shadow-none" :disabled="isOutOfStock"><i class="fas fa-minus small"></i></button>
                <input 
                  type="number" 
                  v-model.number="quantity" 
                  class="form-control border-0 bg-transparent text-center p-0 fw-bold shadow-none no-arrows" 
                  style="width: 40px;"
                  :disabled="isOutOfStock"
                  min="1"
                  :max="selectedVariant?.soLuong || 1"
                >
                <button @click="incrementQty" class="btn btn-link text-dark p-0 shadow-none" :disabled="isOutOfStock || (selectedVariant && quantity >= selectedVariant.soLuong)"><i class="fas fa-plus small"></i></button>
              </div>
            </div>
            <div class="col-8">
              <button @click="handleAddToCart" class="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow-sm" :disabled="isOutOfStock">
                <i class="fas fa-shopping-cart me-2"></i> {{ isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG' }}
              </button>
            </div>
          </div>

          <!-- Meta -->
          <div class="pt-4 border-top">
            <p class="small mb-2"><span class="fw-bold me-2">DANH MỤC:</span> <span class="text-secondary">{{ product.danhMuc?.ten }}</span></p>
            <div class="d-flex gap-3 mt-4">
              <a href="#" class="text-secondary small text-decoration-none"><i class="fab fa-facebook me-1"></i> Chia sẻ</a>
              <a href="#" class="text-secondary small text-decoration-none"><i class="fab fa-twitter me-1"></i> Tweet</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.thumb-container .thumb {
  opacity: 0.6;
  transition: 0.3s;
}
.thumb-container .thumb:hover, .thumb-container .thumb.active {
  opacity: 1;
  border-color: #000 !important;
}
.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #ddd;
}
.color-swatch.active {
  box-shadow: 0 0 0 2px #000;
}
.color-swatch.out-of-stock {
  opacity: 0.3;
  position: relative;
}
.color-swatch.out-of-stock::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 1px;
  background: #000;
  transform: translate(-50%, -50%) rotate(45deg);
}
.size-box {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: 0.2s;
}
.size-box:hover, .size-box.active {
  background-color: #000;
  color: #fff;
  border-color: #000;
}
.size-box.out-of-stock {
  opacity: 0.3;
  cursor: not-allowed;
  background-color: #f8f9fa;
  color: #adb5bd;
  text-decoration: line-through;
}
.main-img-container {
  aspect-ratio: 4/5;
}
.no-arrows::-webkit-inner-spin-button,
.no-arrows::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-arrows {
  -moz-appearance: textfield;
}
</style>
