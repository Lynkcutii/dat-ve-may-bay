<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import returnApi from '@/api/returnApi';
import RefundBreakdown from '@/components/RefundBreakdown.vue';

const route = useRoute();
const loading = ref(true);
const invalid = ref('');
const confirmInfo = ref(null);
const done = ref(false);

const parseImages = (jsonStr) => { try { return jsonStr ? JSON.parse(jsonStr) : []; } catch { return []; } };

const load = async () => {
  loading.value = true;
  invalid.value = '';
  try {
    const token = route.query.token;
    if (!token) {
      invalid.value = 'Link không hợp lệ';
      return;
    }
    const { data } = await returnApi.getConfirmInfo(token);
    confirmInfo.value = data;
    if (data?.trangThaiThanhToan === 'DA_XAC_NHAN_NHAN') done.value = true;
  } catch (e) {
    if (e?.response?.status === 404) invalid.value = 'Token đã hết hạn hoặc không tồn tại';
    else invalid.value = e?.response?.data?.error || 'Không tải được thông tin xác nhận';
  } finally {
    loading.value = false;
  }
};

const confirmReceived = async () => {
  try {
    const token = route.query.token;
    await returnApi.confirmReceived(token);
    done.value = true;
    ElMessage.success('Cảm ơn bạn đã xác nhận');
    await load();
  } catch (e) {
    ElMessage.error(e?.response?.data?.error || 'Xác nhận thất bại');
  }
};

const complain = async () => {
  try {
    await ElMessageBox.prompt('Nhập ghi chú khiếu nại (Phase 2: chỉ lưu local, chưa gửi BE):', 'Tôi chưa nhận', {
      confirmButtonText: 'Gửi',
      cancelButtonText: 'Hủy'
    });
    ElMessage.info('Đã ghi nhận phản hồi tại giao diện');
  } catch {}
};

onMounted(load);
</script>

<template>
  <div class="container py-5" style="max-width: 760px;">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-danger"></div></div>

    <div v-else-if="invalid" class="alert alert-danger">{{ invalid }}</div>

    <div v-else-if="confirmInfo" class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <h4 class="fw-bold mb-3">Xác nhận nhận tiền hoàn</h4>

        <div class="small text-muted mb-2">Mã đổi trả: <strong class="text-dark">{{ confirmInfo.maDoiTra }}</strong></div>

        <RefundBreakdown :doiTra="confirmInfo" class="mb-4" />

        <div class="mb-2"><strong>Phương thức:</strong> {{ confirmInfo.phuongThucHoan || 'N/A' }}</div>
        <div class="mb-2"><strong>Mã giao dịch:</strong> {{ confirmInfo.maGiaoDichHoan || 'N/A' }}</div>

        <div class="mb-3">
          <strong>Biên lai:</strong>
          <div class="d-flex gap-2 flex-wrap mt-2">
            <img v-for="(url, idx) in parseImages(confirmInfo.anhChungTu)" :key="idx" :src="url" class="rounded border" style="width:100px;height:100px;object-fit:cover;cursor:pointer" @click="window.open(url, '_blank')" />
            <div v-if="parseImages(confirmInfo.anhChungTu).length===0" class="small text-muted">Không có ảnh chứng từ.</div>
          </div>
        </div>

        <div v-if="done || confirmInfo.trangThaiThanhToan === 'DA_XAC_NHAN_NHAN'" class="alert alert-success mb-0">
          Bạn đã xác nhận trước đó.
        </div>

        <div v-else class="d-flex gap-2">
          <button class="btn btn-success rounded-pill px-4" @click="confirmReceived">Tôi đã nhận đủ tiền</button>
          <button class="btn btn-outline-danger rounded-pill px-4" @click="complain">Tôi chưa nhận</button>
        </div>
      </div>
    </div>
  </div>
</template>
