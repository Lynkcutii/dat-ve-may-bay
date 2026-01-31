<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps(['id']);
const router = useRouter();
const isEdit = ref(!!props.id);

const product = ref({
  code: '',
  name: '',
  category: '',
  size: '',
  color: '',
  dimension: '',
  brand: '',
  material: '',
  price: 0,
  stock: 0,
  description: '',
  images: []
});

const imagePreviews = ref([]);

const onFileChange = (e) => {
  const files = e.target.files;
  if (files.length + imagePreviews.value.length > 3) {
    alert("Chỉ được tải lên tối đa 3 ảnh");
    return;
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviews.value.push(e.target.result);
      product.value.images.push(file);
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = (index) => {
  imagePreviews.value.splice(index, 1);
  product.value.images.splice(index, 1);
};

onMounted(() => {
  if (isEdit.value) {
    // Giả lập load dữ liệu
    product.value = {
      code: 'SP001',
      name: 'Giày Nike Zoom Edit',
      category: 'Giày',
      size: '42',
      color: 'Trắng/Đen',
      dimension: 'Tiêu chuẩn',
      brand: 'Nike',
      material: 'Da tổng hợp',
      price: 1200000,
      stock: 50,
      description: 'Mô tả chi tiết sản phẩm...',
      images: []
    };
  }
});

const handleSave = () => {
  alert(isEdit.value ? "Cập nhật thành công!" : "Thêm mới thành công!");
  router.push('/admin/products');
};
</script>

<template>
  <div class="product-detail">
    <div class="d-flex align-items-center mb-4">
      <button @click="router.back()" class="btn btn-outline-secondary rounded-circle me-3">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h4 class="fw-bold mb-0">{{ isEdit ? 'Chỉnh sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}</h4>
    </div>

    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4 p-md-5">
        <form @submit.prevent="handleSave">
          <div class="row g-4">
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Mã sản phẩm</label>
              <input type="text" v-model="product.code" class="form-control bg-light border-0" placeholder="VD: SP001" required>
            </div>
            <div class="col-md-8">
              <label class="form-label small fw-bold text-uppercase">Tên sản phẩm</label>
              <input type="text" v-model="product.name" class="form-control bg-light border-0" placeholder="Nhập tên sản phẩm" required>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Danh mục</label>
              <select v-model="product.category" class="form-select bg-light border-0">
                <option value="">Chọn danh mục</option>
                <option value="Giày">Giày</option>
                <option value="Quần Áo">Quần Áo</option>
                <option value="Phụ Kiện">Phụ Kiện</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Size (SZ)</label>
              <input type="text" v-model="product.size" class="form-control bg-light border-0" placeholder="VD: 42, L, XL">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Màu sắc</label>
              <input type="text" v-model="product.color" class="form-control bg-light border-0" placeholder="VD: Đỏ, Xanh, Trắng">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Kích thước (D x R x C)</label>
              <input type="text" v-model="product.dimension" class="form-control bg-light border-0" placeholder="VD: 30x20x10cm">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Thương hiệu</label>
              <input type="text" v-model="product.brand" class="form-control bg-light border-0" placeholder="VD: Nike, Adidas">
            </div>
            <div class="col-md-4">
              <label class="form-label small fw-bold text-uppercase">Chất liệu</label>
              <input type="text" v-model="product.material" class="form-control bg-light border-0" placeholder="VD: Cotton, Polyester">
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Giá bán (VNĐ)</label>
              <input type="number" v-model="product.price" class="form-control bg-light border-0" placeholder="0" required>
            </div>
            <div class="col-md-6">
              <label class="form-label small fw-bold text-uppercase">Số lượng kho</label>
              <input type="number" v-model="product.stock" class="form-control bg-light border-0" placeholder="0" required>
            </div>
            
            <div class="col-12">
              <label class="form-label small fw-bold text-uppercase">Hình ảnh (Tối đa 3 ảnh)</label>
              <div class="d-flex gap-3 flex-wrap mb-2">
                <div v-for="(preview, index) in imagePreviews" :key="index" class="position-relative">
                  <img :src="preview" class="rounded-3 object-fit-cover" style="width: 120px; height: 120px;">
                  <button @click="removeImage(index)" type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle" style="transform: translate(50%, -50%);">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <label v-if="imagePreviews.length < 3" class="d-flex flex-column align-items-center justify-content-center bg-light rounded-3 border-dashed" style="width: 120px; height: 120px; cursor: pointer; border: 2px dashed #dee2e6;">
                  <i class="fas fa-cloud-upload-alt text-secondary mb-1"></i>
                  <span class="small text-secondary">Tải ảnh</span>
                  <input type="file" @change="onFileChange" class="d-none" accept="image/*" multiple>
                </label>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold text-uppercase">Mô tả chi tiết</label>
              <textarea v-model="product.description" rows="4" class="form-control bg-light border-0" placeholder="Nhập mô tả sản phẩm"></textarea>
            </div>
            <div class="col-12 text-end mt-4">
              <button type="button" @click="router.back()" class="btn btn-light rounded-pill px-4 me-2">Hủy</button>
              <button type="submit" class="btn btn-danger rounded-pill px-5 fw-bold">Lưu lại</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
