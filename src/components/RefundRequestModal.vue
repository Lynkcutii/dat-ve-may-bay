<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const props = defineProps({
  show: Boolean,
  order: Object,       // hóa đơn
  items: Array,        // danh sách hoa_don_chi_tiet
  mode: { type: String, default: 'user' } // 'user' hoặc 'admin'
});

const emit = defineEmits(['close', 'success']);

const lyDo = ref('');
const selectedFiles = ref([]);
const selectedItems = ref([]);
const submitting = ref(false);
const errorMsg = ref('');

// Reset form khi modal mở
watch(() => props.show, (val) => {
  if (val) {
    lyDo.value = '';
    selectedFiles.value = [];
    selectedItems.value = [];
    errorMsg.value = '';
    // Khởi tạo danh sách sản phẩm với số lượng trả = 0 và chưa chọn
    if (props.items?.length) {
      selectedItems.value = props.items.map(item => ({
        id: item.id,
        tenSanPham: item.tenSanPham,
        mauSac: item.mauSac,
        kichThuoc: item.kichThuoc,
        chatLieu: item.chatLieu,
        donGia: item.donGia,
        soLuong: item.soLuong,
        soLuongTra: 0,
        checked: false
      }));
    }
  }
});

// Tính tổng tiền hoàn (có chia tỷ lệ trừ khấu trừ voucher giống Backend)
const tongTienHoan = computed(() => {
  const tongTienHang = (props.order && props.order.tongTienHang > 0) ? props.order.tongTienHang : 1;
  const tienGiam = props.order?.tienGiam || 0;

  return selectedItems.value
    .filter(i => i.checked && i.soLuongTra > 0)
    .reduce((sum, i) => {
      const giaTriGoc = i.donGia * i.soLuongTra;
      const tienGiamPhanBo = (giaTriGoc * tienGiam) / tongTienHang;
      return sum + (giaTriGoc - tienGiamPhanBo);
    }, 0);
});

// Xử lý chọn file ảnh
const onFileChange = (e) => {
  const files = Array.from(e.target.files);
  errorMsg.value = '';

  // Validate file
  for (const file of files) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      errorMsg.value = 'Chỉ chấp nhận file .jpg, .png';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      errorMsg.value = `File "${file.name}" vượt quá 5MB`;
      return;
    }
  }
  selectedFiles.value = files;
};

// Xóa 1 file đã chọn
const removeFile = (index) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index);
};

// Validate trước khi submit
const canSubmit = computed(() => {
  const hasChecked = selectedItems.value.some(i => i.checked && i.soLuongTra > 0);
  const hasFiles = selectedFiles.value.length > 0;
  const hasLyDo = lyDo.value.trim().length > 0;
  // Ảnh bắt buộc cho cả user và admin
  return hasChecked && hasFiles && hasLyDo && !submitting.value;
});

// Format tiền
const formatPrice = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

// Submit đổi trả
const submitRequest = async () => {
  if (!canSubmit.value) return;

  // Lọc các sản phẩm được chọn
  const chiTiets = selectedItems.value
    .filter(i => i.checked && i.soLuongTra > 0)
    .map(i => ({
      hoaDonChiTietId: i.id,
      soLuongTra: i.soLuongTra
    }));

  if (chiTiets.length === 0) {
    errorMsg.value = 'Vui lòng chọn ít nhất 1 sản phẩm để đổi trả';
    return;
  }

  submitting.value = true;
  errorMsg.value = '';

  try {
    const formData = new FormData();

    // Tạo JSON data part
    const dataPayload = {
      hoaDonId: props.order.id,
      lyDo: lyDo.value.trim(),
      chiTiets: chiTiets
    };
    formData.append('data', new Blob([JSON.stringify(dataPayload)], { type: 'application/json' }));

    // Append ảnh
    for (const file of selectedFiles.value) {
      formData.append('files', file);
    }

    // Gọi API theo mode
    const url = props.mode === 'admin'
      ? `${API_BASE_URL}/api/admin/doi-tra/request-by-admin`
      : `${API_BASE_URL}/api/user/doi-tra/request`;

    await axios.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    alert('Gửi yêu cầu đổi trả thành công!');
    emit('success');
    emit('close');
  } catch (error) {
    const msg = error.response?.data?.error || error.message || 'Có lỗi xảy ra';
    errorMsg.value = msg;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <!-- Overlay -->
  <div v-if="show" class="modal-backdrop fade show" @click="$emit('close')"></div>
  
  <div class="modal fade" :class="{ show: show, 'd-block': show }" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content border-0 shadow">
        <!-- Header -->
        <div class="modal-header border-0 bg-danger text-white">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-undo-alt me-2"></i>
            {{ mode === 'admin' ? 'Khởi Tạo Đổi Trả (Admin)' : 'Yêu Cầu Hoàn Trả' }}
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Thông tin đơn hàng -->
          <div class="alert alert-light border mb-4">
            <div class="d-flex justify-content-between">
              <span class="small text-muted">Mã đơn hàng</span>
              <span class="fw-bold text-danger">{{ order?.maHoaDon }}</span>
            </div>
          </div>

          <!-- Danh sách sản phẩm -->
          <h6 class="fw-bold mb-3">
            <i class="fas fa-box me-2"></i>Chọn sản phẩm hoàn trả
          </h6>
          <div class="product-list mb-4">
            <div 
              v-for="(item, index) in selectedItems" 
              :key="item.id"
              class="product-item border rounded-3 p-3 mb-2"
              :class="{ 'border-danger bg-danger bg-opacity-10': item.checked }"
            >
              <div class="d-flex align-items-start gap-3">
                <div class="form-check mt-1">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    v-model="item.checked"
                    :id="'item-' + item.id"
                  >
                </div>
                <div class="flex-grow-1">
                  <div class="fw-bold small">{{ item.tenSanPham }}</div>
                  <div class="text-muted x-small">
                    {{ item.mauSac }} | {{ item.kichThuoc }} | {{ item.chatLieu }}
                  </div>
                  <div class="small mt-1">
                    Đơn giá: <span class="text-danger fw-bold">{{ formatPrice(item.donGia) }}</span>
                    &nbsp;|&nbsp; Đã mua: <strong>{{ item.soLuong }}</strong>
                  </div>
                </div>
                <div v-if="item.checked" class="text-center" style="min-width: 120px;">
                  <label class="form-label x-small text-muted mb-1">Số lượng trả</label>
                  <input 
                    type="number" 
                    class="form-control form-control-sm text-center border-danger"
                    v-model.number="item.soLuongTra"
                    :min="1"
                    :max="item.soLuong"
                  >
                </div>
              </div>
              <!-- Giá trị hoàn dòng -->
              <div v-if="item.checked && item.soLuongTra > 0" class="text-end mt-2 small">
                Hoàn: <span class="fw-bold text-success">{{ formatPrice(item.donGia * item.soLuongTra) }}</span>
              </div>
            </div>
          </div>

          <!-- Tổng tiền hoàn -->
          <div v-if="tongTienHoan > 0" class="alert alert-success d-flex justify-content-between align-items-center">
            <span class="fw-bold">Tổng tiền hoàn (không gồm phí ship):</span>
            <span class="fs-5 fw-bold">{{ formatPrice(tongTienHoan) }}</span>
          </div>

          <!-- Lý do -->
          <div class="mb-3">
            <label class="form-label fw-bold small">
              <i class="fas fa-comment-alt me-1"></i>Lý do đổi trả <span class="text-danger">*</span>
            </label>
            <textarea
              v-model="lyDo"
              class="form-control"
              rows="3"
              placeholder="Mô tả lý do bạn muốn hoàn trả sản phẩm..."
              maxlength="255"
            ></textarea>
            <div class="text-end x-small text-muted mt-1">{{ lyDo.length }}/255</div>
          </div>

          <!-- Upload ảnh -->
          <div class="mb-3">
            <label class="form-label fw-bold small">
              <i class="fas fa-camera me-1"></i>Ảnh minh chứng <span class="text-danger">*</span>
              <span class="text-muted fw-normal ms-1">(JPG, PNG, tối đa 5MB/ảnh)</span>
            </label>
            <input 
              type="file" 
              class="form-control"
              accept=".jpg,.jpeg,.png"
              multiple
              @change="onFileChange"
            >
            <!-- Preview ảnh -->
            <div v-if="selectedFiles.length" class="d-flex gap-2 mt-2 flex-wrap">
              <div v-for="(file, idx) in selectedFiles" :key="idx" class="position-relative">
                <img 
                  :src="getFilePreview(file)" 
                  class="rounded-2 border" 
                  style="width: 80px; height: 80px; object-fit: cover;"
                  v-if="file._preview"
                >
                <div v-else class="border rounded-2 d-flex align-items-center justify-content-center bg-light" style="width: 80px; height: 80px;">
                  <i class="fas fa-image text-muted"></i>
                </div>
                <button 
                  @click="removeFile(idx)" 
                  class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0"
                  style="width: 20px; height: 20px; font-size: 10px; line-height: 1;"
                >×</button>
                <div class="x-small text-center text-truncate" style="max-width: 80px;">{{ file.name }}</div>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="errorMsg" class="alert alert-danger small py-2">
            <i class="fas fa-exclamation-circle me-1"></i>{{ errorMsg }}
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-light rounded-pill px-4" @click="$emit('close')">Hủy</button>
          <button 
            type="button"
            class="btn btn-danger rounded-pill px-4 fw-bold"
            :disabled="!canSubmit"
            @click="submitRequest"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="fas fa-paper-plane me-2"></i>
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.x-small { font-size: 0.75rem; }
.product-item { transition: all 0.2s ease; }
.product-item:hover { border-color: #dc3545 !important; }
.modal.show { display: block !important; }
</style>
