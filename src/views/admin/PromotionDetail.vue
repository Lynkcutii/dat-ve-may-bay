<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const props = defineProps(['id']);
const router = useRouter();
const isEdit = ref(!!props.id);

const promotion = ref({
  maDotGiamGia: '',
  tenDot: '',
  kieuGiamGia: 'PERCENT',
  giaTriGiam: 0,
  ngayBatDau: '',
  ngayKetHuc: '',
  trangThai: true
});

const selectedSpctIds = ref([]);
const productsWithVariants = ref([]);
const expandedProducts = ref(new Set());
const searchQuery = ref('');

const toggleExpand = (productId) => {
  if (expandedProducts.value.has(productId)) {
    expandedProducts.value.delete(productId);
  } else {
    expandedProducts.value.add(productId);
  }
};

const getSelectedCount = (product) => {
  return product.variants.filter(v => selectedSpctIds.value.includes(v.id)).length;
};

const isProductFullySelected = (product) => {
  return product.variants.length > 0 && getSelectedCount(product) === product.variants.length;
};

const isProductPartiallySelected = (product) => {
  const count = getSelectedCount(product);
  return count > 0 && count < product.variants.length;
};

const toggleProductSelection = (product) => {
  const variantIds = product.variants.map(v => v.id);
  const allSelected = isProductFullySelected(product);
  
  if (allSelected) {
    selectedSpctIds.value = selectedSpctIds.value.filter(id => !variantIds.includes(id));
  } else {
    variantIds.forEach(id => {
      if (!selectedSpctIds.value.includes(id)) {
        selectedSpctIds.value.push(id);
      }
    });
  }
};

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return productsWithVariants.value;
  const q = searchQuery.value.toLowerCase();
  return productsWithVariants.value.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.code.toLowerCase().includes(q) ||
    p.variants.some(v => v.code.toLowerCase().includes(q))
  );
});

onMounted(async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/admin/product-details');
    const grouped = res.data.reduce((acc, v) => {
      const pId = v.sanPham?.id;
      if (!acc[pId]) {
        acc[pId] = {
          id: pId,
          code: v.sanPham?.ma,
          name: v.sanPham?.tenSanPham,
          variants: []
        };
      }
      acc[pId].variants.push({
        id: v.id,
        code: v.ma,
        color: v.mauSac?.ten,
        size: v.kichThuoc?.ten,
        material: v.sanPham?.chatLieu?.ten
      });
      return acc;
    }, {});
    productsWithVariants.value = Object.values(grouped);
  } catch (error) {
    console.error("Error fetching variants:", error);
  }

  if (isEdit.value) {
    try {
      const promoRes = await axios.get(`http://localhost:8080/api/admin/promotions/${props.id}`);
      const p = promoRes.data;
      promotion.value = {
        ...p,
        ngayBatDau: p.ngayBatDau?.split('T')[0],
        ngayKetHuc: p.ngayKetHuc?.split('T')[0]
      };

      const selectedRes = await axios.get(`http://localhost:8080/api/admin/promotions/${props.id}/products`);
      selectedSpctIds.value = selectedRes.data;
    } catch (error) {
      console.error("Error fetching promotion details:", error);
    }
  } else {
    // Tự động tạo mã cho đợt giảm giá mới
    promotion.value.maDotGiamGia = 'KM' + Date.now();
  }
});

const handleSave = async () => {
  if (!isEdit.value && !confirm('Xac nhan them moi khuyen mai?')) {
    return;
  }

  try {
    const payload = {
      promotion: {
        ...promotion.value,
        ngayBatDau: promotion.value.ngayBatDau ? (promotion.value.ngayBatDau.includes('T') ? promotion.value.ngayBatDau : promotion.value.ngayBatDau + 'T00:00:00') : null,
        ngayKetHuc: promotion.value.ngayKetHuc ? (promotion.value.ngayKetHuc.includes('T') ? promotion.value.ngayKetHuc : promotion.value.ngayKetHuc + 'T23:59:59') : null
      },
      spctIds: selectedSpctIds.value
    };
    await axios.post('http://localhost:8080/api/admin/promotions', payload);
    alert("Lưu khuyến mãi thành công!");
    router.push('/admin/promotions');
  } catch (error) {
    console.error("Error saving promotion:", error);
    alert("Lưu thất bại: " + (error.response?.data?.message || error.message));
  }
};
</script>

<template>
  <div class="promotion-detail container-fluid py-4">
    <div class="d-flex align-items-center mb-4">
      <button @click="router.back()" class="btn btn-white shadow-sm rounded-circle me-3 back-btn">
        <i class="fas fa-arrow-left text-secondary"></i>
      </button>
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1">
            <li class="breadcrumb-item small">
              <router-link to="/admin/promotions" class="text-decoration-none text-muted">Khuyến mại</router-link>
            </li>
            <li class="breadcrumb-item small active" aria-current="page">{{ isEdit ? 'Chỉnh sửa' : 'Thêm mới' }}</li>
          </ol>
        </nav>
        <h4 class="fw-bold mb-0 text-dark">{{ isEdit ? 'SỬA KHUYẾN MÃI' : 'THÊM KHUYẾN MÃI MỚI' }}</h4>
      </div>
    </div>

    <div class="row g-4">
      <!-- Thông tin chung -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm p-4 sticky-top" style="top: 20px;">
          <h6 class="fw-bold mb-4 text-primary"><i class="bi bi-info-circle me-2"></i>Thông tin chung</h6>
          <form @submit.prevent="handleSave">
            <div class="mb-3">
              <label class="form-label small fw-bold">Mã Đợt Giảm Giá</label>
              <input type="text" v-model="promotion.maDotGiamGia" class="form-control form-control-sm bg-light" readonly placeholder="Mã tự động tạo">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Tên chương trình</label>
              <input type="text" v-model="promotion.tenDot" class="form-control form-control-sm" placeholder="Nhập tên đợt khuyến mãi" required>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small fw-bold">Kiểu giảm</label>
                <select v-model="promotion.kieuGiamGia" class="form-select form-select-sm">
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="AMOUNT">Số tiền (VNĐ)</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label small fw-bold">Giá trị</label>
                <input type="number" v-model="promotion.giaTriGiam" class="form-control form-control-sm" required>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Ngày bắt đầu</label>
              <input type="date" v-model="promotion.ngayBatDau" class="form-control form-control-sm" required>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Ngày kết thúc</label>
              <input type="date" v-model="promotion.ngayKetHuc" class="form-control form-control-sm" required>
            </div>
            <div class="mb-4">
              <label class="form-label small fw-bold d-block">Trạng thái</label>
              <div class="form-check form-switch mt-2">
                <input class="form-check-input" type="checkbox" v-model="promotion.trangThai">
                <label class="form-check-label small text-muted">{{ promotion.trangThai ? 'Đang hoạt động' : 'Ngừng hoạt động' }}</label>
              </div>
            </div>
            <div class="d-grid mt-5">
              <button type="submit" class="btn btn-primary px-4">
                <i class="bi bi-check2-circle me-2"></i>{{ isEdit ? 'Cập nhật' : 'Lưu đợt giảm giá' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Chọn sản phẩm -->
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold text-primary">
              <i class="bi bi-box-seam me-2"></i>Sản phẩm & Biến thể áp dụng
            </h6>
            <div class="search-box">
              <div class="input-group input-group-sm" style="width: 250px;">
                <span class="input-group-text border-end-0 bg-transparent text-muted"><i class="bi bi-search"></i></span>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control border-start-0 ps-0" 
                  placeholder="Tìm theo tên, mã sản phẩm..."
                >
              </div>
            </div>
          </div>
          
          <div class="selection-container custom-scrollbar">
            <div v-if="filteredProducts.length === 0" class="p-5 text-center text-muted">
              <i class="bi bi-inbox fs-1 d-block mb-3"></i>
              Không tìm thấy sản phẩm nào
            </div>
            
            <div v-for="p in filteredProducts" :key="p.id" class="product-group">
              <!-- Header Sản phẩm -->
              <div 
                class="product-header d-flex align-items-center px-4 py-3 cursor-pointer transition-all"
                :class="{ 'expanded-bg': expandedProducts.has(p.id) }"
                @click="toggleExpand(p.id)"
              >
                <div class="form-check me-3" @click.stop>
                  <input 
                    type="checkbox" 
                    class="form-check-input"
                    :checked="isProductFullySelected(p)"
                    :indeterminate="isProductPartiallySelected(p)"
                    @change="toggleProductSelection(p)"
                  >
                </div>
                
                <div class="product-info flex-grow-1">
                  <div class="d-flex align-items-center mb-1">
                    <span class="fw-bold text-dark me-2">{{ p.name }}</span>
                    <span class="badge bg-secondary-subtle text-secondary px-2 font-monospace">{{ p.code }}</span>
                  </div>
                </div>

                <div class="selection-status me-4">
                  <span v-if="getSelectedCount(p) > 0" class="badge bg-success-subtle text-success border border-success-subtle px-3 rounded-pill">
                    Đã chọn {{ getSelectedCount(p) }}/{{ p.variants.length }}
                  </span>
                  <span v-else class="text-muted small">
                    {{ p.variants.length }} biến thể
                  </span>
                </div>

                <div class="chevron transition-all" :class="{ 'rotate-180': expandedProducts.has(p.id) }">
                  <i class="bi bi-chevron-down text-secondary fs-5"></i>
                </div>
              </div>

              <!-- List Biến thể -->
              <div v-if="expandedProducts.has(p.id)" class="variant-list-container bg-light-subtle border-top border-bottom">
                <div v-for="v in p.variants" :key="v.id" class="variant-item d-flex align-items-center px-5 py-2 hover-bg-white transition-all">
                  <div class="form-check me-4">
                    <input 
                      v-model="selectedSpctIds" 
                      :value="v.id" 
                      type="checkbox" 
                      class="form-check-input"
                    >
                  </div>
                  
                  <div class="variant-content d-flex align-items-center gap-4 flex-grow-1">
                    <span class="variant-code text-primary font-monospace small" style="min-width: 100px;">{{ v.code }}</span>
                    
                    <div class="variant-attrs d-flex gap-2">
                      <div class="attr-pill attr-color" :title="'Màu sắc: ' + v.color">
                        <i class="bi bi-palette me-1 opacity-50"></i>{{ v.color }}
                      </div>
                      <div class="attr-pill attr-size" :title="'Kích thước: ' + v.size">
                        <i class="bi bi-rulers me-1 opacity-50"></i>{{ v.size }}
                      </div>
                      <div v-if="v.material" class="attr-pill attr-material" :title="'Chất liệu: ' + v.material">
                        <i class="bi bi-layers me-1 opacity-50"></i>{{ v.material }}
                      </div>
                    </div>
                  </div>
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
.btn-white {
  background: white;
  border: none;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-white:hover {
  background-color: #f8f9fa;
  transform: scale(1.05);
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "/";
}

.selection-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.product-header {
  border-bottom: 1px solid #f1f1f1;
}

.product-header:hover {
  background-color: #fcfcfc;
}

.expanded-bg {
  background-color: #f0f7ff !important;
  border-left: 4px solid #0d6efd;
}

.rotate-180 {
  transform: rotate(180deg);
}

.transition-all {
  transition: all 0.2s ease;
}

.variant-item {
  border-bottom: 1px dashed #e9ecef;
}

.variant-item:last-child {
  border-bottom: none;
}

.hover-bg-white:hover {
  background-color: #fff;
  transform: translateX(5px);
}

/* Attr Pills */
.attr-pill {
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 6px;
  background-color: #fff;
  border: 1px solid #dee2e6;
  color: #495057;
  display: flex;
  align-items: center;
}

.attr-color { border-color: #cfe2ff; color: #084298; }
.attr-size { border-color: #ffeeb2; color: #664d03; }
.attr-material { border-color: #cff4fc; color: #055160; }

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f8f9fa;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #ced4da;
}

.font-monospace {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.cursor-pointer {
  cursor: pointer;
}

.form-check-input:indeterminate {
  background-color: #0d6efd;
  border-color: #0d6efd;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10h8'/%3e%3c/svg%3e");
}
</style>
