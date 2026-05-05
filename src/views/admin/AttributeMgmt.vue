<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const apiBaseUrl = 'http://localhost:8080/api/admin';
const attributes = ref([
  { id: 1, type: 'Kích cỡ', key: 'sizes', values: [] },
  { id: 2, type: 'Màu sắc', key: 'colors', values: [] },
  { id: 3, type: 'Chất liệu', key: 'materials', values: [] },
  { id: 4, type: 'Thương hiệu', key: 'brands', values: [] }
]);

const loading = ref(true);
const showModal = ref(false);
const modalType = ref('');
const targetAttr = ref(null);
const form = ref({ id: null, ten: '', trangThai: true });

const getItemName = (item, type = '') => {
  if (!item) return '';
  if (type === 'brands') return item.tenThuongHieu ?? '';
  return item.ten ?? '';
};

const normalizeAttributeName = (item, type = '') => {
  return getItemName(item, type);
};

const normalizeForDeduplication = (str) => {
  if (!str) return '';
  // Normalize string by removing accents and handling common broken patterns
  const normalized = str.toString().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[?ÃÆÐ]/g, '') // remove broken chars
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toUpperCase();
  return normalized;
};

const deduplicate = (list, type = '') => {
  if (!list || !Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(item => {
    const rawName = getItemName(item, type);
    const normalized = normalizeForDeduplication(rawName);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const fetchAttributes = async () => {
  try {
    loading.value = true;
    const [sizesRes, colorsRes, materialsRes, brandsRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/sizes`),
      axios.get(`${apiBaseUrl}/colors`),
      axios.get(`${apiBaseUrl}/materials`),
      axios.get(`${apiBaseUrl}/brands`)
    ]);

    attributes.value[0].values = deduplicate(sizesRes.data, 'sizes');
    attributes.value[1].values = deduplicate(colorsRes.data, 'colors');
    attributes.value[2].values = deduplicate(materialsRes.data, 'materials');
    attributes.value[3].values = deduplicate(brandsRes.data, 'brands');
  } catch (error) {
    console.error('Error fetching attributes:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAttributes();
});

const openAddModal = (attr) => {
  modalType.value = 'add';
  targetAttr.value = attr;
  form.value = { id: null, ten: '', trangThai: true };
  showModal.value = true;
};

const openEditModal = (attr, val) => {
  modalType.value = 'edit';
  targetAttr.value = attr;
  form.value = {
    id: val.id,
    ten: getItemName(val, attr.key),
    trangThai: val.trangThai ?? true,
    raw: val
  };
  showModal.value = true;
};

const buildPayload = () => {
  if (targetAttr.value.key === 'brands') {
    return {
      id: form.value.id,
      tenThuongHieu: form.value.ten,
      trangThai: form.value.trangThai,
      maThuongHieu: form.value.raw?.maThuongHieu ?? null,
      moTa: form.value.raw?.moTa ?? null
    };
  }

  return {
    id: form.value.id,
    ten: form.value.ten,
    trangThai: form.value.trangThai,
    ma: form.value.raw?.ma ?? null
  };
};

const saveAttribute = async () => {
  if (!form.value.ten.trim()) {
    alert('Vui lòng nhập tên!');
    return;
  }

  if (modalType.value === 'add' && !confirm('Xac nhan them moi thuoc tinh?')) {
    return;
  }

  try {
    const endpoint = `${apiBaseUrl}/${targetAttr.value.key}`;
    await axios.post(endpoint, buildPayload());
    alert('Lưu thành công!');
    showModal.value = false;
    fetchAttributes();
  } catch (error) {
    console.error('Error saving attribute:', error);
    alert('Lưu thất bại!');
  }
};
</script>

<template>
  <div class="attribute-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold">Quản Lý Thuộc Tính</h4>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="row">
      <div v-for="attr in attributes" :key="attr.id" class="col-md-6 col-xl-3 mb-4">
        <div class="card border-0 shadow-sm rounded-3 h-100">
          <div class="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold">{{ attr.type }}</h6>
            <button class="btn btn-sm btn-outline-danger rounded-circle" @click="openAddModal(attr)">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div class="card-body">
            <div class="d-flex flex-wrap gap-2">
              <div
                v-for="val in attr.values"
                :key="val.id"
                class="badge-item d-flex align-items-center gap-1 bg-light text-dark border rounded-pill px-3 py-1 pointer"
                @click="openEditModal(attr, val)"
              >
                <span>{{ normalizeAttributeName(val, attr.key) }}</span>
                <i class="fas fa-edit x-small text-muted ms-1"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop fade show"></div>
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">{{ modalType === 'add' ? 'Thêm' : 'Sửa' }} {{ targetAttr.type }}</h5>
            <button type="button" class="btn-close shadow-none" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Tên {{ targetAttr.type }}</label>
              <input v-model="form.ten" type="text" class="form-control border-0 bg-light shadow-none py-2" placeholder="Nhập tên thuộc tính...">
            </div>
            <div class="form-check form-switch mb-3" v-if="modalType === 'edit'">
              <input class="form-check-input" type="checkbox" v-model="form.trangThai">
              <label class="form-check-label small fw-bold text-muted">Trạng thái (Hoạt động)</label>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button class="btn btn-light rounded-pill px-4" @click="showModal = false">Đóng</button>
            <button class="btn btn-danger rounded-pill px-4" @click="saveAttribute">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pointer {
  cursor: pointer;
}

.badge-item:hover {
  background-color: #f8d7da !important;
  border-color: #dc3545 !important;
}

.x-small {
  font-size: 0.65rem;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>
