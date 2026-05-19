<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import returnApi from '@/api/returnApi';

const props = defineProps({
  show: { type: Boolean, default: false },
  doiTra: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['close', 'saved']);

const submitting = ref(false);
const formItems = ref([]);

watch(
  () => props.show,
  (val) => {
    if (!val) return;
    formItems.value = (props.doiTra?.chiTiets || []).map((ct) => ({
      idDtct: ct.id,
      khopSanPham: ct.khopSanPham ?? true,
      benChiuLoi: ct.benChiuLoi || 'SHOP',
      tinhTrangHangSauKiem: ct.tinhTrangHangSauKiem || 'NGUYEN_VEN',
      anhKiem: Array.isArray(ct.anhKiem) ? ct.anhKiem : parseJson(ct.anhKiem),
      ghiChuKiem: ct.ghiChuKiem || '',
      uploading: false
    }));
  },
  { immediate: true }
);

const allValid = computed(() =>
  formItems.value.length > 0 &&
  formItems.value.every((i) =>
    i.khopSanPham !== null &&
    !!i.benChiuLoi &&
    !!i.tinhTrangHangSauKiem
  )
);

function parseJson(v) {
  if (!v) return [];
  try {
    const data = JSON.parse(v);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function uploadFiles(item, e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  if ((item.anhKiem?.length || 0) + files.length > 5) {
    ElMessage.error('Tối đa 5 ảnh kiểm / item');
    e.target.value = '';
    return;
  }

  try {
    item.uploading = true;
    const { data } = await returnApi.uploadKiem(props.doiTra.id, files);
    item.anhKiem = [...(item.anhKiem || []), ...(Array.isArray(data) ? data : [])];
    ElMessage.success('Upload ảnh kiểm thành công');
  } catch (err) {
    ElMessage.error(err?.response?.data?.error || 'Upload ảnh kiểm thất bại');
  } finally {
    item.uploading = false;
    e.target.value = '';
  }
}

function removeImage(item, idx) {
  item.anhKiem.splice(idx, 1);
}

async function save() {
  if (!allValid.value) {
    ElMessage.error('Vui lòng kiểm đủ thông tin tất cả item');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      chiTiet: formItems.value.map((i) => ({
        idDtct: i.idDtct,
        khopSanPham: i.khopSanPham,
        benChiuLoi: i.benChiuLoi,
        tinhTrangHangSauKiem: i.tinhTrangHangSauKiem,
        anhKiem: i.anhKiem || [],
        ghiChuKiem: i.ghiChuKiem || ''
      }))
    };

    await returnApi.kiem(props.doiTra.id, payload);
    ElMessage.success('Đã lưu kiểm hàng');
    emit('saved');
  } catch (err) {
    ElMessage.error(err?.response?.data?.error || 'Lưu kiểm hàng thất bại');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show" @click="emit('close')"></div>
  <div class="modal fade" :class="{ show, 'd-block': show }" tabindex="-1" style="z-index:1060;">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content border-0 shadow-lg">
        <div class="modal-header">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-search me-2"></i>Kiểm hàng nội bộ - {{ doiTra?.maDoiTra }}
          </h5>
          <button class="btn-close" @click="emit('close')"></button>
        </div>

        <div class="modal-body">
          <div v-for="(item, idx) in formItems" :key="item.idDtct" class="border rounded-3 p-3 mb-3">
            <div class="fw-bold mb-1">#{{ idx + 1 }} {{ doiTra?.chiTiets?.[idx]?.hoaDonChiTiet?.tenSanPham }}</div>
            <div class="small text-muted mb-3">
              SKU: {{ doiTra?.chiTiets?.[idx]?.hoaDonChiTiet?.sanPhamChiTiet?.ma || 'N/A' }} |
              Màu: {{ doiTra?.chiTiets?.[idx]?.hoaDonChiTiet?.mauSac || 'N/A' }} |
              Size: {{ doiTra?.chiTiets?.[idx]?.hoaDonChiTiet?.kichThuoc || 'N/A' }}
            </div>

            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label fw-bold small">Đúng SKU shop đã gửi</label>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="item.khopSanPham" :id="`khop-${item.idDtct}`" />
                  <label class="form-check-label" :for="`khop-${item.idDtct}`">Hàng đúng SKU</label>
                </div>
              </div>

              <div class="col-md-3">
                <label class="form-label fw-bold small">Bên chịu lỗi</label>
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" :name="`loi-${item.idDtct}`" value="SHOP" v-model="item.benChiuLoi" />
                    <label class="form-check-label">SHOP</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" :name="`loi-${item.idDtct}`" value="KHACH" v-model="item.benChiuLoi" />
                    <label class="form-check-label">KHACH</label>
                  </div>
                </div>
              </div>

              <div class="col-md-3">
                <label class="form-label fw-bold small">Tình trạng hàng</label>
                <div class="d-flex flex-column gap-1">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" :name="`tt-${item.idDtct}`" value="NGUYEN_VEN" v-model="item.tinhTrangHangSauKiem" />
                    <label class="form-check-label">NGUYEN_VEN</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" :name="`tt-${item.idDtct}`" value="LOI" v-model="item.tinhTrangHangSauKiem" />
                    <label class="form-check-label">LOI</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" :name="`tt-${item.idDtct}`" value="DA_SU_DUNG" v-model="item.tinhTrangHangSauKiem" />
                    <label class="form-check-label">DA_SU_DUNG</label>
                  </div>
                </div>
              </div>

              <div class="col-md-3">
                <label class="form-label fw-bold small">Ảnh kiểm (max 5)</label>
                <input class="form-control form-control-sm" type="file" multiple @change="uploadFiles(item, $event)" />
                <div class="x-small text-muted mt-1" v-if="item.uploading">Đang upload...</div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-2 mt-2" v-if="item.anhKiem?.length">
              <div v-for="(url, i) in item.anhKiem" :key="url + i" class="position-relative">
                <img :src="url" style="width:72px;height:72px;object-fit:cover" class="rounded border" />
                <button class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 px-1" @click="removeImage(item, i)">x</button>
              </div>
            </div>

            <div class="mt-3">
              <label class="form-label fw-bold small">Ghi chú kiểm</label>
              <textarea class="form-control" rows="2" v-model="item.ghiChuKiem"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-light rounded-pill px-4" @click="emit('close')">Đóng</button>
          <button class="btn btn-primary rounded-pill px-4" :disabled="submitting || !allValid" @click="save">
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            Lưu kiểm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.x-small { font-size: 0.75rem; }
.modal.show { display: block !important; }
</style>
