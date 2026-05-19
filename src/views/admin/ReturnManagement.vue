<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import returnApi from '@/api/returnApi';
import RefundBreakdown from '@/components/RefundBreakdown.vue';
import KiemHangModal from '@/components/admin/KiemHangModal.vue';
import HoanTienModal from '@/components/admin/HoanTienModal.vue';

const allReturns = ref([]);
const loading = ref(true);
const activeTab = ref('CHO_XAC_NHAN_HOAN');
const selectedReturn = ref(null);
const showDetailModal = ref(false);
const showLogModal = ref(false);
const returnLogs = ref([]);
const ghiChuAdmin = ref('');
const showKiemModal = ref(false);
const showHoanTienModal = ref(false);

const tabs = [
  { label: 'Yêu Cầu Mới', value: 'CHO_XAC_NHAN_HOAN', icon: 'fas fa-inbox', color: 'warning' },
  { label: 'Chờ Gửi Hàng', value: 'CHO_GIAO_HANG', icon: 'fas fa-shipping-fast', color: 'info' },
  { label: 'Kiểm Hàng Nội Bộ', value: 'DA_NHAN_HANG_KIEM_TRA', icon: 'fas fa-search', color: 'primary' },
  { label: 'Hoàn Thành', value: 'HOAN_THANH', icon: 'fas fa-check-circle', color: 'success' },
  { label: 'Kháng Nghị', value: 'KHANG_NGHI', icon: 'fas fa-gavel', color: 'warning' },
  { label: 'Từ Chối', value: 'TU_CHOI', icon: 'fas fa-times-circle', color: 'danger' }
];

const LOAI_DOI_TRA = {
  REFUND: { text: 'Hoàn tiền 100%', class: 'text-success' },
  EXCHANGE: { text: 'Đổi sản phẩm', class: 'text-primary' }
};

const STATUS_MAP = {
  CHO_XAC_NHAN_HOAN: { text: 'Chờ xác nhận', badge: 'bg-warning text-dark' },
  CHO_GIAO_HANG: { text: 'Chờ gửi hàng', badge: 'bg-info text-white' },
  DA_NHAN_HANG_KIEM_TRA: { text: 'Đang kiểm tra', badge: 'bg-primary text-white' },
  HOAN_THANH: { text: 'Hoàn thành', badge: 'bg-success text-white' },
  KHANG_NGHI: { text: 'Kháng nghị', badge: 'bg-warning text-white' },
  TU_CHOI: { text: 'Từ chối', badge: 'bg-danger text-white' },
  CANCELLED: { text: 'Đã hủy', badge: 'bg-secondary text-white' }
};

const STATUS_PAYMENT_MAP = {
  CHUA_THANH_TOAN: { text: 'Chưa thanh toán/hoàn', badge: 'bg-light text-danger border-danger' },
  CHO_HOAN_TIEN: { text: 'Chờ hoàn tiền', badge: 'bg-warning text-dark' },
  DA_THANH_TOAN: { text: 'Đã thanh toán/hoàn', badge: 'bg-success text-white' },
  DA_XAC_NHAN_NHAN: { text: 'Khách đã xác nhận nhận tiền', badge: 'bg-primary text-white' },
  KHONG_CAN_THANH_TOAN: { text: 'Không phát sinh tiền', badge: 'bg-light text-muted' }
};

const RETURN_STATUS_NORMALIZER = {
  CHO_XAC_NHAN: 'CHO_XAC_NHAN_HOAN',
  CHO_TRA_HANG: 'CHO_GIAO_HANG',
  DA_NHAN_HANG: 'DA_NHAN_HANG_KIEM_TRA',
  CHO_XAC_NHAN_HOAN: 'CHO_XAC_NHAN_HOAN',
  CHO_GIAO_HANG: 'CHO_GIAO_HANG',
  DA_NHAN_HANG_KIEM_TRA: 'DA_NHAN_HANG_KIEM_TRA',
  HOAN_THANH: 'HOAN_THANH',
  KHANG_NGHI: 'KHANG_NGHI',
  TU_CHOI: 'TU_CHOI',
  CANCELLED: 'CANCELLED'
};

const RETURN_TYPE_NORMALIZER = {
  HOAN_TIEN: 'REFUND',
  DOI_HANG: 'EXCHANGE',
  REFUND: 'REFUND',
  EXCHANGE: 'EXCHANGE'
};

const normalizeReturnItem = (item) => ({
  ...item,
  trangThaiGoc: item?.trangThai,
  loaiDoiTraGoc: item?.loaiDoiTra,
  trangThai: RETURN_STATUS_NORMALIZER[item?.trangThai] || item?.trangThai,
  loaiDoiTra: RETURN_TYPE_NORMALIZER[item?.loaiDoiTra] || item?.loaiDoiTra
});

// ...

const canApproveAfterKiem = computed(() => {
  const list = selectedReturn.value?.chiTiets || [];
  if (!list.length) return false;
  return list.every((ct) => ct.benChiuLoi && ct.khopSanPham !== null && ct.khopSanPham !== undefined);
});

const handleKiemSaved = async () => {
  showKiemModal.value = false;
  await fetchReturns();
  if (selectedReturn.value?.id) {
    selectedReturn.value = allReturns.value.find((r) => r.id === selectedReturn.value.id) || selectedReturn.value;
  }
};

const handleHoanTienSaved = async () => {
  showHoanTienModal.value = false;
  await fetchReturns();
  if (selectedReturn.value?.id) {
    selectedReturn.value = allReturns.value.find((r) => r.id === selectedReturn.value.id) || selectedReturn.value;
  }
};

const xuLyKhangNghi = (id, action) => {
  confirmAction(`Xác nhận ${action === 'REOPEN' ? 'mở lại kiểm tra' : 'giữ nguyên quyết định'}?`, async () => {
    try {
      await returnApi.xuLyKhangNghi(id, { action, ghiChu: ghiChuAdmin.value || '' });
      ElMessage.success('Đã xử lý kháng nghị');
      await fetchReturns();
      if (selectedReturn.value?.id) {
        selectedReturn.value = allReturns.value.find((r) => r.id === selectedReturn.value.id) || selectedReturn.value;
      }
    } catch (e) {
      ElMessage.error(e?.response?.data?.error || 'Xử lý kháng nghị thất bại');
    }
  });
};

// ... các computed khác

// Hủy yêu cầu (Rollback)
const cancelRequest = (id) => {
  confirmAction('Bạn có chắc muốn HỦY yêu cầu này? Mọi trạng thái sẽ được đưa về CANCELLED.', async () => {
    try {
      await returnApi.cancel(id, ghiChuAdmin.value || 'Admin hủy yêu cầu');
      ElMessage.success('Đã hủy yêu cầu');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      ElMessage.error(e.response?.data?.error || 'Hủy thất bại');
    }
  });
};

// Lọc theo tab
const filteredReturns = computed(() =>
  allReturns.value.filter(r => r.trangThai === activeTab.value)
);

// Đếm số lượng mỗi tab
const tabCount = (status) => allReturns.value.filter(r => r.trangThai === status).length;

// Format
const formatCurrency = (v) => {
  const num = Number(v || 0);
  return `${Math.abs(num).toLocaleString('vi-VN')} đ`;
};
const formatDateTime = (v) => v ? new Date(v).toLocaleString('vi-VN') : 'Không có';

// Fetch
const fetchReturns = async () => {
  loading.value = true;
  try {
    const res = await returnApi.list();
    allReturns.value = (Array.isArray(res.data) ? res.data : []).map(normalizeReturnItem).sort((a, b) => b.id - a.id);
  } catch (e) {
    console.error('Lỗi load đổi trả:', e);
  } finally {
    loading.value = false;
  }
};

// Xem nhật ký
const viewLogs = async (item) => {
  try {
    const res = await returnApi.logs(item.id);
    returnLogs.value = res.data;
    showLogModal.value = true;
  } catch (e) {
    alert('Không thể tải nhật ký');
  }
};

// Parse ảnh JSON
const parseImages = (jsonStr) => {
  if (!jsonStr) return [];
  try { return JSON.parse(jsonStr); } catch { return []; }
};

// Xem chi tiết
const viewDetail = (item) => {
  selectedReturn.value = item;
  ghiChuAdmin.value = item.ghiChuAdmin || '';
  showDetailModal.value = true;
};

// Confirm trước khi thao tác
const confirmAction = (message, callback) => {
  if (confirm(message)) callback();
};

// === CÁC THAO TÁC PUT ===

// Tab Mới: Duyệt -> CHO_GIAO_HANG
const approveRequest = (id) => {
  confirmAction('Xác nhận DUYỆT yêu cầu đổi trả này? Khách sẽ được thông báo gửi hàng về kho.', async () => {
    try {
      await returnApi.approve(id);
      ElMessage.success('Đã duyệt yêu cầu thành công');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      ElMessage.error(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

// Tab Mới: Từ chối
const rejectRequest = (id) => {
  if (!ghiChuAdmin.value.trim()) {
    alert('Vui lòng nhập lý do từ chối vào ô Ghi chú Admin');
    return;
  }
  confirmAction('Xác nhận TỪ CHỐI yêu cầu đổi trả này?', async () => {
    try {
      await returnApi.reject(id, ghiChuAdmin.value || 'Từ chối');
      ElMessage.success('Đã từ chối yêu cầu');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      ElMessage.error(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

// Tab Chờ Gửi Hàng: Xác nhận đã nhận hàng
const confirmReceived = (id) => {
  confirmAction('Xác nhận ĐÃ NHẬN HÀNG từ bưu cục? Chuyển sang khâu kiểm tra nội bộ.', async () => {
    try {
      await returnApi.received(id);
      ElMessage.success('Đã xác nhận nhận hàng. Chuyển sang kiểm tra');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      ElMessage.error(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

// Tab Kiểm Hàng: Duyệt Quyết Định (Hoàn tất)
const approveDecision = (id) => {
  confirmAction(
    'Xác nhận HOÀN TẤT yêu cầu này? \n- Hàng tốt sẽ về kho bán, hàng lỗi vào kho riêng. \n- Hệ thống sẽ tự động xử lý tồn kho sản phẩm mới (nếu có).',
    async () => {
      try {
        await returnApi.quyetDinh(id, 'HOAN_THANH', ghiChuAdmin.value || '');
        ElMessage.success('Xử lý thành công');
        await fetchReturns();
        showDetailModal.value = false;
      } catch (e) {
        ElMessage.error(e.response?.data?.error || 'Thao tác thất bại');
      }
    }
  );
};

// Tab Kiểm Hàng: Từ chối sau kiểm tra
const rejectAfterCheck = (id) => {
  if (!ghiChuAdmin.value.trim()) {
    alert('Vui lòng nhập lý do từ chối vào ô Ghi chú Admin');
    return;
  }
  confirmAction('Xác nhận TỪ CHỐI yêu cầu sau khi kiểm tra? Hàng sẽ được gửi trả lại khách.', async () => {
    try {
      await returnApi.quyetDinh(id, 'TU_CHOI', ghiChuAdmin.value || '');
      ElMessage.success('Đã từ chối thành công');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      ElMessage.error(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

onMounted(fetchReturns);
</script>

<template>
  <div class="return-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold"><i class="fas fa-undo-alt me-2 text-danger"></i>Quản Lý Đổi Trả</h4>
      <button class="btn btn-outline-dark btn-sm rounded-pill px-3" @click="fetchReturns">
        <i class="fas fa-sync-alt me-1"></i>Làm mới
      </button>
    </div>

    <!-- Tabs -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="[
          'btn btn-sm rounded-pill px-3 fw-bold border',
          activeTab === tab.value ? `btn-${tab.color} text-white` : 'btn-outline-secondary'
        ]"
      >
        <i :class="[tab.icon, 'me-1']"></i>
        {{ tab.label }}
        <span class="badge bg-dark bg-opacity-25 ms-1">{{ tabCount(tab.value) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Danh sách -->
    <div v-else-if="filteredReturns.length === 0" class="text-center py-5">
      <i class="fas fa-inbox fs-1 text-light mb-3 d-block"></i>
      <p class="text-muted">Không có yêu cầu nào trong mục này.</p>
    </div>

    <div v-else class="row g-3">
      <div v-for="item in filteredReturns" :key="item.id" class="col-12">
        <div class="card border-0 shadow-sm rounded-3 return-card" @click="viewDetail(item)" style="cursor: pointer;">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <!-- Thông tin chính -->
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="fw-bold text-danger">{{ item.maDoiTra }}</span>
                  <span :class="['badge rounded-pill px-2', STATUS_MAP[item.trangThai]?.badge]">
                    {{ STATUS_MAP[item.trangThai]?.text }}
                  </span>
                  <span :class="['small fw-bold', LOAI_DOI_TRA[item.loaiDoiTra]?.class]">
                    <i class="fas fa-sync-alt me-1"></i>{{ LOAI_DOI_TRA[item.loaiDoiTra]?.text }}
                  </span>
                </div>
                <div v-if="item.trangThaiThanhToan" class="mb-1">
                  <span :class="['badge rounded-pill px-2 border', STATUS_PAYMENT_MAP[item.trangThaiThanhToan]?.badge || 'bg-light text-muted']">
                    {{ STATUS_PAYMENT_MAP[item.trangThaiThanhToan]?.text || item.trangThaiThanhToan }}
                  </span>
                </div>
                <p class="text-muted small mb-1">
                  <i class="fas fa-file-invoice me-1"></i>Mã HĐ: <strong>{{ item.hoaDon?.maHoaDon }}</strong>
                </p>
                <p class="text-muted small mb-1 text-truncate" style="max-width: 300px;">
                  <i class="fas fa-comment me-1"></i>{{ item.lyDo || 'Không có lý do' }}
                </p>
              </div>

              <!-- Số tiền -->
              <div class="text-end">
                <template v-if="item.loaiDoiTra === 'EXCHANGE'">
                  <div class="small text-muted">Chênh lệch (bù/hoàn)</div>
                  <div class="fs-5 fw-bold" :class="item.tienChenhLech >= 0 ? 'text-danger' : 'text-success'">
                    {{ item.tienChenhLech >= 0 ? '+' : '-' }} {{ formatCurrency(item.tienChenhLech) }}
                  </div>
                </template>
                <template v-else>
                  <div class="small text-muted">Tổng hoàn</div>
                  <div class="fs-5 fw-bold text-success">{{ formatCurrency(item.tongTienHoan) }}</div>
                </template>
                <button class="btn btn-link btn-sm text-decoration-none p-0 mt-1" @click.stop="viewLogs(item)">
                  <i class="fas fa-history me-1"></i>Xem nhật ký
                </button>
              </div>

              <!-- Nút thao tác nhanh -->
              <div class="d-flex flex-column gap-1" @click.stop>
                <!-- Tab Mới -->
                <template v-if="item.trangThai === 'CHO_XAC_NHAN_HOAN'">
                  <button class="btn btn-success btn-sm rounded-pill px-3" @click="approveRequest(item.id)">
                    <i class="fas fa-check me-1"></i>Duyệt
                  </button>
                </template>

                <!-- Tab Chờ Gửi Hàng -->
                <template v-if="item.trangThai === 'CHO_GIAO_HANG'">
                  <button class="btn btn-info btn-sm rounded-pill px-3 text-white" @click="confirmReceived(item.id)">
                    <i class="fas fa-box me-1"></i>Đã nhận
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Chi Tiết -->
    <div v-if="showDetailModal" class="modal-backdrop fade show" @click="showDetailModal = false"></div>
    <div class="modal fade" :class="{ show: showDetailModal, 'd-block': showDetailModal }" tabindex="-1" style="z-index: 1050;">
      <div class="modal-dialog modal-lg modal-dialog-scrollable shadow-lg">
        <div class="modal-content border-0" v-if="selectedReturn">
          <div class="modal-header border-0" :class="`bg-${tabs.find(t => t.value === selectedReturn.trangThai)?.color || 'secondary'} bg-opacity-10`">
            <h5 class="modal-title fw-bold">
              <i class="fas fa-undo-alt me-2"></i>Yêu cầu: <span class="text-danger">{{ selectedReturn.maDoiTra }}</span>
            </h5>
            <button type="button" class="btn-close" @click="showDetailModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Thông tin chung -->
            <div class="row g-4 mb-4">
              <div class="col-md-7">
                <div class="card bg-light border-0">
                  <div class="card-body p-3">
                    <p class="mb-2 small"><strong>Mã HĐ:</strong> {{ selectedReturn.hoaDon?.maHoaDon }}</p>
                    <p class="mb-2 small"><strong>Ngày yêu cầu:</strong> {{ formatDateTime(selectedReturn.ngayYeuCau) }}</p>
                    <p class="mb-2 small">
                      <strong>Loại hình:</strong>
                      <span :class="['ms-2 fw-bold', LOAI_DOI_TRA[selectedReturn.loaiDoiTra]?.class]">
                        {{ LOAI_DOI_TRA[selectedReturn.loaiDoiTra]?.text }}
                      </span>
                    </p>
                    <p class="mb-0 small"><strong>Lý do khách ghi:</strong> {{ selectedReturn.lyDo }}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-5">
                <div class="card border-danger h-100">
                  <div class="card-body text-center d-flex flex-column justify-content-center">
                    <template v-if="selectedReturn.loaiDoiTra === 'EXCHANGE'">
                      <div class="small text-muted mb-1">Tiền chênh lệch ({{ selectedReturn.tienChenhLech >= 0 ? 'Khách bù' : 'Shop trả' }})</div>
                      <div class="fs-3 fw-bold" :class="selectedReturn.tienChenhLech >= 0 ? 'text-danger' : 'text-success'">
                        {{ formatCurrency(selectedReturn.tienChenhLech) }}
                      </div>
                    </template>
                    <template v-else>
                      <div class="small text-muted mb-1">Tổng tiền hoàn trả</div>
                      <div class="fs-3 fw-bold text-success">{{ formatCurrency(selectedReturn.tongTienHoan) }}</div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Danh sách sản phẩm -->
            <h6 class="fw-bold mb-3 d-flex align-items-center">
              <i class="fas fa-box me-2 text-secondary"></i>Chi tiết sản phẩm
            </h6>
            <div class="table-responsive mb-4 border rounded">
              <table class="table table-sm table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th style="width: 40%;">Sản phẩm cũ</th>
                    <th class="text-center">SL</th>
                    <th v-if="selectedReturn.loaiDoiTra === 'EXCHANGE'">Đổi sang</th>
                    <th class="text-center" style="width: 150px;">Kiểm nội bộ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ct in selectedReturn.chiTiets" :key="ct.id">
                    <td>
                      <div class="fw-bold small">{{ ct.hoaDonChiTiet?.tenSanPham }}</div>
                      <div class="text-muted x-small">{{ ct.hoaDonChiTiet?.mauSac }} | {{ ct.hoaDonChiTiet?.kichThuoc }}</div>
                    </td>
                    <td class="text-center fw-bold">{{ ct.soLuongTra }}</td>
                    <td v-if="selectedReturn.loaiDoiTra === 'EXCHANGE'">
                      <div v-if="ct.idSpctMoi" class="text-primary small">
                        <i class="fas fa-arrow-right me-1"></i> ID Biến thể: {{ ct.idSpctMoi }}
                      </div>
                      <div v-else class="text-muted small italic">N/A</div>
                    </td>
                    <td class="text-center">
                      <span v-if="ct.khopSanPham === false" class="badge bg-danger">Sai SKU</span>
                      <span v-else-if="ct.khopSanPham === true" class="badge bg-success">Đúng SKU</span>
                      <span v-else class="badge bg-secondary">Chưa kiểm</span>
                      <div class="x-small mt-1" v-if="ct.benChiuLoi">{{ ct.benChiuLoi }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Ảnh minh chứng -->
            <h6 class="fw-bold mb-3 border-bottom pb-2">Ảnh minh chứng từ khách</h6>
            <div class="d-flex gap-2 flex-wrap mb-4">
              <template v-if="parseImages(selectedReturn.danhSachAnh).length">
                <img
                  v-for="(url, idx) in parseImages(selectedReturn.danhSachAnh)"
                  :key="idx"
                  :src="url"
                  class="rounded-3 border shadow-sm"
                  style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
                  @click="window.open(url, '_blank')"
                >
              </template>
              <p v-else class="text-muted small">Không có ảnh.</p>
            </div>

            <RefundBreakdown
              v-if="['DA_NHAN_HANG_KIEM_TRA','HOAN_THANH','KHANG_NGHI'].includes(selectedReturn.trangThai)"
              :doiTra="selectedReturn"
              class="mb-3"
            />

            <div v-if="selectedReturn.trangThai === 'KHANG_NGHI'" class="alert alert-warning py-2 small">
              <div><strong>Lý do kháng nghị:</strong> {{ selectedReturn.lyDoKhangNghi || 'Không có' }}</div>
              <div><strong>Ngày kháng nghị:</strong> {{ formatDateTime(selectedReturn.ngayKhangNghi) }}</div>
            </div>

            <!-- Ghi chú Admin (Hiện khi cần thao tác hoặc đã hoàn thành) -->
            <div class="mb-2">
              <label class="form-label fw-bold small">Ghi chú Admin (Lý do từ chối/Ghi chú kiểm kho):</label>
              <textarea 
                v-model="ghiChuAdmin" 
                class="form-control" 
                rows="2" 
                placeholder="Nhập ghi chú tại đây..."
                :disabled="selectedReturn.trangThai === 'HOAN_THANH' || selectedReturn.trangThai === 'TU_CHOI'"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-0 bg-light">
            <button class="btn btn-outline-secondary btn-sm me-auto" @click="viewLogs(selectedReturn)">
              <i class="fas fa-history me-1"></i>Lịch sử xử lý
            </button>

            <!-- Thao tác theo tab -->
            <template v-if="selectedReturn.trangThai === 'CHO_XAC_NHAN_HOAN'">
              <button class="btn btn-outline-danger rounded-pill px-4" @click="rejectRequest(selectedReturn.id)">Từ Chối</button>
              <button class="btn btn-success rounded-pill px-4 fw-bold" @click="approveRequest(selectedReturn.id)">Duyệt Yêu Cầu</button>
            </template>

            <template v-if="selectedReturn.trangThai === 'CHO_GIAO_HANG'">
              <button class="btn btn-info rounded-pill px-4 fw-bold text-white" @click="confirmReceived(selectedReturn.id)">Xác Nhận Đã Nhận Hàng</button>
            </template>

            <template v-if="selectedReturn.trangThai === 'DA_NHAN_HANG_KIEM_TRA'">
              <button class="btn btn-outline-primary rounded-pill px-4" @click="showKiemModal = true">Kiểm hàng</button>
              <button class="btn btn-outline-danger rounded-pill px-4" @click="rejectAfterCheck(selectedReturn.id)">Từ Chối (Trả hàng khách)</button>
              <button class="btn btn-success rounded-pill px-4 fw-bold" :disabled="!canApproveAfterKiem" @click="approveDecision(selectedReturn.id)">Hoàn Tất Phê Duyệt</button>
            </template>

            <template v-if="selectedReturn.trangThai === 'KHANG_NGHI'">
              <button class="btn btn-outline-warning rounded-pill px-4" @click="xuLyKhangNghi(selectedReturn.id, 'REOPEN')">Mở lại kiểm tra</button>
              <button class="btn btn-warning rounded-pill px-4 fw-bold" @click="xuLyKhangNghi(selectedReturn.id, 'GIU_NGUYEN')">Giữ nguyên</button>
            </template>

            <button 
              v-if="!['HOAN_THANH', 'TU_CHOI', 'CANCELLED'].includes(selectedReturn.trangThai)"
              class="btn btn-dark rounded-pill px-4" 
              @click="cancelRequest(selectedReturn.id)"
            >
              Hủy Yêu Cầu
            </button>

            <button
              v-if="selectedReturn.trangThai === 'HOAN_THANH' && ['CHO_HOAN_TIEN', 'CHUA_THANH_TOAN'].includes(selectedReturn.trangThaiThanhToan)"
              class="btn btn-warning rounded-pill px-4 fw-bold"
              @click="showHoanTienModal = true"
            >
              <i class="fas fa-money-bill-wave me-1"></i> Xác nhận hoàn tiền
            </button>

            <button type="button" class="btn btn-light rounded-pill px-4" @click="showDetailModal = false">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nhật Ký (Log) -->
    <div v-if="showLogModal" class="modal-backdrop fade show" style="z-index: 1070;" @click="showLogModal = false"></div>
    <div class="modal fade" :class="{ show: showLogModal, 'd-block': showLogModal }" tabindex="-1" style="z-index: 1080;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-dark text-white border-0">
            <h5 class="modal-title fw-bold small"><i class="fas fa-history me-2"></i>Nhật ký xử lý đơn</h5>
            <button type="button" class="btn-close btn-close-white" @click="showLogModal = false"></button>
          </div>
          <div class="modal-body p-0" style="max-height: 500px; overflow-y: auto;">
            <ul class="list-group list-group-flush">
              <li v-for="log in returnLogs" :key="log.id" class="list-group-item p-3 border-0 border-bottom">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <span class="badge bg-secondary x-small">{{ log.hanhDong }}</span>
                  <span class="text-muted x-small">{{ formatDateTime(log.ngayTao) }}</span>
                </div>
                <div class="small text-dark">{{ log.chiTiet }}</div>
              </li>
              <li v-if="returnLogs.length === 0" class="list-group-item text-center py-4 text-muted small">Chưa có lịch sử.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <KiemHangModal
      :show="showKiemModal"
      :doiTra="selectedReturn || {}"
      @close="showKiemModal = false"
      @saved="handleKiemSaved"
    />

    <HoanTienModal
      :show="showHoanTienModal"
      :doiTra="selectedReturn || {}"
      @close="showHoanTienModal = false"
      @saved="handleHoanTienSaved"
    />
  </div>
</template>

<style scoped>
.return-mgmt,
.modal-content {
  font-family: 'Montserrat', 'Inter', 'Segoe UI', 'Noto Sans', Arial, sans-serif;
}
.return-card { transition: all 0.2s ease; }
.return-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.x-small { font-size: 0.75rem; }
.modal.show { display: block !important; }

.table thead th {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 10px;
}
.table tbody td { padding: 12px 10px; }
</style>
