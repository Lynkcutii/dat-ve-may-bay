<script setup>
import { computed } from 'vue';

const props = defineProps({
  doiTra: {
    type: Object,
    default: () => ({})
  }
});

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));

const benChiuLoiText = computed(() => {
  const ben = (props.doiTra?.benChiuLoi || 'KHACH').toUpperCase();
  return ben === 'SHOP' ? 'Lỗi shop' : 'Lỗi khách';
});

const benClass = computed(() => {
  const ben = (props.doiTra?.benChiuLoi || 'KHACH').toUpperCase();
  return ben === 'SHOP' ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
});

const phiXuLyPercent = computed(() => {
  const tienHang = Number(props.doiTra?.tienHangHoan || 0);
  const phi = Number(props.doiTra?.phiXuLy || 0);
  if (tienHang <= 0 || phi <= 0) return 0;
  return Math.round((phi / tienHang) * 100);
});
</script>

<template>
  <div class="refund-breakdown border rounded-3 p-3 bg-light-subtle">
    <div class="d-flex justify-content-between small mb-2">
      <span>Tiền hàng hoàn</span>
      <strong class="text-success">+ {{ fmt(doiTra?.tienHangHoan) }}</strong>
    </div>

    <div class="d-flex justify-content-between small mb-2">
      <span>Phí xử lý <span class="text-muted">({{ phiXuLyPercent }}%)</span></span>
      <strong class="text-danger">− {{ fmt(doiTra?.phiXuLy) }}</strong>
    </div>

    <div class="d-flex justify-content-between small mb-2">
      <span>Phí ship hoàn</span>
      <strong class="text-danger">− {{ fmt(doiTra?.phiShipHoanTru) }}</strong>
    </div>

    <hr class="my-2" />

    <div class="d-flex justify-content-between align-items-center">
      <strong>Tổng hoàn</strong>
      <div class="d-flex align-items-center gap-2">
        <strong class="text-danger">{{ fmt(doiTra?.tongTienHoan) }}</strong>
        <span class="badge border" :class="benClass">{{ benChiuLoiText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.refund-breakdown { font-family: 'Montserrat', 'Inter', sans-serif; }
</style>
