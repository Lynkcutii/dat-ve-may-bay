<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import returnApi from '@/api/returnApi';

const props = defineProps({
  show: { type: Boolean, default: false },
  doiTraId: { type: Number, required: true }
});

const emit = defineEmits(['close', 'saved']);
const authStore = useAuthStore();
const lyDo = ref('');
const saving = ref(false);

async function submit() {
  const text = lyDo.value.trim();
  if (!text) {
    ElMessage.error('Vui lòng nhập lý do kháng nghị');
    return;
  }

  saving.value = true;
  try {
    await returnApi.khangNghi(authStore.currentUser?.id, props.doiTraId, { lyDo: text });
    ElMessage.success('Đã gửi kháng nghị');
    emit('saved');
  } catch (err) {
    ElMessage.error(err?.response?.data?.error || 'Gửi kháng nghị thất bại');
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
          <h5 class="modal-title fw-bold"><i class="fas fa-gavel me-2"></i>Kháng nghị</h5>
          <button class="btn-close" @click="emit('close')"></button>
        </div>
        <div class="modal-body">
          <label class="form-label fw-bold small">Lý do kháng nghị</label>
          <textarea v-model="lyDo" class="form-control" rows="4" maxlength="500" placeholder="Mô tả lý do kháng nghị..."></textarea>
          <div class="text-muted small mt-1">{{ lyDo.length }}/500</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-light rounded-pill px-4" @click="emit('close')">Đóng</button>
          <button class="btn btn-danger rounded-pill px-4" :disabled="saving" @click="submit">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Gửi kháng nghị
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal.show { display: block !important; }
</style>
