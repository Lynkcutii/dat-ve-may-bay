<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const props = defineProps({
  show: Boolean,
  order: Object,       // hóa đơn
  items: Array,        // danh sách hoa_don_chi_tiet
  mode: { type: String, default: 'user' } // 'user' hoặc 'admin'
});

const emit = defineEmits(['close', 'success']);

const lyDo = ref('');
const loaiDoiTra = ref('REFUND'); 
const selectedFiles = ref([]);
const selectedItems = ref([]);
const allProducts = ref([]);
const submitting = ref(false);
const errorMsg = ref('');

// Fetch danh sách sản phẩm (bao gồm biến thể)
const fetchProducts = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/admin/products`);
    if (!res.data || !Array.isArray(res.data)) {
      console.warn("API trả về không đúng định dạng mảng");
      return;
    }
    
    let flattened = [];
    res.data.forEach(p => {
      const variants = p.details || p.variants || []; 
      variants.forEach(v => {
        flattened.push({
          ...v,
          productName: p.tenSanPham,
          productId: p.id,
          display: `${p.tenSanPham} [${v.mauSac?.ten || ''} - ${v.kichThuoc?.ten || ''}]`
        });
      });
    });
    allProducts.value = flattened;
  } catch (error) {
    console.error("Lỗi fetch products:", error);
    errorMsg.value = "Không thể tải danh sách sản phẩm để đổi. Vui lòng kiểm tra kết nối API.";
  }
};

onMounted(fetchProducts);

// Reset form
watch(() => props.show, (val) => {
  if (val) {
    lyDo.value = '';
    loaiDoiTra.value = props.order?.loaiDonHang === 'OFFLINE' ? 'EXCHANGE' : 'REFUND';
    selectedFiles.value = [];
    selectedItems.value = [];
    errorMsg.value = '';
    // Gọi lại để đảm bảo dữ liệu mới nhất
    fetchProducts();

    if (props.items?.length) {
      selectedItems.value = props.items.map(item => ({
        id: item.id,
        tenSanPham: item.tenSanPham,
        mauSac: item.mauSac,
        kichThuoc: item.kichThuoc,
        chatLieu: item.chatLieu,
        donGia: item.donGia,
        soLuong: item.soLuong,
        soLuongTra: 0,
        checked: false,
        spctMoi: null,
        searchQuery: '', 
        showDropdown: false
      }));
    }
  }
});

// Lọc kết quả tìm kiếm cho từng item
const getFilteredVariants = (item) => {
  const s = item.searchQuery.toLowerCase();
  if (!s && props.order?.loaiDonHang !== 'OFFLINE') return [];

  // Nếu Offline: Chỉ hiện các biến thể của chính sản phẩm đó
  if (props.order?.loaiDonHang === 'OFFLINE') {
    const originalProductId = props.items.find(i => i.id === item.id)?.sanPhamChiTiet?.sanPham?.id;
    return allProducts.value.filter(v => v.productId === originalProductId && v.display.toLowerCase().includes(s));
  }

  return allProducts.value.filter(v => v.display.toLowerCase().includes(s) || v.ma?.toLowerCase().includes(s)).slice(0, 10);
};

// Chọn sản phẩm mới
const selectVariant = (item, variant) => {
  item.spctMoi = {
    id: variant.id,
    tenSanPham: variant.productName,
    mauSac: variant.mauSac?.ten,
    kichThuoc: variant.kichThuoc?.ten,
    giaBan: variant.giaBan,
    ma: variant.ma
  };
  item.searchQuery = variant.display;
  item.showDropdown = false;
};

// Tính tổng tiền hoàn (sau voucher)
const tongTienHoanValue = computed(() => {
  const tongTienHang = Number(props.order?.tongTienHang || 1);
  const tienGiam = Number(props.order?.tienGiam || 0);

  const total = selectedItems.value
    .filter(i => i.checked && Number(i.soLuongTra) > 0)
    .reduce((sum, i) => {
      const giaTriGoc = Number(i.donGia) * Number(i.soLuongTra);
      const tienGiamPhanBo = Math.ceil((giaTriGoc * tienGiam) / tongTienHang);
      const thucTe = giaTriGoc - tienGiamPhanBo;
      console.log(`Item ${i.tenSanPham}: Hoàn ${thucTe} (Gốc: ${giaTriGoc}, Khấu trừ KM: ${tienGiamPhanBo})`);
      return sum + thucTe;
    }, 0);
  console.log("==> TỔNG TIỀN HOÀN CŨ:", total);
  return total;
});

const tongGiaTriDoiMoi = computed(() => {
  if (loaiDoiTra.value !== 'EXCHANGE') return 0;
  const total = selectedItems.value
    .filter(i => i.checked && i.spctMoi && Number(i.soLuongTra) > 0)
    .reduce((sum, i) => {
      const giaTriMoi = Number(i.spctMoi.giaBan) * Number(i.soLuongTra);
      console.log(`Item Đổi ${i.spctMoi.tenSanPham}: Giá mới ${giaTriMoi}`);
      return sum + giaTriMoi;
    }, 0);
  console.log("==> TỔNG GIÁ TRỊ HÀNG MỚI:", total);
  return total;
});

// Watch để tự động set SL = 1 khi tích chọn
watch(selectedItems, (newItems) => {
  newItems.forEach(item => {
    if (item.checked && (item.soLuongTra === 0 || !item.soLuongTra)) {
      item.soLuongTra = 1;
    }
  });
}, { deep: true });

const tienChenhLech = computed(() => {
  if (loaiDoiTra.value !== 'EXCHANGE') return 0;
  const diff = tongGiaTriDoiMoi.value - tongTienHoanValue.value;
  console.log("==> CHÊNH LỆCH (Mới - Cũ):", diff);
  return diff;
});

const onFileChange = (e) => {
  selectedFiles.value = Array.from(e.target.files);
};

const canSubmit = computed(() => {
  const selected = selectedItems.value.filter(i => i.checked && i.soLuongTra > 0);
  const exchangeValid = loaiDoiTra.value === 'REFUND' || selected.every(i => i.spctMoi != null);
  return selected.length > 0 && selectedFiles.value.length > 0 && lyDo.value.trim() && exchangeValid && !submitting.value;
});

const formatPrice = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(v));

const submitRequest = async () => {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const formData = new FormData();
    const dataPayload = {
      hoaDonId: props.order.id,
      lyDo: lyDo.value.trim(),
      loaiDoiTra: loaiDoiTra.value,
      chiTiets: selectedItems.value.filter(i => i.checked).map(i => ({
        hoaDonChiTietId: i.id,
        soLuongTra: i.soLuongTra,
        idSpctMoi: i.spctMoi?.id
      }))
    };
    formData.append('data', new Blob([JSON.stringify(dataPayload)], { type: 'application/json' }));
    selectedFiles.value.forEach(f => formData.append('files', f));

    const url = props.mode === 'admin' ? `${API_BASE_URL}/api/admin/doi-tra/request-by-admin` : `${API_BASE_URL}/api/user/doi-tra/request`;
    await axios.post(url, formData);
    alert('Thành công!');
    emit('success'); emit('close');
  } catch (error) {
    errorMsg.value = error.response?.data?.error || 'Lỗi hệ thống';
  } finally { submitting.value = false; }
};
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show" @click="$emit('close')"></div>
  
  <div class="modal fade" :class="{ show: show, 'd-block': show }" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable shadow-lg">
      <div class="modal-content border-0">
        <div class="modal-header border-0 bg-danger text-white">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-undo-alt me-2"></i> {{ mode === 'admin' ? 'Khởi Tạo Đổi Trả (Admin)' : 'Yêu Cầu Hoàn Trả' }}
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-4">
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <div class="card bg-light border-0">
                <div class="card-body py-2">
                  <span class="x-small text-muted d-block">Mã đơn hàng</span>
                  <span class="fw-bold text-danger">{{ order?.maHoaDon }}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex h-100 gap-2">
                <div class="flex-grow-1 border rounded d-flex align-items-center justify-content-center p-2 cursor-pointer"
                  :class="loaiDoiTra === 'REFUND' ? 'border-danger bg-danger text-white fw-bold' : 'bg-white'"
                  @click="order?.loaiDonHang !== 'OFFLINE' && (loaiDoiTra = 'REFUND')"
                  :style="{ opacity: order?.loaiDonHang === 'OFFLINE' ? 0.5 : 1 }"> Hoàn tiền </div>
                <div class="flex-grow-1 border rounded d-flex align-items-center justify-content-center p-2 cursor-pointer"
                  :class="loaiDoiTra === 'EXCHANGE' ? 'border-primary bg-primary text-white fw-bold' : 'bg-white'"
                  @click="loaiDoiTra = 'EXCHANGE'"> Đổi hàng </div>
              </div>
            </div>
          </div>

          <div class="product-list mb-4">
            <div v-for="item in selectedItems" :key="item.id" class="product-item border rounded-3 p-3 mb-3 shadow-sm" :class="{ 'border-danger': item.checked }">
              <div class="d-flex align-items-start gap-3">
                <input class="form-check-input mt-1" type="checkbox" v-model="item.checked">
                <div class="flex-grow-1">
                  <div class="fw-bold text-dark small">{{ item.tenSanPham }}</div>
                  <div class="text-muted x-small">{{ item.mauSac }} | {{ item.kichThuoc }}</div>
                  <div class="x-small mt-1 text-danger fw-bold">{{ formatPrice(item.donGia) }}</div>
                </div>
                <div v-if="item.checked" class="text-center" style="width: 80px;">
                  <input type="number" 
                    class="form-control form-control-sm text-center" 
                    v-model.number="item.soLuongTra" 
                    :min="1" 
                    :max="item.soLuong"
                    @input="handleQuantityInput(item)"
                  >
                </div>
              </div>

              <!-- INLINE EXCHANGE SELECTION -->
              <div v-if="item.checked && loaiDoiTra === 'EXCHANGE'" class="mt-3 p-3 bg-light rounded border-top position-relative">
                <label class="x-small fw-bold text-primary mb-1">Đổi sang sản phẩm:</label>
                <div class="input-group input-group-sm mb-1">
                  <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                  <input type="text" class="form-control border-start-0" 
                    v-model="item.searchQuery" 
                    placeholder="Tìm tên hoặc mã SP mới..." 
                    @focus="item.showDropdown = true"
                  >
                </div>
                
                <!-- Dropdown kết quả -->
                <div v-if="item.showDropdown" class="list-group position-absolute w-100 shadow-lg" style="z-index: 100; max-height: 200px; overflow-y: auto; left: 0;">
                  <button v-for="v in getFilteredVariants(item)" :key="v.id" 
                    class="list-group-item list-group-item-action py-2"
                    @click="selectVariant(item, v)">
                    <div class="d-flex justify-content-between">
                      <span class="small">{{ v.display }}</span>
                      <span class="small fw-bold text-danger">{{ formatPrice(v.giaBan) }}</span>
                    </div>
                    <div class="x-small text-muted">Kho: {{ v.soLuong }} | Mã: {{ v.ma }}</div>
                  </button>
                  <div v-if="getFilteredVariants(item).length === 0" class="list-group-item x-small text-muted">Không tìm thấy sản phẩm phù hợp</div>
                </div>

                <div v-if="item.spctMoi" class="mt-2 p-2 border rounded bg-white d-flex justify-content-between align-items-center">
                  <div>
                    <span class="badge bg-primary me-2">Đã chọn</span>
                    <span class="small fw-bold">{{ item.spctMoi.tenSanPham }}</span>
                    <div class="x-small text-muted">{{ item.spctMoi.mauSac }} / {{ item.spctMoi.kichThuoc }}</div>
                  </div>
                  <div class="text-danger fw-bold small">{{ formatPrice(item.spctMoi.giaBan) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 bg-light mb-4" v-if="tongTienHoanValue > 0">
            <div class="card-body py-3">
              <div class="d-flex justify-content-between x-small mb-1">
                <span>Giá trị hàng hoàn (sau voucher):</span>
                <span class="fw-bold">{{ formatPrice(tongTienHoanValue) }}</span>
              </div>
              <div v-if="loaiDoiTra === 'EXCHANGE'" class="d-flex justify-content-between x-small mb-1">
                <span>Giá trị hàng mới:</span>
                <span class="fw-bold text-primary">{{ formatPrice(tongGiaTriDoiMoi) }}</span>
              </div>
              <hr class="my-2">
              <div class="d-flex justify-content-between align-items-center">
                <span class="fw-bold small">{{ loaiDoiTra === 'REFUND' ? 'Tổng tiền hoàn trả:' : (tienChenhLech >= 0 ? 'Khách bù thêm:' : 'Shop hoàn lại:') }}</span>
                <span class="fs-5 fw-bold" :class="loaiDoiTra === 'REFUND' || tienChenhLech < 0 ? 'text-success' : 'text-danger'">
                  {{ loaiDoiTra === 'REFUND' ? formatPrice(tongTienHoanValue) : formatPrice(tienChenhLech) }}
                </span>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold small">Lý do & Ảnh minh chứng *</label>
            <textarea v-model="lyDo" class="form-control form-control-sm mb-2" rows="2" placeholder="Mô tả lý do..."></textarea>
            <input type="file" class="form-control form-control-sm" multiple @change="onFileChange">
          </div>
          <div v-if="errorMsg" class="alert alert-danger py-1 x-small">{{ errorMsg }}</div>
        </div>

        <div class="modal-footer border-0">
          <button type="button" class="btn btn-light rounded-pill px-4" @click="$emit('close')">Hủy</button>
          <button type="button" class="btn btn-danger rounded-pill px-4 fw-bold" :disabled="!canSubmit" @click="submitRequest">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span> Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.x-small { font-size: 0.75rem; }
.product-item { transition: all 0.2s; }
.modal.show { display: block !important; }
.cursor-pointer { cursor: pointer; }
</style>
