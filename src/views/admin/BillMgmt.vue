<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import DateFilter from '@/components/DateFilter.vue';

const bills = ref([]);
const loading = ref(true);
const apiBaseUrl = 'http://localhost:8080/api/admin';

const filterData = ref({ day: '', month: '', year: '' });
const filterLoaiDon = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const filteredBills = computed(() => {
  return bills.value.filter(bill => {
    // Lọc theo ngày tháng năm
    if (bill.ngayTao) {
      const date = new Date(bill.ngayTao);
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const y = date.getFullYear();

      if (filterData.value.day && d !== parseInt(filterData.value.day)) return false;
      if (filterData.value.month && m !== parseInt(filterData.value.month)) return false;
      if (filterData.value.year && y !== parseInt(filterData.value.year)) return false;
    }

    // Lọc theo loại đơn
    if (filterLoaiDon.value && bill.loaiDonHang !== filterLoaiDon.value) return false;

    return true;
  }).sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
});

const totalPages = computed(() => Math.ceil(filteredBills.value.length / itemsPerPage.value));

const paginatedBills = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredBills.value.slice(start, start + itemsPerPage.value);
});

const handleFilter = (data) => {
  filterData.value = data;
  currentPage.value = 1;
};

const fetchBills = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${apiBaseUrl}/bills`);
    bills.value = res.data;
  } catch (error) {
    console.error("Error fetching bills:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBills();
});

const getStatusBadge = (status) => {
  switch (status) {
    case 'DA_THANH_TOAN': return 'bg-success';
    case 'CHO_THANH_TOAN': return 'bg-warning text-dark';
    case 'DA_HUY': return 'bg-danger';
    case 'CHO_XAC_NHAN': return 'bg-info text-white';
    case 'DANG_GIAO': return 'bg-primary';
    case 'HOAN_THANH': return 'bg-success';
    default: return 'bg-secondary';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'DA_THANH_TOAN': return 'Đã thanh toán';
    case 'CHO_THANH_TOAN': return 'Chờ thanh toán';
    case 'DA_HUY': return 'Đã hủy';
    case 'CHO_XAC_NHAN': return 'Chờ xác nhận';
    case 'DANG_GIAO': return 'Đang giao';
    case 'HOAN_THANH': return 'Hoàn thành';
    default: return status;
  }
};

const selectedBill = ref(null);
const billDetail = ref(null);
const newStatus = ref('');

const openEditModal = (bill) => {
  selectedBill.value = bill;
  newStatus.value = bill.trangThaiDon;
  const modal = new bootstrap.Modal(document.getElementById('editStatusModal'));
  modal.show();
};

const updateStatus = async () => {
  try {
    await axios.put(`${apiBaseUrl}/bills/${selectedBill.value.id}/status`, newStatus.value, {
      headers: { 'Content-Type': 'text/plain' }
    });
    alert("Cập nhật trạng thái thành công!");
    fetchBills();
    if (billDetail.value) {
      fetchBillDetail(selectedBill.value.id);
    }
    const modal = bootstrap.Modal.getInstance(document.getElementById('editStatusModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Cập nhật thất bại!");
  }
};

const fetchBillDetail = async (id) => {
  try {
    const res = await axios.get(`${apiBaseUrl}/bills/${id}`);
    billDetail.value = res.data;
  } catch (error) {
    console.error("Error fetching bill detail:", error);
  }
};

const viewDetail = async (bill) => {
  selectedBill.value = bill;
  await fetchBillDetail(bill.id);
  const modal = new bootstrap.Modal(document.getElementById('billDetailModal'));
  modal.show();
};
</script>

<template>
  <div class="bill-mgmt">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold">Quản Lý Hóa Đơn</h4>
    </div>

    <div class="d-flex justify-content-between align-items-end gap-3 mb-4 flex-wrap">
      <DateFilter @filter="handleFilter" class="mb-0" />
      
      <div class="filter-item">
        <label class="form-label small fw-bold text-muted">Loại Đơn Hàng</label>
        <select v-model="filterLoaiDon" class="form-select border-0 shadow-sm rounded-3" @change="currentPage = 1">
          <option value="">Tất cả loại đơn</option>
          <option value="ONLINE">Online</option>
          <option value="TAI_QUAY">Tại quầy</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="card border-0 shadow-sm rounded-3">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">Mã HĐ</th>
                <th>Khách Hàng</th>
                <th>Loại Đơn</th>
                <th>Ngày Lập</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th class="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bill in paginatedBills" :key="bill.id">
                <td class="ps-4 fw-bold text-danger">{{ bill.maHoaDon }}</td>
                <td>{{ bill.nguoiDung?.hoTen || bill.tenNguoiNhan }}</td>
                <td>
                  <span :class="['badge rounded-pill px-2', bill.loaiDonHang === 'ONLINE' ? 'bg-info' : 'bg-warning text-dark']">
                    {{ bill.loaiDonHang === 'ONLINE' ? 'Online' : 'Tại quầy' }}
                  </span>
                </td>
                <td>{{ new Date(bill.ngayTao).toLocaleString('vi-VN') }}</td>
                <td>{{ bill.tongThanhToan?.toLocaleString() }} VNĐ</td>
                <td><span :class="['badge rounded-pill px-3', getStatusBadge(bill.trangThaiDon)]">{{ getStatusText(bill.trangThaiDon) }}</span></td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-outline-dark me-2" @click="viewDetail(bill)"><i class="fas fa-eye"></i></button>
                  <button class="btn btn-sm btn-outline-primary" @click="openEditModal(bill)"><i class="fas fa-edit"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Phân trang -->
    <nav class="mt-4" v-if="totalPages > 1">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage--"><i class="fas fa-chevron-left"></i></a>
        </li>
        <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: currentPage === page }">
          <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage = page">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link border-0 shadow-none" href="#" @click.prevent="currentPage++"><i class="fas fa-chevron-right"></i></a>
        </li>
      </ul>
    </nav>

    <!-- Edit Status Modal -->
    <div class="modal fade" id="editStatusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Cập nhật trạng thái</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedBill">
              <p class="mb-1 text-muted small">Mã hóa đơn</p>
              <p class="fw-bold text-danger mb-3">{{ selectedBill.maHoaDon }}</p>
              <div class="mb-3">
                <label class="form-label small text-muted">Trạng thái mới</label>
                <select v-model="newStatus" class="form-select border-0 bg-light">
                  <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
                  <option value="DA_XAC_NHAN">Đã xác nhận</option>
                  <option value="DANG_GIAO">Đang giao</option>
                  <option value="DA_GIAO">Đã giao</option>
                  <option value="HOAN_TRA">Hoàn trả</option>
                  <option value="DA_HUY">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Đóng</button>
            <button type="button" class="btn btn-primary rounded-pill px-4" @click="updateStatus">Cập nhật</button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Detail Modal -->
    <div class="modal fade" id="billDetailModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="billDetail">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">Chi tiết hóa đơn: <span class="text-danger">{{ billDetail.bill.maHoaDon }}</span></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-0">
            <!-- Order Status Timeline -->
            <div class="mb-4">
              <h6 class="fw-bold mb-3 border-bottom pb-2">Lịch sử đơn hàng</h6>
              <div class="timeline small">
                <div v-for="history in billDetail.history" :key="history.id" class="d-flex mb-2">
                  <div class="text-muted me-3" style="min-width: 140px;">
                    {{ new Date(history.ngayCapNhat).toLocaleString('vi-VN') }}
                  </div>
                  <div class="fw-bold">
                    <span :class="['badge rounded-pill px-2', getStatusBadge(history.trangThai)]">
                      {{ getStatusText(history.trangThai) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer & Shipping Info -->
            <div class="row mb-4">
              <div class="col-md-6">
                <h6 class="fw-bold mb-3 border-bottom pb-2">Thông tin khách hàng</h6>
                <p class="mb-1"><strong>Họ tên:</strong> {{ billDetail.bill.tenNguoiNhan }}</p>
                <p class="mb-1"><strong>Số điện thoại:</strong> {{ billDetail.bill.soDienThoai }}</p>
                <p class="mb-1"><strong>Ghi chú:</strong> {{ billDetail.bill.ghiChu || 'Không có' }}</p>
              </div>
              <div class="col-md-6">
                <h6 class="fw-bold mb-3 border-bottom pb-2">Địa chỉ giao hàng</h6>
                <p class="mb-1">{{ billDetail.bill.diaChiChiTiet }}</p>
                <p class="mb-1">{{ billDetail.bill.xa }}, {{ billDetail.bill.huyen }}, {{ billDetail.bill.tinh }}</p>
              </div>
            </div>

            <!-- Product Items -->
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
                    <td class="text-end">{{ item.donGia.toLocaleString() }} đ</td>
                    <td class="text-end fw-bold">{{ item.thanhTien.toLocaleString() }} đ</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">Tổng tiền hàng:</td>
                    <td class="text-end">{{ billDetail.bill.tongTienHang.toLocaleString() }} đ</td>
                  </tr>
                  <tr>
                    <td colspan="3">Giảm giá:</td>
                    <td class="text-end text-danger">-{{ billDetail.bill.tienGiam.toLocaleString() }} đ</td>
                  </tr>
                  <tr>
                    <td colspan="3">Phí vận chuyển:</td>
                    <td class="text-end">{{ billDetail.bill.phi_van_chuyen?.toLocaleString() || 0 }} đ</td>
                  </tr>
                  <tr>
                    <td colspan="3" class="fw-bold">Tổng thanh toán:</td>
                    <td class="text-end fw-bold text-danger fs-5">{{ billDetail.bill.tongThanhToan.toLocaleString() }} đ</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button class="btn btn-outline-primary rounded-pill px-4 me-auto" @click="openEditModal(billDetail.bill)">
              <i class="fas fa-edit me-2"></i>Đổi trạng thái
            </button>
            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.x-small {
  font-size: 0.75rem;
}
.timeline {
  max-height: 150px;
  overflow-y: auto;
  padding-left: 5px;
}
</style>

<style scoped>
.table thead th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 15px 10px;
}
.table tbody td {
  padding: 15px 10px;
}
</style>
