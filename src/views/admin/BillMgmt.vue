<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import DateFilter from '@/components/DateFilter.vue';
import RefundRequestModal from '@/components/RefundRequestModal.vue';
import { ElMessage } from 'element-plus';

const apiBaseUrl = 'http://localhost:8080/api/admin';

const bills = ref([]);
const loading = ref(true);
const selectedBill = ref(null);
const billDetail = ref(null);
const newStatus = ref('');
const showRefundModal = ref(false);

const activeTab = ref('ALL');
const BILL_TABS = [
  { label: 'Tất cả', value: 'ALL', icon: 'fas fa-list' },
  { label: 'Chờ xác nhận', value: 'CHO_XAC_NHAN', icon: 'fas fa-clock' },
  { label: 'Đã xác nhận', value: 'DA_XAC_NHAN', icon: 'fas fa-check-circle' },
  { label: 'Đang giao', value: 'DANG_GIAO', icon: 'fas fa-shipping-fast' },
  { label: 'Đã giao', value: 'DA_GIAO', icon: 'fas fa-check-double' },
  { label: 'Yêu cầu trả hàng', value: 'YEU_CAU_TRA_HANG', icon: 'fas fa-rotate-left' },
  { label: 'Hoàn trả một phần', value: 'HOAN_TRA_MOT_PHAN', icon: 'fas fa-box-open' },
  { label: 'Hoàn trả', value: 'HOAN_TRA', icon: 'fas fa-undo' },
  { label: 'Đã hủy', value: 'DA_HUY', icon: 'fas fa-times-circle' },
];

const STATUS_ALIAS = {
  CHO_THANH_TOAN: 'CHO_XAC_NHAN',
  DA_THANH_TOAN: 'DA_XAC_NHAN',
};

const normalizeBillStatus = (status) => STATUS_ALIAS[status] || status;

const filterData = ref({ day: '', month: '', year: '' });
const filterLoaiDon = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const ORDER_TYPE_TABS = [
  { label: 'Tất cả đơn', value: '', icon: 'fas fa-border-all' },
  { label: 'Đơn Online', value: 'ONLINE', icon: 'fas fa-globe' },
  { label: 'Đơn Tại Quầy', value: 'TAI_QUAY', icon: 'fas fa-store' },
];

const stats = computed(() => {
  const onlineBills = bills.value.filter(b => b.loaiDonHang === 'ONLINE');
  const posBills = bills.value.filter(b => b.loaiDonHang === 'TAI_QUAY');
  
  return {
    all: {
      count: bills.value.length
    },
    online: {
      count: onlineBills.length,
      revenue: onlineBills.reduce((sum, b) => sum + (Number(b.tongThanhToan) || 0), 0)
    },
    pos: {
      count: posBills.length,
      revenue: posBills.reduce((sum, b) => sum + (Number(b.tongThanhToan) || 0), 0)
    }
  };
});

const tabCounts = computed(() => {
  const counts = { ALL: bills.value.length };
  BILL_TABS.forEach((tab) => {
    if (tab.value !== 'ALL') {
      counts[tab.value] = bills.value.filter((b) => normalizeBillStatus(b.trangThaiDon) === tab.value).length;
    }
  });
  return counts;
});

const STATUS_META = {
  CHO_XAC_NHAN: { text: 'Chờ xác nhận', badge: 'bg-soft-info text-info', icon: 'fas fa-clock' },
  DA_XAC_NHAN: { text: 'Đã xác nhận', badge: 'bg-soft-primary text-primary', icon: 'fas fa-check-circle' },
  DANG_GIAO: { text: 'Đang giao', badge: 'bg-soft-warning text-warning', icon: 'fas fa-shipping-fast' },
  DA_GIAO: { text: 'Đã giao', badge: 'bg-soft-success text-success', icon: 'fas fa-check-double' },
  YEU_CAU_TRA_HANG: { text: 'Yêu cầu trả hàng', badge: 'bg-soft-warning text-warning', icon: 'fas fa-rotate-left' },
  HOAN_TRA_MOT_PHAN: { text: 'Hoàn trả một phần', badge: 'bg-soft-secondary text-secondary', icon: 'fas fa-box-open' },
  HOAN_TRA: { text: 'Hoàn trả', badge: 'bg-soft-secondary text-secondary', icon: 'fas fa-undo' },
  DA_HUY: { text: 'Đã hủy', badge: 'bg-soft-danger text-danger', icon: 'fas fa-times-circle' },
};

const editableStatuses = [
  'CHO_XAC_NHAN',
  'DA_XAC_NHAN',
  'DANG_GIAO',
  'DA_GIAO',
  'HOAN_TRA',
  'DA_HUY',
];

const getAvailableStatuses = computed(() => {
  if (!selectedBill.value) return [];
  return Array.isArray(selectedBill.value.availableNextStatuses)
    ? selectedBill.value.availableNextStatuses
    : [];
});

const filteredBills = computed(() =>
  bills.value
    .filter((bill) => {
      if (activeTab.value !== 'ALL' && normalizeBillStatus(bill.trangThaiDon) !== activeTab.value) return false;

      if (bill.ngayTao) {
        const date = new Date(bill.ngayTao);
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();

        if (filterData.value.day && d !== Number.parseInt(filterData.value.day, 10)) return false;
        if (filterData.value.month && m !== Number.parseInt(filterData.value.month, 10)) return false;
        if (filterData.value.year && y !== Number.parseInt(filterData.value.year, 10)) return false;
      }

      if (filterLoaiDon.value && bill.loaiDonHang !== filterLoaiDon.value) return false;

      return true;
    })
    .sort((a, b) => {
      // Sắp xếp theo ngày tạo mới nhất lên đầu
      return new Date(b.ngayTao) - new Date(a.ngayTao);
    }),
);

const totalPages = computed(() => Math.ceil(filteredBills.value.length / itemsPerPage.value));

const paginatedBills = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredBills.value.slice(start, start + itemsPerPage.value);
});

const handleFilter = (data) => {
  filterData.value = data;
  currentPage.value = 1;
};

const getStatusBadge = (status) => STATUS_META[normalizeBillStatus(status)]?.badge || 'bg-secondary text-white';
const getStatusText = (status) => STATUS_META[normalizeBillStatus(status)]?.text || 'Không xác định';
const getStatusIcon = (status) => STATUS_META[normalizeBillStatus(status)]?.icon || 'fas fa-dot-circle';

const formatSafeText = (value, fallback = 'Không có') => value || fallback;
const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} d`;
const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : 'Không có');

const ORDER_STEPS = [
  { label: 'Chờ xác nhận', value: 'CHO_XAC_NHAN', icon: 'fas fa-clock' },
  { label: 'Đã xác nhận', value: 'DA_XAC_NHAN', icon: 'fas fa-check-circle' },
  { label: 'Đang giao', value: 'DANG_GIAO', icon: 'fas fa-shipping-fast' },
  { label: 'Đã giao', value: 'DA_GIAO', icon: 'fas fa-check-double' },
];

const getProgressWidth = (status) => {
  const normalizedStatus = normalizeBillStatus(status);
  const index = ORDER_STEPS.findIndex((s) => s.value === normalizedStatus);
  if (index === -1) return '0%';
  return `${(index / (ORDER_STEPS.length - 1)) * 100}%`;
};

const isStepActive = (currentStatus, stepValue) => {
  const normalizedCurrentStatus = normalizeBillStatus(currentStatus);
  const currentIndex = ORDER_STEPS.findIndex((s) => s.value === normalizedCurrentStatus);
  const stepIndex = ORDER_STEPS.findIndex((s) => s.value === stepValue);
  if (currentIndex === -1) return false;
  return stepIndex <= currentIndex;
};

const formatShippingAddress = (bill) => {
  if (!bill) return 'Không có';
  const parts = [bill.diaChiChiTiet, bill.xa, bill.huyen, bill.tinh].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Không có';
};

const fetchBills = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/bills`, {
      headers: { 'Accept': 'application/json;charset=UTF-8' }
    });
    bills.value = res.data;
  } catch (error) {
    console.error('Error fetching bills:', error);
  } finally {
    loading.value = false;
  }
};

const fetchBillDetail = async (id) => {
  try {
    const res = await axios.get(`${apiBaseUrl}/bills/${id}`);
    billDetail.value = res.data;
  } catch (error) {
    console.error('Error fetching bill detail:', error);
  }
};

const openEditModal = (bill) => {
  selectedBill.value = bill;
  newStatus.value = bill.trangThaiDon;
  const modal = new bootstrap.Modal(document.getElementById('editStatusModal'));
  modal.show();
};

const updateStatus = async () => {
  if (!selectedBill.value || !newStatus.value) return;

  if (newStatus.value === 'HOAN_TRA') {
    const allowedStatuses = ['DA_GIAO', 'YEU_CAU_TRA_HANG', 'HOAN_TRA_MOT_PHAN'];
    if (!allowedStatuses.includes(selectedBill.value.trangThaiDon)) {
      ElMessage.error('Chỉ có thể tạo yêu cầu hoàn trả cho đơn hàng đã giao hoặc đang xử lý đổi trả.');
      newStatus.value = selectedBill.value.trangThaiDon;
      return;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('editStatusModal'));
    if (modal) modal.hide();

    if (!billDetail.value || billDetail.value.bill?.id !== selectedBill.value.id) {
      await fetchBillDetail(selectedBill.value.id);
    }

    showRefundModal.value = true;
    newStatus.value = selectedBill.value.trangThaiDon;
    return;
  }

  try {
    await axios.put(`${apiBaseUrl}/bills/${selectedBill.value.id}/status`, newStatus.value, {
      headers: { 'Content-Type': 'text/plain' },
    });

    await fetchBills();

    if (billDetail.value && billDetail.value.bill?.id === selectedBill.value.id) {
      await fetchBillDetail(selectedBill.value.id);
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('editStatusModal'));
    if (modal) modal.hide();
    ElMessage.success('Cập nhật trạng thái thành công!');
  } catch (error) {
    console.error('Error updating status:', error);
    ElMessage.error(error.response?.data?.error || error.response?.data?.message || 'Cập nhật thất bại!');
  }
};

const viewDetail = async (bill) => {
  selectedBill.value = bill;
  await fetchBillDetail(bill.id);
  const modal = new bootstrap.Modal(document.getElementById('billDetailModal'));
  modal.show();
};

const openRefundModal = () => {
  const modal = bootstrap.Modal.getInstance(document.getElementById('billDetailModal'));
  if (modal) modal.hide();
  showRefundModal.value = true;
};

onMounted(fetchBills);
</script>

<template>
  <div class="bill-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold m-0"><i class="fas fa-file-invoice-dollar me-2 text-danger"></i>Quản Lý Hóa Đơn</h4>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-dark btn-sm rounded-pill px-3 shadow-sm" @click="fetchBills">
          <i class="fas fa-sync-alt me-1"></i>Làm mới
        </button>
      </div>
    </div>

    <!-- Summary Stats & Filters -->
    <div class="row g-3 mb-4">
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-gradient-all text-white cursor-pointer stat-card"
          :class="{ 'active': filterLoaiDon === '' }"
          @click="filterLoaiDon = ''; currentPage = 1">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="icon-shape bg-white bg-opacity-25 rounded-3 p-2">
                <i class="fas fa-border-all fs-4"></i>
              </div>
              <span class="badge bg-white text-dark rounded-pill">{{ stats.all.count }} đơn</span>
            </div>
            <div class="small fw-bold opacity-75">Tất cả đơn hàng</div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-gradient-online text-white cursor-pointer stat-card"
          :class="{ 'active': filterLoaiDon === 'ONLINE' }"
          @click="filterLoaiDon = 'ONLINE'; currentPage = 1">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="icon-shape bg-white bg-opacity-25 rounded-3 p-2">
                <i class="fas fa-globe fs-4"></i>
              </div>
              <span class="badge bg-white text-info rounded-pill">{{ stats.online.count }} đơn</span>
            </div>
            <div class="small fw-bold opacity-75">Đơn hàng Online</div>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-gradient-pos text-white cursor-pointer stat-card"
          :class="{ 'active': filterLoaiDon === 'TAI_QUAY' }"
          @click="filterLoaiDon = 'TAI_QUAY'; currentPage = 1">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="icon-shape bg-white bg-opacity-25 rounded-3 p-2">
                <i class="fas fa-store fs-4"></i>
              </div>
              <span class="badge bg-white text-warning rounded-pill">{{ stats.pos.count }} đơn</span>
            </div>
            <div class="small fw-bold opacity-75">Đơn hàng Tại Quầy</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm rounded-4 mb-4">
      <div class="card-body p-3">
        <!-- Main Status Tabs -->
        <div class="status-tabs-wrapper mb-4 overflow-auto pb-2">
          <div class="nav nav-pills flex-nowrap bg-light p-1 rounded-pill shadow-sm" style="width: fit-content;">
            <button
              v-for="tab in BILL_TABS"
              :key="tab.value"
              @click="activeTab = tab.value; currentPage = 1"
              :class="['nav-link rounded-pill px-4 fw-bold transition-all text-nowrap d-flex align-items-center gap-2 position-relative', activeTab === tab.value ? 'bg-danger text-white active shadow-sm' : 'text-muted hover-bg-light']"
            >
              <i :class="tab.icon"></i>
              <span>{{ tab.label }}</span>
              <span
                v-if="tabCounts[tab.value] > 0"
                :class="['badge rounded-pill py-1 px-2', activeTab === tab.value ? 'bg-white text-danger' : 'bg-danger text-white']"
                style="font-size: 0.7rem;"
              >
                {{ tabCounts[tab.value] }}
              </span>
            </button>
          </div>
        </div>

        <div class="d-flex flex-column gap-3">
          <!-- Filters Row -->
          <div class="d-flex align-items-center gap-3 flex-wrap">
             <DateFilter @filter="handleFilter" class="mb-0 flex-grow-1" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-table">
            <thead>
              <tr class="bg-light">
                <th class="ps-4">Mã HD</th>
                <th>Khách Hàng</th>
                <th>Loại Đơn</th>
                <th>Ngày Lập</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th class="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bill in paginatedBills" :key="bill.id" class="transition-all hover-bg-light-subtle border-bottom-light">
                <td class="ps-4">
                  <div class="d-flex flex-column">
                    <span class="fw-bold text-danger">{{ bill.maHoaDon }}</span>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-sm me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                      <i class="fas fa-user text-muted small"></i>
                    </div>
                    <div class="d-flex flex-column">
                      <span class="fw-bold text-dark small">{{ formatSafeText(bill.tenKhachHang || bill.tenNguoiNhan) }}</span>
                      <span class="text-muted x-small">{{ formatSafeText(bill.soDienThoai, '') }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div :class="['type-badge d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1', bill.loaiDonHang === 'ONLINE' ? 'bg-online-soft text-online' : 'bg-pos-soft text-pos']">
                    <i :class="bill.loaiDonHang === 'ONLINE' ? 'fas fa-globe' : 'fas fa-store'"></i>
                    <span class="fw-bold x-small">{{ bill.loaiDonHang === 'ONLINE' ? 'Online' : 'Tại quầy' }}</span>
                  </div>
                </td>
                <td class="text-muted small">
                   <div class="d-flex flex-column">
                      <span>{{ formatDateTime(bill.ngayTao).split(' ')[0] }}</span>
                      <span class="x-small opacity-75">{{ formatDateTime(bill.ngayTao).split(' ')[1] }}</span>
                   </div>
                </td>
                <td class="fw-bold text-dark">{{ formatCurrency(bill.tongThanhToan) }}</td>
                <td>
                  <span :class="['badge rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2', getStatusBadge(bill.trangThaiDon)]">
                    <i :class="getStatusIcon(bill.trangThaiDon)"></i>
                    {{ getStatusText(bill.trangThaiDon) }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-icon btn-action btn-view" @click="viewDetail(bill)" title="Xem chi tiết">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-action btn-edit" @click="openEditModal(bill)" title="Cập nhật trạng thái">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <nav class="mt-4" v-if="totalPages > 1">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage--">
            <i class="fas fa-chevron-left"></i>
          </a>
        </li>
        <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
          <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage = page">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage++">
            <i class="fas fa-chevron-right"></i>
          </a>
        </li>
      </ul>
    </nav>

    <div class="modal fade" id="editStatusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <h5 class="modal-title fw-bold">Cập nhật trạng thái</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body px-4 pt-3 pb-4">
            <div v-if="selectedBill">
              <div class="d-flex align-items-center mb-4 p-3 bg-light rounded-3">
                <div class="me-3">
                  <div class="small text-muted mb-1">Đơn hàng</div>
                  <div class="fw-bold text-danger">{{ selectedBill.maHoaDon }}</div>
                </div>
                <div class="ms-auto text-end">
                  <div class="small text-muted mb-1">Trạng thái hiện tại</div>
                  <span :class="['badge rounded-pill px-3 py-2', getStatusBadge(selectedBill.trangThaiDon)]">
                    {{ getStatusText(selectedBill.trangThaiDon) }}
                  </span>
                </div>
              </div>

              <div v-if="getAvailableStatuses.length > 0">
                <label class="form-label fw-bold small text-muted mb-2">Chọn trạng thái tiếp theo</label>
                <div class="status-selector d-flex flex-column gap-2">
                  <div
                    v-for="status in getAvailableStatuses"
                    :key="status"
                    @click="newStatus = status"
                    :class="['status-option p-3 rounded-3 border-2 cursor-pointer transition-all d-flex align-items-center',
                      newStatus === status ? 'border-primary bg-primary-subtle' : 'border-light bg-white hover-light']"
                  >
                    <div class="status-radio me-3">
                      <div :class="['radio-circle', newStatus === status ? 'bg-primary' : 'border']"></div>
                    </div>
                    <div class="flex-grow-1">
                      <div class="fw-bold">{{ getStatusText(status) }}</div>
                    </div>
                    <span :class="['badge rounded-pill px-2', getStatusBadge(status)]" style="font-size: 0.7rem;">
                      {{ getStatusText(status) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else-if="editableStatuses.length > 0">
                <label class="form-label fw-bold small text-muted mb-2">Chọn trạng thái mới</label>
                <div class="status-selector d-flex flex-column gap-2">
                  <div
                    v-for="status in editableStatuses"
                    :key="status"
                    @click="newStatus = status"
                    :class="['status-option p-3 rounded-3 border-2 cursor-pointer transition-all d-flex align-items-center',
                      newStatus === status ? 'border-primary bg-primary-subtle' : 'border-light bg-white hover-light']"
                  >
                    <div class="status-radio me-3">
                      <div :class="['radio-circle', newStatus === status ? 'bg-primary' : 'border']"></div>
                    </div>
                    <div class="flex-grow-1">
                      <div class="fw-bold">{{ getStatusText(status) }}</div>
                    </div>
                    <span :class="['badge rounded-pill px-2', getStatusBadge(status)]" style="font-size: 0.7rem;">
                      {{ getStatusText(status) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-muted">
                <i class="fas fa-lock mb-2 fs-4"></i>
                <p class="small mb-0">Đơn hàng đã ở trạng thái cuối cùng, không thể thay đổi thêm.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 px-4 pb-4 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-4 fw-bold" data-bs-dismiss="modal">Hủy bỏ</button>
            <button
              v-if="getAvailableStatuses.length > 0 || editableStatuses.length > 0"
              type="button"
              class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
              @click="updateStatus"
              :disabled="!newStatus || newStatus === selectedBill.trangThaiDon"
            >
              Xác nhận đổi trạng thái
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="billDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="billDetail">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">
              Chi tiết hóa đơn: <span class="text-danger">{{ billDetail.bill.maHoaDon }}</span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-0">
            <div class="order-progress-wrapper mb-5 py-4 px-3 bg-white rounded-4 shadow-sm border mt-2">
              <div v-if="billDetail.bill.trangThaiDon !== 'DA_HUY' && billDetail.bill.trangThaiDon !== 'HOAN_TRA'">
                <div class="progress-track position-relative px-4">
                  <div class="progress-line position-absolute top-50 translate-middle-y" style="height: 4px; background-color: #e9ecef; left: 40px; right: 40px;"></div>
                  <div
                    class="progress-line-active position-absolute top-50 translate-middle-y transition-all"
                    :style="{ height: '4px', backgroundColor: '#198754', width: `calc(${getProgressWidth(billDetail.bill.trangThaiDon)} - 40px)`, left: '40px' }"
                  ></div>

                  <div class="d-flex justify-content-between position-relative" style="z-index: 2;">
                    <div v-for="step in ORDER_STEPS" :key="step.value" class="text-center" style="width: 110px; margin: 0 -25px;">
                      <div
                        :class="['step-icon mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm transition-all',
                          isStepActive(billDetail.bill.trangThaiDon, step.value) ? 'bg-success text-white border-success' : 'bg-white text-secondary border']"
                        style="width: 42px; height: 42px; border-width: 3px !important;"
                      >
                        <i :class="step.icon" style="font-size: 1.1rem;"></i>
                      </div>
                      <div :class="['small fw-bold px-2', isStepActive(billDetail.bill.trangThaiDon, step.value) ? 'text-dark' : 'text-muted']" style="font-size: 0.75rem; line-height: 1.2;">
                        {{ step.label }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="billDetail.bill.trangThaiDon === 'DA_HUY'" class="d-flex align-items-center justify-content-center text-danger py-2">
                <i class="fas fa-times-circle me-3 fs-3"></i>
                <div class="text-center">
                  <h6 class="mb-0 fw-bold text-uppercase">Đơn hàng đã bị hủy</h6>
                  <small class="text-muted">Cập nhật lúc: {{ formatDateTime(billDetail.bill.ngayCapNhat) }}</small>
                </div>
              </div>
              <div v-else-if="billDetail.bill.trangThaiDon === 'HOAN_TRA'" class="d-flex align-items-center justify-content-center text-warning py-2">
                <i class="fas fa-undo me-3 fs-3"></i>
                <div class="text-center">
                  <h6 class="mb-0 fw-bold text-uppercase text-dark">Đơn hàng đã hoàn trả</h6>
                  <small class="text-muted">Cập nhật lúc: {{ formatDateTime(billDetail.bill.ngayCapNhat) }}</small>
                </div>
              </div>
            </div>

            <div class="mb-4">
              <h6 class="fw-bold mb-3 border-bottom pb-2"><i class="fas fa-history me-2"></i>Chi tiết lịch sử</h6>
              <div class="timeline-v2">
                <div v-for="history in billDetail.history" :key="history.id" class="timeline-item">
                  <div class="timeline-marker" :class="getStatusBadge(history.trangThaiMoi)">
                    <i :class="getStatusIcon(history.trangThaiMoi)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span :class="['badge rounded-pill px-3 py-1', getStatusBadge(history.trangThaiMoi)]">
                        {{ getStatusText(history.trangThaiMoi) }}
                      </span>
                      <small class="text-muted fw-bold"><i class="far fa-clock me-1"></i>{{ formatDateTime(history.thoiGian) }}</small>
                    </div>
                    <div class="timeline-desc small text-dark p-2 rounded-2 bg-light border-start border-3" :class="'border-' + (getStatusBadge(history.trangThaiMoi).split('-')[1])">
                      <div class="fw-bold mb-1">{{ history.hanhDong || 'Cập nhật trạng thái' }}</div>
                      <div v-if="history.trangThaiCu" class="text-muted x-small">
                        <i class="fas fa-exchange-alt me-1"></i>
                        {{ getStatusText(history.trangThaiCu) }} <i class="fas fa-long-arrow-alt-right mx-1"></i> {{ getStatusText(history.trangThaiMoi) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-6">
                <h6 class="fw-bold mb-3 border-bottom pb-2">Thông tin khách hàng</h6>
                <p class="mb-1"><strong>Họ tên:</strong> {{ formatSafeText(billDetail.bill.tenNguoiNhan || billDetail.bill.tenKhachHang) }}</p>
                <p class="mb-1"><strong>Số điện thoại:</strong> {{ formatSafeText(billDetail.bill.soDienThoai) }}</p>
                <p class="mb-1"><strong>Thanh toán:</strong> <span class="badge bg-soft-success text-success">{{ formatSafeText(billDetail.bill.tenPttt) }}</span></p>
                <p class="mb-1"><strong>Ghi chú:</strong> {{ formatSafeText(billDetail.bill.ghiChu) }}</p>
              </div>
              <div class="col-md-6">
                <h6 class="fw-bold mb-3 border-bottom pb-2">Địa chỉ giao hàng</h6>
                <p class="mb-1 shipping-address">{{ formatShippingAddress(billDetail.bill) }}</p>
              </div>
            </div>

            <h6 class="fw-bold mb-3 border-bottom pb-2">Danh sách sản phẩm</h6>
            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle">
                <thead class="bg-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th class="text-center">Số lượng</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in billDetail.items" :key="item.id">
                    <td>
                      <div class="fw-bold">{{ item.tenSanPham }}</div>
                      <div class="text-muted x-small">Phân loại: {{ item.mauSac }}, {{ item.kichThuoc }}, {{ item.chatLieu }}</div>
                    </td>
                    <td class="text-center">{{ item.soLuong }}</td>
                    <td class="text-end">{{ formatCurrency(item.donGia) }}</td>
                    <td class="text-end fw-bold">{{ formatCurrency(item.thanhTien) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">Tổng tiền hàng:</td>
                    <td class="text-end">{{ formatCurrency(billDetail.bill.tongTienHang) }}</td>
                  </tr>
                  <tr>
                    <td colspan="3">Giảm giá:</td>
                    <td class="text-end text-danger">-{{ formatCurrency(billDetail.bill.tienGiam) }}</td>
                  </tr>
                  <tr>
                    <td colspan="3">Phí vận chuyển:</td>
                    <td class="text-end">{{ formatCurrency(billDetail.bill.phiVanChuyen) }}</td>
                  </tr>
                  <tr>
                    <td colspan="3" class="fw-bold">Tổng thanh toán:</td>
                    <td class="text-end fw-bold text-danger fs-5">{{ formatCurrency(billDetail.bill.tongThanhToan) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button
              v-if="['DA_GIAO', 'YEU_CAU_TRA_HANG', 'HOAN_TRA_MOT_PHAN'].includes(billDetail.bill.trangThaiDon)"
              class="btn btn-outline-warning rounded-pill px-4 me-2"
              @click="openRefundModal"
            >
              <i class="fas fa-undo-alt me-2"></i>Khởi tạo Đổi Trả
            </button>
            <button class="btn btn-outline-primary rounded-pill px-4 me-auto" @click="openEditModal(billDetail.bill)">
              <i class="fas fa-edit me-2"></i>Đổi trạng thái
            </button>
            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

    <RefundRequestModal
      :show="showRefundModal"
      :order="billDetail?.bill"
      :items="billDetail?.items"
      mode="admin"
      @close="showRefundModal = false"
      @success="() => { fetchBills(); if (billDetail?.bill?.id) fetchBillDetail(billDetail.bill.id); }"
    />
  </div>

  <!-- Modal Đổi Trả cho Admin -->
  <RefundRequestModal
    :show="showRefundModal"
    :order="billDetail?.bill"
    :items="billDetail?.items"
    mode="admin"
    @close="showRefundModal = false"
    @success="() => { fetchBills(); if(billDetail?.bill?.id) fetchBillDetail(billDetail.bill.id); }"
  />
</template>

<style scoped>
.bill-mgmt,
.modal-content {
  font-family: 'Montserrat', 'Inter', 'Segoe UI', 'Noto Sans', Arial, sans-serif;
}

/* Gradients for summary cards */
.bg-gradient-all {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}
.bg-gradient-online {
  background: linear-gradient(135deg, #0dcaf0 0%, #0099ff 100%);
}
.bg-gradient-pos {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
}

.stat-card {
  transition: all 0.3s ease;
  opacity: 0.8;
  border: 2px solid transparent !important;
}

.stat-card:hover {
  transform: translateY(-5px);
  opacity: 1;
}

.stat-card.active {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
}

/* Type Badges */
.bg-online-soft { background-color: rgba(13, 202, 240, 0.1); }
.text-online { color: #0099ff; }
.bg-pos-soft { background-color: rgba(255, 193, 7, 0.1); }
.text-pos { color: #ff9800; }

.type-badge {
  min-width: 100px;
  justify-content: center;
}

/* Table styling */
.custom-table thead th {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
}

.border-bottom-light {
  border-bottom: 1px solid #f8f9fa;
}

/* Action buttons */
.btn-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background-color: #f8f9fa;
  border: none;
}

.btn-view { color: #0dcaf0; }
.btn-view:hover { background-color: #0dcaf0; color: white; }
.btn-edit { color: #0d6efd; }
.btn-edit:hover { background-color: #0d6efd; color: white; }

.status-option {
  transition: all 0.2s ease-in-out;
  border-style: solid;
}

.status-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-option.bg-primary-subtle {
  background-color: #e7f1ff !important;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transition: all 0.2s;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.3s ease-in-out;
}

.order-progress-wrapper {
  background: linear-gradient(to bottom, #ffffff, #fcfcfc);
}

.step-icon {
  z-index: 3;
  border-style: solid !important;
}

.x-small {
  font-size: 0.75rem;
}

.x-small {
  font-size: 0.75rem;
}

.timeline-v2 {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
  position: relative;
}

.timeline-v2::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 20px;
  width: 2px;
  background: #e9ecef;
}

.timeline-item {
  position: relative;
  padding-left: 50px;
  margin-bottom: 25px;
}

.timeline-marker {
  position: absolute;
  left: 6px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  z-index: 2;
  box-shadow: 0 0 0 5px #fff;
  transition: all 0.2s;
}

.timeline-item:hover .timeline-marker {
  transform: scale(1.15);
}

.timeline-content {
  background: #fff;
  border-radius: 8px;
  padding: 5px 0;
}

.timeline-desc {
  background: #f8f9fa !important;
  transition: all 0.2s;
}

.timeline-item:hover .timeline-desc {
  background: #fff !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.border-info { border-color: #0dcaf0 !important; }
.border-primary { border-color: #0d6efd !important; }
.border-warning { border-color: #ffc107 !important; }
.border-success { border-color: #198754 !important; }
.border-danger { border-color: #dc3545 !important; }

.shipping-address {
  line-height: 1.7;
  word-break: break-word;
}

.table thead th {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 15px 10px;
}

.table tbody td {
  padding: 15px 10px;
}

.bg-soft-info { background-color: rgba(13, 202, 240, 0.15) !important; }
.bg-soft-primary { background-color: rgba(13, 110, 253, 0.15) !important; }
.bg-soft-warning { background-color: rgba(255, 193, 7, 0.15) !important; }
.bg-soft-success { background-color: rgba(25, 135, 84, 0.15) !important; }
.bg-soft-danger { background-color: rgba(220, 53, 69, 0.15) !important; }
.bg-soft-secondary { background-color: rgba(108, 117, 125, 0.15) !important; }

.transition-all { transition: all 0.25s ease-in-out; }
.hover-bg-light-subtle:hover { background-color: rgba(0, 0, 0, 0.02); }
.hover-bg-light:hover { background-color: #f1f3f5 !important; }

.btn-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s;
}

.btn-icon:hover {
  transform: translateY(-2px);
}

.status-tabs-wrapper::-webkit-scrollbar {
  height: 4px;
}

.status-tabs-wrapper::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 10px;
}
</style>
