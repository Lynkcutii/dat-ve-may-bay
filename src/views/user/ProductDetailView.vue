<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cart';
import { API_BASE_URL } from '@/config';
import { ElMessage } from 'element-plus';

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
    variants.value = varRes.data.map((variant) => ({
      ...variant,
      mauSac: variant.mauSac
        ? { ...variant.mauSac, ten: normalizeColorName(variant.mauSac) }
        : variant.mauSac
    }));

    selectedImage.value = product.value?.hinhAnhs?.[0]?.url || 'https://placehold.co/900x1200';

    if (variants.value.length > 0) {
      selectedColor.value = variants.value[0].mauSac.ten;
      selectedSize.value = variants.value[0].kichThuoc.ten;
    }
  } catch (error) {
    console.error('Error fetching product detail:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

watch(() => route.params.id, () => {
  quantity.value = 1;
  fetchData();
});

const handleSelectImage = (imageUrl) => {
  selectedImage.value = imageUrl;
};

const colors = computed(() => {
  const uniqueColors = [];
  const seen = new Set();

  variants.value.forEach((v) => {
    if (v.mauSac && !seen.has(v.mauSac.id)) {
      seen.add(v.mauSac.id);
      uniqueColors.push(v.mauSac);
    }
  });

  return uniqueColors;
});

const sizes = computed(() => {
  const allSizes = variants.value
    .filter((v) => v.mauSac.ten === selectedColor.value)
    .map((v) => v.kichThuoc.ten);

  return [...new Set(allSizes)];
});

const selectedVariant = computed(() =>
  variants.value.find(
    (v) => v.mauSac.ten === selectedColor.value && v.kichThuoc.ten === selectedSize.value
  )
);

const isOutOfStock = computed(() => selectedVariant.value && selectedVariant.value.soLuong <= 0);

const isColorOutOfStock = (colorName) => {
  const colorVariants = variants.value.filter((v) => v.mauSac.ten === colorName);
  return colorVariants.every((v) => v.soLuong <= 0);
};

const isSizeOutOfStock = (sizeName) => {
  const variant = variants.value.find(
    (v) => v.mauSac.ten === selectedColor.value && v.kichThuoc.ten === sizeName
  );
  return variant ? variant.soLuong <= 0 : true;
};

const getDiscountedPrice = (variant) => {
  if (!variant) return 0;
  return variant.giaSauGiam || variant.giaBan;
};

const hasPromotion = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.giaSauGiam < selectedVariant.value.giaBan;
  }
  return product.value && product.value.giaSauGiam < product.value.giaGoc;
});

const currentPrice = computed(() => {
  if (selectedVariant.value) {
    return getDiscountedPrice(selectedVariant.value);
  }
  return product.value?.giaSauGiam || product.value?.giaGoc || 0;
});

const originalPrice = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.giaBan || 0;
  }
  return product.value?.giaGoc || 0;
});

const discountPercent = computed(() => {
  if (!hasPromotion.value || !originalPrice.value) return 0;
  return Math.max(0, Math.round((1 - currentPrice.value / originalPrice.value) * 100));
});

const stockLabel = computed(() => {
  if (!selectedVariant.value) return 'Chọn biến thể để xem tồn kho';
  if (isOutOfStock.value) return 'Hết hàng';
  if (selectedVariant.value.soLuong <= 5) return `Sắp hết hàng, còn ${selectedVariant.value.soLuong} sản phẩm`;
  return `Có sẵn ${selectedVariant.value.soLuong} sản phẩm`;
});

const shortDescription = computed(() => {
  const description = product.value?.moTa?.trim();
  if (description) return description;
  return 'Thiết kế thể thao gọn gàng, dễ vận động và phù hợp cho cả tập luyện lẫn mặc hàng ngày.';
});

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getColorCode = (colorName) => {
  const colorMap = {
    DEN: '#1a1a1a',
    TRANG: '#ffffff',
    DO: '#e63946',
    XANH: '#2563eb',
    XANH_DUONG: '#2563eb',
    XANH_LA: '#10b981',
    VANG: '#facc15',
    HONG: '#f472b6',
    XAM: '#64748b',
    CAM: '#f97316',
    Den: '#1a1a1a',
    Trang: '#ffffff',
    Do: '#e63946',
    Xanh: '#2563eb',
    'Xanh dương': '#2563eb',
    'Xanh lá': '#10b981',
    Vàng: '#facc15',
    Hồng: '#f472b6',
    Xám: '#64748b',
    Cam: '#f97316'
  };

  return colorMap[colorName] || '#cccccc';
};

const handleAddToCart = async () => {
  if (!cartStore.userId) {
    ElMessage.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
    router.push('/login');
    return;
  }

  if (!selectedVariant.value) {
    ElMessage.warning('Vui lòng chọn màu sắc và kích thước');
    return;
  }

  try {
    await cartStore.addToCart(selectedVariant.value.id, quantity.value);
    ElMessage.success('Đã thêm vào giỏ hàng');
  } catch (error) {
    console.error('Chi tiết lỗi:', error.response?.data);
    let errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
    if (errorMsg === 'Vượt quá tồn kho' || errorMsg === 'Vuot qua ton kho') {
      errorMsg = 'Số lượng vượt mức tồn kho';
    }
    errorMsg = error.response?.data?.error || error.response?.data || errorMsg;
    if (String(errorMsg).includes('Vuot qua ton kho') || String(errorMsg).includes('Vượt quá tồn kho')) {
      errorMsg = 'Số lượng vượt mức tồn kho';
    }
    ElMessage.error(errorMsg);
  }
};

const incrementQty = () => {
  if (selectedVariant.value?.soLuong && quantity.value < selectedVariant.value.soLuong) {
    quantity.value++;
  }
};

const decrementQty = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};
</script>

<template>
  <div class="product-detail-page py-4 py-lg-5">
    <div class="detail-glow detail-glow-left"></div>
    <div class="detail-glow detail-glow-right"></div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="product" class="container position-relative">
      <div class="detail-shell row g-4 g-xl-5 align-items-start">
        <div class="col-lg-8">
          <div class="gallery-frame">
            <div class="gallery-thumbs">
              <img
                v-for="(img, i) in product.hinhAnhs"
                :key="i"
                :src="img.url"
                class="thumb"
                :class="{ active: selectedImage === img.url }"
                alt="Thumb"
                @click="handleSelectImage(img.url)"
              >
              <img
                v-if="!product.hinhAnhs || product.hinhAnhs.length === 0"
                src="https://placehold.co/100x120"
                class="thumb"
                alt="Thumb"
              >
            </div>

            <div class="hero-visual">
              <div class="gallery-chip">
                <span class="gallery-chip-dot"></span>
                BeeSport Tuyển Chọn
              </div>
              <img
                :src="selectedImage || 'https://placehold.co/900x1200'"
                class="hero-image"
                alt="Main Product Image"
              >
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="info-panel">
            <nav aria-label="breadcrumb" class="mb-3">
              <ol class="breadcrumb detail-breadcrumb small">
                <li class="breadcrumb-item"><router-link to="/" class="text-decoration-none">TRANG CHỦ</router-link></li>
                <li class="breadcrumb-item"><router-link to="/products" class="text-decoration-none">SẢN PHẨM</router-link></li>
                <li class="breadcrumb-item active fw-bold">CHI TIẾT</li>
              </ol>
            </nav>

            <div class="eyebrow-row">
              <span class="sport-tag">{{ product.danhMuc?.ten || 'BeeSport' }}</span>
              <span v-if="hasPromotion && discountPercent" class="sale-pill">GIẢM {{ discountPercent }}%</span>
            </div>

            <h1 class="product-title">{{ product.tenSanPham }}</h1>

            <div class="rating-row">
              <div class="stars">
                <i class="fas fa-star" v-for="i in 5" :key="i"></i>
              </div>
              <span class="rating-text">5.0 (12 đánh giá)</span>
            </div>

            <p class="product-copy">{{ shortDescription }}</p>

            <div class="price-container">
              <div class="price-main-wrap">
                <span class="price-current">{{ formatPrice(currentPrice) }}</span>
                <span v-if="hasPromotion" class="price-original">{{ formatPrice(originalPrice) }}</span>
              </div>
              <div v-if="selectedVariant" class="stock-badge" :class="{ 'out-of-stock': isOutOfStock }">
                <i class="fas" :class="isOutOfStock ? 'fa-times-circle' : 'fa-check-circle'"></i>
                {{ stockLabel }}
              </div>
            </div>

            <div class="selection-card">
              <div class="picker-block">
                <div class="picker-head">
                  <h6>Màu sắc: <span class="selected-value">{{ selectedColor }}</span></h6>
                </div>
                <div class="swatch-row">
                  <button
                    v-for="color in colors"
                    :key="color.id"
                    type="button"
                    class="color-swatch"
                    :style="{ backgroundColor: getColorCode(color.ten) }"
                    :class="{ active: selectedColor === color.ten, 'out-of-stock': isColorOutOfStock(color.ten) }"
                    @click="selectedColor = color.ten"
                    :title="color.ten"
                  >
                    <span class="visually-hidden">{{ color.ten }}</span>
                  </button>
                </div>
              </div>

              <div class="picker-block">
                <div class="picker-head">
                  <h6>Kích thước: <span class="selected-value">{{ selectedSize }}</span></h6>
                </div>
                <div class="size-grid">
                  <button
                    v-for="size in sizes"
                    :key="size"
                    type="button"
                    class="size-box"
                    :class="{ active: selectedSize === size, 'out-of-stock': isSizeOutOfStock(size) }"
                    @click="selectedSize = size"
                  >
                    {{ size }}
                  </button>
                </div>
              </div>
            </div>

            <div class="purchase-card">
              <div class="purchase-head">
                <div>
                  <h6>Số lượng</h6>
                  <span>Điều chỉnh trước khi thêm vào giỏ</span>
                </div>
              </div>

              <div class="purchase-row">
                <div class="qty-container">
                  <button @click="decrementQty" class="qty-btn" :disabled="isOutOfStock">
                    <i class="fas fa-minus small"></i>
                  </button>
                  <input
                    type="number"
                    v-model.number="quantity"
                    class="qty-input no-arrows"
                    :disabled="isOutOfStock"
                    min="1"
                    :max="selectedVariant?.soLuong || 1"
                  >
                  <button
                    @click="incrementQty"
                    class="qty-btn"
                    :disabled="isOutOfStock || (selectedVariant && quantity >= selectedVariant.soLuong)"
                  >
                    <i class="fas fa-plus small"></i>
                  </button>
                </div>

                <button @click="handleAddToCart" class="add-cart-btn" :disabled="isOutOfStock">
                  <i class="fas fa-shopping-cart me-2"></i>
                  {{ isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG' }}
                </button>
              </div>
            </div>

            <div class="meta-strip">
              <div class="meta-item">
                <span class="meta-label">Danh mục</span>
                <span class="meta-value">{{ product.danhMuc?.ten }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Chia sẻ</span>
                <div class="share-row">
                  <a href="#" class="share-link"><i class="fab fa-facebook-f"></i></a>
                  <a href="#" class="share-link"><i class="fab fa-twitter"></i></a>
                  <a href="#" class="share-link"><i class="fab fa-instagram"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-detail-page {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 166, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 107, 107, 0.06), transparent 25%),
    linear-gradient(180deg, #f8fbfc 0%, #ffffff 40%);
  min-height: 100vh;
}

.detail-shell {
  position: relative;
  z-index: 1;
}

.gallery-frame {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 20px;
  align-items: stretch;
}

.gallery-thumbs {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 700px;
  overflow-y: auto;
  scrollbar-width: none;
}

.gallery-thumbs::-webkit-scrollbar {
  display: none;
}

.thumb {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 16px;
  border: 2px solid transparent;
  opacity: 0.6;
  cursor: pointer;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.thumb:hover,
.thumb.active {
  opacity: 1;
  transform: scale(1.05);
  border-color: #0b6f68;
  box-shadow: 0 8px 24px rgba(11, 111, 104, 0.15);
}

.hero-visual {
  position: relative;
  min-height: 700px;
  border-radius: 40px;
  overflow: hidden;
  background: #f1f5f9;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.08);
}

.gallery-chip {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 99px;
  color: #1a2b36;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.gallery-chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  position: relative;
}

.gallery-chip-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: #10b981;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.3; }
  70% { transform: scale(2); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info-panel {
  padding: 10px 0;
}

.detail-breadcrumb {
  margin-bottom: 24px;
}

.detail-breadcrumb .breadcrumb-item {
  font-size: 13px;
  letter-spacing: 0.05em;
}

.detail-breadcrumb a {
  color: #94a3ad;
  transition: color 0.2s ease;
}

.detail-breadcrumb a:hover {
  color: #0b6f68;
}

.eyebrow-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.sport-tag {
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6f68;
  background: #e6f7f5;
  text-transform: uppercase;
}

.sale-pill {
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: #e63946;
}

.product-title {
  margin-bottom: 12px;
  font-size: clamp(1.8rem, 2.5vw, 2.8rem);
  font-weight: 900;
  color: #1a2b36;
  line-height: 1.15;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.stars {
  color: #fbbf24;
  font-size: 13px;
}

.rating-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.product-copy {
  margin-bottom: 20px;
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
}

.price-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #f8fafc;
  border-radius: 16px;
  margin-bottom: 24px;
}

.price-main-wrap {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.price-current {
  font-size: 28px;
  font-weight: 800;
  color: #e63946;
  letter-spacing: -0.02em;
}

.price-original {
  font-size: 15px;
  color: #94a3b8;
  text-decoration: line-through;
  font-weight: 500;
}

.stock-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid #dcfce7;
}

.stock-badge.out-of-stock {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fee2e2;
}

.selection-card,
.purchase-card {
  padding: 18px 20px;
  border-radius: 20px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.picker-block + .picker-block {
  margin-top: 18px;
}

.picker-head {
  margin-bottom: 12px;
}

.picker-head h6 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a2b36;
}

.selected-value {
  color: #0b6f68;
  font-weight: 800;
  margin-left: 4px;
}

.swatch-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.color-swatch:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
}

.color-swatch.active {
  transform: translateY(-3px);
  box-shadow: 0 0 0 2px #0b6f68, 0 6px 12px rgba(0, 0, 0, 0.12);
}

.color-swatch.out-of-stock {
  opacity: 0.4;
  position: relative;
  cursor: not-allowed;
}

.color-swatch.out-of-stock::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 2px;
  background: #e63946;
  transform: translate(-50%, -50%) rotate(45deg);
}

.size-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.size-box {
  min-width: 56px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-weight: 700;
  color: #1a2b36;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-box:hover {
  border-color: #0b6f68;
  color: #0b6f68;
  background: #f0fdfa;
  transform: translateY(-2px);
}

.size-box.active {
  background: #1a2b36;
  border-color: #1a2b36;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(26, 43, 54, 0.15);
}

.size-box.out-of-stock {
  opacity: 0.3;
  cursor: not-allowed;
  background: #f1f5f9;
  text-decoration: line-through;
}

.purchase-card {
  padding: 24px;
  border-radius: 28px;
  margin-bottom: 24px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.purchase-head {
  margin-bottom: 16px;
}

.purchase-head h6 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1a2b36;
}

.purchase-head span {
  font-size: 12px;
  color: #64748b;
}

.purchase-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.qty-container {
  display: flex;
  align-items: center;
  padding: 4px;
  background: #f8fafc;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  height: 48px;
}

.qty-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  color: #1a2b36;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.qty-btn:hover:not(:disabled) {
  background: #1a2b36;
  color: #ffffff;
  transform: scale(1.05);
}

.qty-input {
  width: 50px;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: 800;
  font-size: 16px;
  color: #1a2b36;
  outline: none;
}

.add-cart-btn {
  flex: 1;
  height: 48px;
  border-radius: 99px;
  border: none;
  background: linear-gradient(135deg, #102632, #1b4753);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 12px 28px rgba(16, 38, 50, 0.2);
}

.add-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(16, 38, 50, 0.25);
}

.add-cart-btn:disabled {
  background: #94a3ad;
  box-shadow: none;
  cursor: not-allowed;
}

.meta-strip {
  display: flex;
  justify-content: space-between;
  padding: 18px 20px;
  border-radius: 20px;
  background: #f8fafb;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3ad;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font-size: 14px;
  font-weight: 700;
  color: #1a2b36;
}

.share-row {
  display: flex;
  gap: 10px;
}

.share-link {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  color: #1a2b36;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.share-link:hover {
  background: #1a2b36;
  color: #fff;
  transform: translateY(-3px);
}

@media (max-width: 991px) {
  .gallery-frame {
    grid-template-columns: 1fr;
  }

  .gallery-thumbs {
    order: 2;
    flex-direction: row;
    overflow-x: auto;
    padding: 4px 0;
  }

  .thumb {
    width: 80px;
    min-width: 80px;
  }

  .hero-visual {
    min-height: 500px;
  }
}

@media (max-width: 767px) {
  .product-title {
    font-size: 1.8rem;
  }

  .purchase-row {
    flex-direction: column;
    align-items: stretch;
  }

  .price-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
