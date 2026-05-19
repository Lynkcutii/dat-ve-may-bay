<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import returnApi from '@/api/returnApi';

const props = defineProps({
  show: { type: Boolean, default: false },
  doiTra: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['close', 'saved']);

const form = ref({
  phuongThucHoan: 'CHUYEN_KHOAN',
  maGiaoDichHoan: '',
  anhChungTu: []
});
const saving = ref(false);
const uploading = ref(false);

async function upload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  try {
    uploading.value = true;
    const { data } = await returnApi.uploadChungTu(props.doiTra.id, files);
    form.value.anhChungTu = [...form.value.anhChungTu, ...(Array.isArray(data) ? data : [])];
    ElMessage.success('Upload chứng từ thành công');
  } catch (err) {
    ElMessage.error(err?.response?.data?.error || 'Upload chứng từ thất bại');
  } finally {
    uploading.value = false;
    e.target.value = '';
  }
}

function removeImg(idx) {
  form.value.anhChungTu.splice(idx, 1);
}

async function save() {
  saving.value = true;
  try {
    await returnApi.hoanTien(props.doiTra.id, form.value);
    ElMessage.success('Đã xác nhận hoàn tiền');
    emit('saved');
  } catch (err) {
    ElMessage.error(err?.response?.data?.error || 'Xác nhận hoàn tiền thất bại');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show" @click="emit('close')"></div>
  <div class="modal fade" :class="{ show, 'd-block': show }" tabindex="-1" style="z-index:1065;">
    <div class="modal-dialog">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header">
          <h5 class="modal-title fw-bold"><i class="fas fa-money-bill-wave me-2"></i>Xác nhận hoàn tiền</h5>
          <button class="btn-close" @click="emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label fw-bold small">Phương thức hoàn</label>
            <select class="form-select" v-model="form.phuongThucHoan">
              <option value="CHUYEN_KHOAN">CHUYEN_KHOAN</option>
              <option value="TIEN_MAT">TIEN_MAT</option>
              <option value="VNPAY">VNPAY</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold small">Mã giao dịch</label>
            <input class="form-control" v-model="form.maGiaoDichHoan" placeholder="Nhập mã giao dịch hoàn" />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold small">Ảnh chứng từ</label>
            <input class="form-control form-control-sm" type="file" multiple @change="upload" />
            <div class="small text-muted mt-1" v-if="uploading">Đang upload...</div>
          </div>
          <div class="d-flex flex-wrap gap-2" v-if="form.anhChungTu.length">
            <div v-for="(url, idx) in form.anhChungTu" :key="url + idx" class="position-relative">
              <img :src="url" style="width:72px;height:72px;object-fit:cover" class="rounded border" />
              <button class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 px-1" @click="removeImg(idx)">x</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-light rounded-pill px-4" @click="emit('close')">Đóng</button>
          <button class="btn btn-warning rounded-pill px-4 fw-bold" :disabled="saving" @click="save">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Xác nhận hoàn tiền
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal.show { display: block !important; }
</style>
