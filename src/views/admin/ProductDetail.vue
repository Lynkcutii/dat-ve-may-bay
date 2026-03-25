<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const props = defineProps(['id']);
const router = useRouter();
const route = useRoute();
const isEdit = ref(!!props.id);
const isReadOnly = ref(route.query.mode === 'view');
const isSaving = ref(false);
const uploadingImages = ref(false);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const product = ref({
  id: null,
  ma: '',
  tenSanPham: '',
  giaGoc: 0,
  trangThai: true,
  moTa: '',
  danhMuc: { id: null, ten: '' },
  thuongHieu: { id: null, tenThuongHieu: '' }
});

const variantDetails = ref([]);
const categories = ref([]);
const brands = ref([]);
const colors = ref([]);
const sizes = ref([]);
const materials = ref([]);
const imagePreviews = ref([]);

const variantSummary = ref({
  sizes: '',
  colors: '',
  materials: '',
  salePrice: '',
  totalStock: 0
});

const normalizeAttributeName = (item, type = '') => {
  if (!item) return '';
  const rawName = item.ten ?? '';
  if (!rawName.includes('?')) return rawName;

  const code = String(item.ma ?? '').trim().toUpperCase();
  if (type === 'colors') {
    const colorMap = {
      DEN: 'Đen',
      TRANG: 'Trắng',
      DO: 'Đỏ',
      XANH: 'Xanh',
      XANH_DUONG: 'Xanh dương',
      XANH_LA: 'Xanh lá',
      VANG: 'Vàng',
      HONG: 'Hồng',
      TIM: 'Tím',
      CAM: 'Cam',
      NAU: 'Nâu',
      XAM: 'Xám'
    };
    return colorMap[code] || rawName;
  }

  return rawName;
};

const fetchCategories = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/categories`);
    categories.value = res.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

const fetchBrands = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/brands`);
    brands.value = res.data;
  } catch (error) {
    console.error('Error fetching brands:', error);
  }
};

const fetchColors = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/colors`);
    colors.value = res.data.map(item => ({ ...item, ten: normalizeAttributeName(item, 'colors') }));
  } catch (error) {
    console.error('Error fetching colors:', error);
  }
};

const fetchSizes = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/sizes`);
    sizes.value = res.data;
  } catch (error) {
    console.error('Error fetching sizes:', error);
  }
};

const fetchMaterials = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/materials`);
    materials.value = res.data;
  } catch (error) {
    console.error('Error fetching materials:', error);
  }
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const updateVariantSummary = () => {
  const details = variantDetails.value;

  const getAttrTen = (id, list, prop) => {
    if (!id) return null;
    const item = list.find(i => i.id === id);
    return item ? item[prop] : null;
  };

  variantSummary.value.sizes = [...new Set(details.map(d => d.kichThuoc?.ten || getAttrTen(d.kichThuoc?.id, sizes.value, 'ten')))].filter(Boolean).join(', ');
  variantSummary.value.colors = [...new Set(details.map(d => d.mauSac?.ten || getAttrTen(d.mauSac?.id, colors.value, 'ten')))].filter(Boolean).join(', ');
  variantSummary.value.materials = [...new Set(details.map(d => d.chatLieu?.ten || getAttrTen(d.chatLieu?.id, materials.value, 'ten')))].filter(Boolean).join(', ');
  variantSummary.value.totalStock = details.reduce((sum, d) => sum + (Number(d.soLuong) || 0), 0);

  const prices = details.map(d => Number(d.giaBan)).filter(p => p > 0);
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    variantSummary.value.salePrice = minPrice === maxPrice
      ? formatPrice(minPrice)
      : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  } else {
    variantSummary.value.salePrice = '---';
  }
};

const fetchProduct = async () => {
  if (!props.id) return;

  try {
    const res = await axios.get(`${apiBaseUrl}/products/${props.id}`);
    const data = res.data;

    product.value = {
      ...data.product,
      thuongHieu: data.product.thuongHieu || { id: null, tenThuongHieu: '' }
    };

    variantDetails.value = (data.details || []).map(detail => ({
      ...detail,
      mauSac: detail.mauSac
        ? { ...detail.mauSac, ten: normalizeAttributeName(detail.mauSac, 'colors') }
        : detail.mauSac
    }));

    imagePreviews.value = (product.value.hinhAnhs || []).map(img => ({
      id: img.id,
      url: img.url
    }));

    updateVariantSummary();
  } catch (error) {
    console.error('Error fetching product:', error);
  }
};

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  try {
    uploadingImages.value = true;
    const res = await axios.post(`${apiBaseUrl}/products/upload-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    imagePreviews.value.push(
      ...(res.data || []).map(url => ({ url }))
    );
  } catch (error) {
    console.error('Error uploading images:', error);
    alert('Không thể tải ảnh lên. Vui lòng thử lại.');
  } finally {
    uploadingImages.value = false;
    event.target.value = '';
  }
};

const saveProduct = async () => {
  if (!product.value.tenSanPham || !product.value.ma) {
    alert('Vui lòng nhập đầy đủ mã và tên sản phẩm!');
    return;
  }

  if (!product.value.danhMuc.id || !product.value.thuongHieu.id) {
    alert('Vui lòng chọn Danh mục và Thương hiệu cho sản phẩm!');
    return;
  }

  if (variantDetails.value.length === 0) {
    alert('Vui lòng thêm ít nhất một biến thể cho sản phẩm!');
    return;
  }

  for (const v of variantDetails.value) {
    if (!v.mauSac?.id || !v.kichThuoc?.id || !v.chatLieu?.id) {
      alert('Vui lòng chọn đầy đủ thuộc tính cho tất cả các biến thể!');
      return;
    }
    if (v.soLuong < 0 || v.giaBan <= 0) {
      alert('Giá bán và số lượng biến thể không hợp lệ!');
      return;
    }
  }

  try {
    isSaving.value = true;

    const cleanProduct = { ...product.value };
    delete cleanProduct.hinhAnhs;

    const payload = {
      product: cleanProduct,
      variants: variantDetails.value,
      imageUrls: imagePreviews.value.map(img => img.url).filter(Boolean)
    };

    const res = await axios.post(`${apiBaseUrl}/products`, payload);
    const savedProduct = res.data;

    alert(props.id ? 'Cập nhật sản phẩm và biến thể thành công!' : 'Thêm sản phẩm thành công!');

    if (!props.id) {
      router.push(`/admin/products/edit/${savedProduct.id}`);
    } else {
      await fetchProduct();
    }
  } catch (error) {
    console.error('Error saving product:', error);
    const msg = error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra';
    alert(`Lỗi khi lưu sản phẩm: ${msg}`);
  } finally {
    isSaving.value = false;
  }
};

const removeImage = (index) => {
  if (confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) {
    imagePreviews.value.splice(index, 1);
  }
};

const addNewVariant = () => {
  variantDetails.value.push({
    mauSac: { id: null },
    kichThuoc: { id: null },
    chatLieu: { id: null },
    giaBan: product.value.giaGoc || 0,
    soLuong: 0,
    trangThai: true
  });
};

const removeVariant = (index) => {
  variantDetails.value.splice(index, 1);
  updateVariantSummary();
};

onMounted(() => {
  fetchCategories();
  fetchBrands();
  fetchColors();
  fetchSizes();
  fetchMaterials();
  fetchProduct();
});
</script>

<template>
  <div class="product-detail container-fluid py-4">
    <div class="d-flex align-items-center mb-4">
      <button @click="router.back()" class="btn btn-white shadow-sm rounded-circle me-3">
        <i class="fas fa-arrow-left text-secondary"></i>
      </button>
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-1">
            <li class="breadcrumb-item small">
              <router-link to="/admin/products" class="text-decoration-none text-muted">Sản phẩm</router-link>
            </li>
            <li class="breadcrumb-item small active" aria-current="page">{{ isEdit ? 'Chỉnh sửa' : 'Thêm mới' }}</li>
          </ol>
        </nav>
        <h4 class="fw-bold mb-0 text-dark">{{ isEdit ? 'CHỈNH SỬA SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI' }}</h4>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white border-0 py-4 ps-4">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0 text-dark">
                <i class="fas fa-info-circle me-2 text-primary"></i>THÔNG TIN CHI TIẾT
              </h5>
              <div class="form-check form-switch d-flex align-items-center gap-2">
                <label class="form-check-label small fw-bold text-muted" for="statusSwitch">TRẠNG THÁI:</label>
                <input class="form-switch-custom" type="checkbox" id="statusSwitch" v-model="product.trangThai" :disabled="isReadOnly">
                <span :class="product.trangThai ? 'text-success' : 'text-secondary'" class="small fw-bold">
                  {{ product.trangThai ? 'Đang kinh doanh' : 'Ngừng kinh doanh' }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-body p-4">
            <div class="row g-4 mb-4">
              <div class="col-md-2">
                <label class="info-label">Mã sản phẩm</label>
                <input v-model="product.ma" type="text" class="form-control border-0 bg-light rounded-3 py-2 px-3 fw-bold text-primary" placeholder="Nhập mã sản phẩm" :readonly="isReadOnly">
              </div>
              <div class="col-md-4">
                <label class="info-label">Tên sản phẩm</label>
                <input v-model="product.tenSanPham" type="text" class="form-control border-0 bg-light rounded-3 py-2 px-3 fw-bold" placeholder="Nhập tên sản phẩm" :readonly="isReadOnly">
              </div>
              <div class="col-md-3">
                <label class="info-label">Danh mục</label>
                <select v-model="product.danhMuc.id" class="form-select border-0 bg-light rounded-3 py-2 px-3" :disabled="isReadOnly">
                  <option :value="null">Chọn danh mục</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.ten }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="info-label">Thương hiệu</label>
                <select v-model="product.thuongHieu.id" class="form-select border-0 bg-light rounded-3 py-2 px-3" :disabled="isReadOnly">
                  <option :value="null">Chọn thương hiệu</option>
                  <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.tenThuongHieu }}</option>
                </select>
              </div>
            </div>

            <div class="row g-4 mb-4">
              <div class="col-md-3">
                <label class="info-label text-secondary">Giá gốc hệ thống (₫)</label>
                <input v-model="product.giaGoc" type="number" class="form-control py-2 px-3 border rounded-3 fs-5 fw-semibold" :readonly="isReadOnly">
              </div>
              <div class="col-md-6">
                <label class="info-label text-danger">Giá bán (Biến thể)</label>
                <div class="info-box py-2 px-3 bg-danger-subtle border border-danger rounded-3 opacity-75">
                  <p class="info-value text-danger fs-5 fw-bold mb-0">{{ variantSummary.salePrice || '---' }}</p>
                </div>
              </div>
              <div class="col-md-3">
                <label class="info-label">Tổng tồn kho</label>
                <div class="info-box py-2 px-3 bg-light rounded-3 d-flex align-items-center opacity-75">
                  <i class="fas fa-boxes me-2 text-warning"></i>
                  <p class="info-value fw-bold mb-0">{{ variantSummary.totalStock ?? 0 }} <small class="text-muted fw-normal">Sản phẩm</small></p>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <label class="info-label mb-0">Danh sách biến thể</label>
                  <button v-if="!isReadOnly" @click="addNewVariant" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold">
                    <i class="fas fa-plus me-1"></i>Thêm biến thể
                  </button>
                </div>
                <div class="table-responsive border rounded-3 overflow-hidden">
                  <table class="table table-hover align-middle mb-0 small text-center">
                    <thead class="bg-light">
                      <tr>
                        <th>Màu sắc</th>
                        <th>Kích thước</th>
                        <th>Chất liệu</th>
                        <th style="width: 150px;">Giá bán (₫)</th>
                        <th style="width: 120px;">Số lượng</th>
                        <th class="text-end pe-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(v, index) in variantDetails" :key="index">
                        <td>
                          <select v-model="v.mauSac.id" class="form-select form-select-sm border-0 bg-light" :disabled="isReadOnly" @change="updateVariantSummary">
                            <option :value="null">Màu sắc</option>
                            <option v-for="c in colors" :key="c.id" :value="c.id">{{ normalizeAttributeName(c, 'colors') }}</option>
                          </select>
                        </td>
                        <td>
                          <select v-model="v.kichThuoc.id" class="form-select form-select-sm border-0 bg-light" :disabled="isReadOnly" @change="updateVariantSummary">
                            <option :value="null">Kích thước</option>
                            <option v-for="s in sizes" :key="s.id" :value="s.id">{{ s.ten }}</option>
                          </select>
                        </td>
                        <td>
                          <select v-model="v.chatLieu.id" class="form-select form-select-sm border-0 bg-light" :disabled="isReadOnly" @change="updateVariantSummary">
                            <option :value="null">Chất liệu</option>
                            <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.ten }}</option>
                          </select>
                        </td>
                        <td>
                          <input v-model="v.giaBan" type="number" class="form-control form-control-sm border-0 bg-light text-center fw-bold" :readonly="isReadOnly" @input="updateVariantSummary">
                        </td>
                        <td>
                          <input v-model="v.soLuong" type="number" class="form-control form-control-sm border-0 bg-light text-center" :readonly="isReadOnly" @input="updateVariantSummary">
                        </td>
                        <td class="text-end pe-3">
                          <button @click="removeVariant(index)" class="btn btn-sm btn-outline-danger border-0" :disabled="isReadOnly">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="variantDetails.length === 0">
                        <td colspan="6" class="py-4 text-muted small">Chưa có biến thể nào. Nhấn "Thêm biến thể" để bắt đầu.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-12">
                <label class="info-label">Mô tả sản phẩm</label>
                <textarea v-model="product.moTa" class="form-control border-0 bg-light rounded-3 p-3" rows="3" placeholder="Nhập mô tả sản phẩm" :readonly="isReadOnly"></textarea>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-12">
                <label class="info-label d-block mb-3">Hình ảnh sản phẩm</label>
                <div class="d-flex gap-4 flex-wrap p-3 bg-light rounded-4 border border-dashed border-2">
                  <div v-for="(img, index) in imagePreviews" :key="`${img.url}-${index}`" class="image-wrapper position-relative">
                    <img :src="img.url" class="rounded-3 shadow-sm border bg-white p-1" style="width: 120px; height: 140px; object-fit: cover;">
                    <button v-if="!isReadOnly" @click="removeImage(index)" class="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 translate-middle shadow-sm" style="width: 24px; height: 24px; padding: 0;">
                      <i class="fas fa-times small"></i>
                    </button>
                  </div>

                  <label v-if="!isReadOnly" class="upload-box rounded-3 d-flex flex-column align-items-center justify-content-center border bg-white cursor-pointer" style="width: 120px; height: 140px;">
                    <i class="fas fa-plus text-primary fs-2 mb-2"></i>
                    <span class="text-primary small fw-bold">{{ uploadingImages ? 'Đang tải...' : 'Thêm ảnh' }}</span>
                    <input type="file" class="d-none" multiple accept="image/*" @change="handleImageUpload" :disabled="uploadingImages">
                  </label>

                  <div v-if="imagePreviews.length === 0 && isReadOnly" class="no-image-placeholder rounded-3 d-flex flex-column align-items-center justify-content-center border bg-white p-4" style="width: 120px; height: 140px;">
                    <i class="fas fa-image text-muted fs-2 mb-2"></i>
                    <span class="text-muted small text-center">Chưa có hình ảnh</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 d-flex justify-content-end gap-3 border-top pt-4">
              <button @click="router.back()" class="btn btn-outline-secondary rounded-pill px-5 py-2 fw-bold">
                <i class="fas fa-arrow-left me-2"></i>QUAY LẠI
              </button>
              <button v-if="!isReadOnly" @click="saveProduct" class="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow" :disabled="isSaving || uploadingImages">
                <i v-if="isSaving" class="spinner-border spinner-border-sm me-2"></i>
                <i v-else class="fas fa-save me-2"></i>{{ isEdit ? 'CẬP NHẬT' : 'THÊM MỚI' }}
              </button>
              <router-link v-if="isReadOnly" :to="'/admin/products/edit/' + product.id" class="btn btn-warning rounded-pill px-5 py-2 fw-bold shadow">
                <i class="fas fa-edit me-2"></i>CHỈNH SỬA
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-detail {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #adb5bd;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  display: block;
}

.info-box {
  transition: all 0.2s ease;
}

.info-box:hover {
  background-color: #fff !important;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.info-value {
  color: #2d3436;
}

.image-wrapper img {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: zoom-in;
}

.image-wrapper img:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.bg-danger-subtle {
  background-color: #fff5f5;
}

.btn-white {
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-dashed {
  border-style: dashed !important;
}

.form-switch-custom {
  appearance: none;
  width: 40px;
  height: 20px;
  background-color: #dee2e6;
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.form-switch-custom:checked {
  background-color: #198754;
}

.form-switch-custom::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.form-switch-custom:checked::before {
  transform: translateX(20px);
}

.form-switch-custom:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
