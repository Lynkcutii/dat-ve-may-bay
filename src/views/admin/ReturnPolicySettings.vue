<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import returnConfigApi from '@/api/returnConfigApi';

const loading = ref(false);
const saving = ref(false);

const form = ref({
  phiXuLyPhanTram: 5,
  phiShipHoan: 30000,
  soNgayChoPhep: 7,
  soNgayKhangNghi: 3
});

const load = async () => {
  loading.value = true;
  try {
    const { data } = await returnConfigApi.get();
    form.value = {
      phiXuLyPhanTram: Number(data?.phiXuLyPhanTram ?? 5),
      phiShipHoan: Number(data?.phiShipHoan ?? 30000),
      soNgayChoPhep: Number(data?.soNgayChoPhep ?? 7),
      soNgayKhangNghi: Number(data?.soNgayKhangNghi ?? 3)
    };
  } catch (e) {
    ElMessage.error(e?.response?.data?.error || 'Không tải được cấu hình đổi trả');
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    await returnConfigApi.update(form.value);
    ElMessage.success('Đã lưu cấu hình đổi trả');
  } catch (e) {
    ElMessage.error(e?.response?.data?.error || 'Lưu cấu hình thất bại');
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0"><i class="fas fa-sliders-h me-2 text-danger"></i>Cấu hình đổi trả</h4>
      <button class="btn btn-outline-dark btn-sm rounded-pill px-3" :disabled="loading" @click="load">
        <i class="fas fa-sync-alt me-1"></i>Làm mới
      </button>
    </div>

    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-danger" role="status"></div>
        </div>

        <div v-else class="row g-4">
          <div class="col-md-4">
            <label class="form-label fw-bold small">Phí xử lý (%)</label>
            <el-input-number v-model="form.phiXuLyPhanTram" :min="0" :max="100" :step="0.5" style="width: 100%" />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small">Phí ship hoàn (VND)</label>
            <el-input-number v-model="form.phiShipHoan" :min="0" :step="1000" :controls="true" style="width: 100%" />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small">Số ngày cho phép</label>
            <el-input-number v-model="form.soNgayChoPhep" :min="1" :step="1" style="width: 100%" />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-bold small">Số ngày kháng nghị</label>
            <el-input-number v-model="form.soNgayKhangNghi" :min="1" :step="1" style="width: 100%" />
          </div>

          <div class="col-12 d-flex justify-content-end">
            <button class="btn btn-danger rounded-pill px-4 fw-bold" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
