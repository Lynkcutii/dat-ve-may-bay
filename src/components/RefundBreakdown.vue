<script setup>
import { computed } from 'vue';

const props = defineProps({
  doiTra: {
    type: Object,
    default: () => ({})
  }
});

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));

const benStats = computed(() => {
  const chiTiets = Array.isArray(props.doiTra?.chiTiets) ? props.doiTra.chiTiets : [];
  const shopItems = chiTiets.filter((x) => (x?.benChiuLoi || '').toUpperCase() === 'SHOP');
  const khachItems = chiTiets.filter((x) => (x?.benChiuLoi || '').toUpperCase() === 'KHACH');

  if (!chiTiets.length) {
    return { type: 'UNKNOWN', label: 'Chưa kiểm', className: 'bg-secondary text-white', detail: '' };
  }
  if (shopItems.length && !khachItems.length) {
    return { type: 'SHOP', label: 'Lỗi shop', className: 'bg-success-subtle text-success border-success-subtle', detail: '' };
  }
  if (!shopItems.length && khachItems.length) {
    return { type: 'KHACH', label: 'Lỗi khách', className: 'bg-warning-subtle text-warning-emphasis border-warning-subtle', detail: '' };
  }

  const detail = chiTiets
    .map((x) => {
      const name = x?.hoaDonChiTiet?.tenSanPham || `#${x?.id || 'N/A'}`;
      const ben = x?.benChiuLoi || 'N/A';
      return `${name}: ${ben}`;
    })
    .join('\n');

  return {
    type: 'MIX',
    label: 'Hỗn hợp',
    className: 'bg-info-subtle text-info-emphasis border-info-subtle',
    detail
  };
});

const phiXuLyPercent = computed(() => {
  const tienHang = Number(props.doiTra?.tienHangHoan || 0);
  const phi = Number(props.doiTra?.phiXuLy || 0);
  if (tienHang <= 0 || phi <= 0) return 0;
  return Math.round((phi / tienHang) * 100);
});

const showPhiShipDiHoan = computed(() => Number(props.doiTra?.phiShipDiHoan || 0) > 0);
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

    <div v-if="showPhiShipDiHoan" class="d-flex justify-content-between small mb-2">
      <span>Hoàn ship đi</span>
      <strong class="text-success">+ {{ fmt(doiTra?.phiShipDiHoan) }}</strong>
    </div>

    <hr class="my-2" />

    <div class="d-flex justify-content-between align-items-center">
      <strong>Tổng hoàn</strong>
      <div class="d-flex align-items-center gap-2">
        <strong class="text-danger">{{ fmt(doiTra?.tongTienHoan) }}</strong>
        <span class="badge border" :class="benStats.className" :title="benStats.detail">{{ benStats.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.refund-breakdown {
  font-family: 'Montserrat', 'Inter', sans-serif;
}
</style>
