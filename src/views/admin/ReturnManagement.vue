<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const apiBaseUrl = 'http://localhost:8080/api/admin/doi-tra';

const allReturns = ref([]);
const loading = ref(true);
const activeTab = ref('CHO_XAC_NHAN_HOAN');
const selectedReturn = ref(null);
const showDetailModal = ref(false);

const tabs = [
  { label: 'Yêu Cầu Mới', value: 'CHO_XAC_NHAN_HOAN', icon: 'fas fa-inbox', color: 'warning' },
  { label: 'Chờ Gửi Hàng', value: 'CHO_GIAO_HANG', icon: 'fas fa-shipping-fast', color: 'info' },
  { label: 'Kiểm Hàng Nội Bộ', value: 'DA_NHAN_HANG_KIEM_TRA', icon: 'fas fa-search', color: 'primary' },
  { label: 'Hoàn Thành', value: 'HOAN_THANH', icon: 'fas fa-check-circle', color: 'success' },
  { label: 'Từ Chối', value: 'TU_CHOI', icon: 'fas fa-times-circle', color: 'danger' }
];

const STATUS_MAP = {
  CHO_XAC_NHAN_HOAN: { text: 'Chờ xác nhận', badge: 'bg-warning text-dark' },
  CHO_GIAO_HANG: { text: 'Chờ gửi hàng', badge: 'bg-info text-white' },
  DA_NHAN_HANG_KIEM_TRA: { text: 'Đang kiểm tra', badge: 'bg-primary text-white' },
  HOAN_THANH: { text: 'Hoàn thành', badge: 'bg-success text-white' },
  TU_CHOI: { text: 'Từ chối', badge: 'bg-danger text-white' }
};

// Lọc theo tab
const filteredReturns = computed(() =>
  allReturns.value.filter(r => r.trangThai === activeTab.value)
);

// Đếm số lượng mỗi tab
const tabCount = (status) => allReturns.value.filter(r => r.trangThai === status).length;

// Format
const formatCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`;
const formatDateTime = (v) => v ? new Date(v).toLocaleString('vi-VN') : 'Không có';

// Fetch
const fetchReturns = async () => {
  loading.value = true;
  try {
    const res = await axios.get(apiBaseUrl);
    allReturns.value = res.data.sort((a, b) => b.id - a.id);
  } catch (e) {
    console.error('Lỗi load đổi trả:', e);
  } finally {
    loading.value = false;
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
      await axios.put(`${apiBaseUrl}/${id}/xac-nhan`);
      alert('Đã duyệt yêu cầu thành công!');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      alert(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

// Tab Mới: Từ chối
const rejectRequest = (id) => {
  confirmAction('Xác nhận TỪ CHỐI yêu cầu đổi trả này? Hành động này không thể hoàn tác.', async () => {
    try {
      await axios.put(`${apiBaseUrl}/${id}/tu-choi`);
      alert('Đã từ chối yêu cầu.');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      alert(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

// Tab Chờ Gửi Hàng: Xác nhận đã nhận hàng
const confirmReceived = (id) => {
  confirmAction('Xác nhận ĐÃ NHẬN HÀNG từ bưu cục? Chuyển sang khâu kiểm tra nội bộ.', async () => {
    try {
      await axios.put(`${apiBaseUrl}/${id}/da-nhan-hang`);
      alert('Đã xác nhận nhận hàng. Chuyển sang kiểm tra.');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      alert(e.response?.data?.error || 'Thao tác thất bại');
    }
  });
};

// Tab Kiểm Hàng: Duyệt hoàn tiền
const approveRefund = (id) => {
  confirmAction(
    '⚠️ Xác nhận DUYỆT HOÀN TIỀN?\n\n• Tồn kho sẽ được cộng lại\n• Tiền sẽ được hoàn qua VNPay\n• Không thể hoàn tác!',
    async () => {
      try {
        await axios.put(`${apiBaseUrl}/${id}/quyet-dinh`, { action: 'HOAN_TIEN' });
        alert('Hoàn tiền thành công! Tồn kho đã được cập nhật.');
        await fetchReturns();
        showDetailModal.value = false;
      } catch (e) {
        alert(e.response?.data?.error || 'Hoàn tiền thất bại. Vui lòng thử lại.');
      }
    }
  );
};

// Tab Kiểm Hàng: Từ chối (hàng lỗi do khách)
const rejectAfterCheck = (id) => {
  confirmAction('Xác nhận TỪ CHỐI hoàn trả? Hàng sẽ được trả lại khách (khách chịu phí ship).', async () => {
    try {
      await axios.put(`${apiBaseUrl}/${id}/quyet-dinh`, { action: 'TU_CHOI' });
      alert('Đã từ chối. Hàng sẽ được trả lại cho khách.');
      await fetchReturns();
      showDetailModal.value = false;
    } catch (e) {
      alert(e.response?.data?.error || 'Thao tác thất bại');
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
                </div>
                <p class="text-muted small mb-1">
                  <i class="fas fa-file-invoice me-1"></i>Mã HĐ: <strong>{{ item.hoaDon?.maHoaDon }}</strong>
                </p>
                <p class="text-muted small mb-1">
                  <i class="fas fa-comment me-1"></i>{{ item.lyDo || 'Không có lý do' }}
                </p>
                <p class="text-muted small mb-0">
                  <i class="fas fa-clock me-1"></i>{{ formatDateTime(item.ngayYeuCau) }}
                </p>
              </div>

              <!-- Số tiền hoàn -->
              <div class="text-end">
                <div class="small text-muted">Tổng hoàn</div>
                <div class="fs-5 fw-bold text-success">{{ formatCurrency(item.tongTienHoan) }}</div>
                <div class="small text-muted mt-1">{{ item.chiTiets?.length || 0 }} sản phẩm</div>
              </div>

              <!-- Nút thao tác nhanh -->
              <div class="d-flex flex-column gap-1" @click.stop>
                <!-- Tab Mới -->
                <template v-if="item.trangThai === 'CHO_XAC_NHAN_HOAN'">
                  <button class="btn btn-success btn-sm rounded-pill px-3" @click="approveRequest(item.id)">
                    <i class="fas fa-check me-1"></i>Duyệt
                  </button>
                  <button class="btn btn-outline-danger btn-sm rounded-pill px-3" @click="rejectRequest(item.id)">
                    <i class="fas fa-times me-1"></i>Từ chối
                  </button>
                </template>

                <!-- Tab Chờ Gửi Hàng -->
                <template v-if="item.trangThai === 'CHO_GIAO_HANG'">
                  <button class="btn btn-info btn-sm rounded-pill px-3 text-white" @click="confirmReceived(item.id)">
                    <i class="fas fa-box me-1"></i>Đã nhận hàng
                  </button>
                </template>

                <!-- Tab Kiểm Hàng -->
                <template v-if="item.trangThai === 'DA_NHAN_HANG_KIEM_TRA'">
                  <button class="btn btn-success btn-sm rounded-pill px-3" @click="approveRefund(item.id)">
                    <i class="fas fa-money-bill-wave me-1"></i>Hoàn tiền
                  </button>
                  <button class="btn btn-danger btn-sm rounded-pill px-3" @click="rejectAfterCheck(item.id)">
                    <i class="fas fa-ban me-1"></i>Từ chối
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
    <div class="modal fade" :class="{ show: showDetailModal, 'd-block': showDetailModal }" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 shadow" v-if="selectedReturn">
          <div class="modal-header border-0" :class="`bg-${tabs.find(t => t.value === selectedReturn.trangThai)?.color || 'secondary'} bg-opacity-10`">
            <h5 class="modal-title fw-bold">
              <i class="fas fa-undo-alt me-2"></i>Chi Tiết Đổi Trả: <span class="text-danger">{{ selectedReturn.maDoiTra }}</span>
            </h5>
            <button type="button" class="btn-close" @click="showDetailModal = false"></button>
          </div>
          <div class="modal-body">
            <!-- Thông tin chung -->
            <div class="row mb-4">
              <div class="col-md-6">
                <p class="mb-1 small"><strong>Mã HĐ:</strong> {{ selectedReturn.hoaDon?.maHoaDon }}</p>
                <p class="mb-1 small"><strong>Ngày yêu cầu:</strong> {{ formatDateTime(selectedReturn.ngayYeuCau) }}</p>
                <p class="mb-1 small">
                  <strong>Trạng thái:</strong>
                  <span :class="['badge rounded-pill px-2 ms-1', STATUS_MAP[selectedReturn.trangThai]?.badge]">
                    {{ STATUS_MAP[selectedReturn.trangThai]?.text }}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <p class="mb-1 small"><strong>Lý do:</strong> {{ selectedReturn.lyDo || 'Không có' }}</p>
                <p class="mb-0 small">
                  <strong>Tổng hoàn:</strong>
                  <span class="text-success fw-bold fs-5 ms-1">{{ formatCurrency(selectedReturn.tongTienHoan) }}</span>
                </p>
              </div>
            </div>

            <!-- Danh sách sản phẩm hoàn trả -->
            <h6 class="fw-bold mb-3 border-bottom pb-2">
              <i class="fas fa-box me-1"></i>Sản phẩm hoàn trả
            </h6>
            <div class="table-responsive mb-4">
              <table class="table table-sm table-hover align-middle">
                <thead class="bg-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-center">SL trả</th>
                    <th class="text-end">Giá trị hoàn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ct in selectedReturn.chiTiets" :key="ct.id">
                    <td>
                      <div class="fw-bold small">{{ ct.hoaDonChiTiet?.tenSanPham || 'Sản phẩm' }}</div>
                      <div class="text-muted x-small">
                        {{ ct.hoaDonChiTiet?.mauSac }} | {{ ct.hoaDonChiTiet?.kichThuoc }}
                      </div>
                    </td>
                    <td class="text-center fw-bold">{{ ct.soLuongTra }}</td>
                    <td class="text-end fw-bold text-success">{{ formatCurrency(ct.giaTriHoan) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Ảnh minh chứng -->
            <h6 class="fw-bold mb-3 border-bottom pb-2">
              <i class="fas fa-camera me-1"></i>Ảnh minh chứng
            </h6>
            <div class="d-flex gap-2 flex-wrap mb-3">
              <template v-if="parseImages(selectedReturn.danhSachAnh).length">
                <img
                  v-for="(url, idx) in parseImages(selectedReturn.danhSachAnh)"
                  :key="idx"
                  :src="url"
                  class="rounded-3 border shadow-sm"
                  style="width: 120px; height: 120px; object-fit: cover; cursor: pointer;"
                  @click="window.open(url, '_blank')"
                >
              </template>
              <p v-else class="text-muted small">Không có ảnh minh chứng.</p>
            </div>
          </div>

          <!-- Footer với nút phân thân theo tab -->
          <div class="modal-footer border-0 bg-light">
            <!-- Tab Mới -->
            <template v-if="selectedReturn.trangThai === 'CHO_XAC_NHAN_HOAN'">
              <button class="btn btn-outline-danger rounded-pill px-4" @click="rejectRequest(selectedReturn.id)">
                <i class="fas fa-times me-1"></i>Từ Chối Không Hợp Lệ
              </button>
              <button class="btn btn-success rounded-pill px-4 fw-bold" @click="approveRequest(selectedReturn.id)">
                <i class="fas fa-check me-1"></i>Duyệt
              </button>
            </template>

            <!-- Tab Chờ Gửi Hàng -->
            <template v-if="selectedReturn.trangThai === 'CHO_GIAO_HANG'">
              <button class="btn btn-info rounded-pill px-4 fw-bold text-white" @click="confirmReceived(selectedReturn.id)">
                <i class="fas fa-box me-1"></i>Xác Nhận Đã Nhận Đồ Kho
              </button>
            </template>

            <!-- Tab Kiểm Hàng -->
            <template v-if="selectedReturn.trangThai === 'DA_NHAN_HANG_KIEM_TRA'">
              <button class="btn btn-danger rounded-pill px-4 fw-bold" @click="rejectAfterCheck(selectedReturn.id)">
                <i class="fas fa-ban me-1"></i>Vứt Bỏ, Trả Lại Khách Chịu Ship
              </button>
              <button class="btn btn-success rounded-pill px-4 fw-bold" @click="approveRefund(selectedReturn.id)">
                <i class="fas fa-money-bill-wave me-1"></i>Duyệt Lệnh Hoàn Tiền
              </button>
            </template>

            <!-- Tab Hoàn Thành / Từ Chối: Chỉ nút đóng -->
            <button type="button" class="btn btn-light rounded-pill px-4" @click="showDetailModal = false">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.return-card { transition: all 0.2s ease; }
.return-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
.x-small { font-size: 0.75rem; }
.modal.show { display: block !important; }

.table thead th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 10px;
}
.table tbody td { padding: 12px 10px; }
</style>
