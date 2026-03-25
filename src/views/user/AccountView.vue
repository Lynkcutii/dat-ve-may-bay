<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const apiBaseUrl = 'http://localhost:8080/api/user';

const activeTab = ref('info');
const loadingAddresses = ref(false);
const showAddressModal = ref(false);
const savingAddress = ref(false);
const addresses = ref([]);
const tinhs = ref([]);
const huyens = ref([]);
const xas = ref([]);
const regionPanelOpen = ref(false);
const regionTab = ref('tinh');
const regionKeyword = ref('');

const userForm = ref({
  hoTen: authStore.currentUser?.hoTen || '',
  soDienThoai: authStore.currentUser?.soDienThoai || '',
  email: authStore.currentUser?.email || ''
});

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const createDefaultAddressForm = () => ({
  id: null,
  tenNguoiNhan: authStore.currentUser?.hoTen || '',
  soDienThoai: authStore.currentUser?.soDienThoai || '',
  diaChiChiTiet: '',
  tinhId: '',
  huyenId: '',
  xaId: '',
  tinhText: '',
  huyenText: '',
  xaText: '',
  loaiDiaChi: 'Nhà riêng',
  laMacDinh: addresses.value.length === 0
});

const addressForm = ref(createDefaultAddressForm());

const user = authStore.currentUser || {
  hoTen: '',
  email: '',
  soDienThoai: ''
};

const normalizeText = (value) => (value || '').trim().toLowerCase();

const formatFullAddress = (addr) => {
  return [addr.address, addr.xa, addr.huyen, addr.tinh].filter(Boolean).join(', ');
};

const regionSummary = computed(() => {
  return [addressForm.value.tinhText, addressForm.value.huyenText, addressForm.value.xaText]
    .filter(Boolean)
    .join(', ');
});

const filteredTinhs = computed(() => {
  const keyword = normalizeText(regionKeyword.value);
  if (!keyword) return tinhs.value;
  return tinhs.value.filter(item => normalizeText(item.tenTinh).includes(keyword));
});

const filteredHuyens = computed(() => {
  const keyword = normalizeText(regionKeyword.value);
  if (!keyword) return huyens.value;
  return huyens.value.filter(item => normalizeText(item.tenHuyen).includes(keyword));
});

const filteredXas = computed(() => {
  const keyword = normalizeText(regionKeyword.value);
  if (!keyword) return xas.value;
  return xas.value.filter(item => normalizeText(item.tenXa).includes(keyword));
});

const resetAddressForm = () => {
  addressForm.value = createDefaultAddressForm();
  huyens.value = [];
  xas.value = [];
  regionPanelOpen.value = false;
  regionTab.value = 'tinh';
  regionKeyword.value = '';
};

const fetchTinh = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/regions/tinh`);
    tinhs.value = res.data || [];
  } catch (error) {
    console.error('Error fetching provinces:', error);
  }
};

const fetchHuyen = async (tinhId) => {
  if (!tinhId) {
    huyens.value = [];
    return;
  }

  try {
    const res = await axios.get(`${apiBaseUrl}/regions/huyen/${tinhId}`);
    huyens.value = res.data || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    huyens.value = [];
  }
};

const fetchXa = async (huyenId) => {
  if (!huyenId) {
    xas.value = [];
    return;
  }

  try {
    const res = await axios.get(`${apiBaseUrl}/regions/xa/${huyenId}`);
    xas.value = res.data || [];
  } catch (error) {
    console.error('Error fetching wards:', error);
    xas.value = [];
  }
};

const openRegionPanel = () => {
  regionPanelOpen.value = true;
  regionKeyword.value = '';
  if (!addressForm.value.tinhId) {
    regionTab.value = 'tinh';
    return;
  }
  if (!addressForm.value.huyenId) {
    regionTab.value = 'huyen';
    return;
  }
  if (!addressForm.value.xaId) {
    regionTab.value = 'xa';
    return;
  }
  regionTab.value = 'xa';
};

const toggleRegionPanel = () => {
  if (regionPanelOpen.value) {
    regionPanelOpen.value = false;
    return;
  }
  openRegionPanel();
};

const selectTinh = async (tinh) => {
  addressForm.value.tinhId = tinh.id;
  addressForm.value.tinhText = tinh.tenTinh;
  addressForm.value.huyenId = '';
  addressForm.value.huyenText = '';
  addressForm.value.xaId = '';
  addressForm.value.xaText = '';
  xas.value = [];
  regionKeyword.value = '';
  await fetchHuyen(tinh.id);
  regionTab.value = 'huyen';
};

const selectHuyen = async (huyen) => {
  addressForm.value.huyenId = huyen.id;
  addressForm.value.huyenText = huyen.tenHuyen;
  addressForm.value.xaId = '';
  addressForm.value.xaText = '';
  regionKeyword.value = '';
  await fetchXa(huyen.id);
  regionTab.value = 'xa';
};

const selectXa = (xa) => {
  addressForm.value.xaId = xa.id;
  addressForm.value.xaText = xa.tenXa;
  regionKeyword.value = '';
  regionPanelOpen.value = false;
};

const fetchAddresses = async () => {
  if (!authStore.currentUser?.id) return;

  try {
    loadingAddresses.value = true;
    const res = await axios.get(`${apiBaseUrl}/addresses/${authStore.currentUser.id}`);
    addresses.value = (res.data || []).map(item => ({
      id: item.id,
      name: item.tenNguoiNhan,
      phone: item.soDienThoai,
      address: item.diaChiChiTiet,
      type: item.loaiDiaChi,
      isDefault: item.laMacDinh,
      tinh: item.tinh,
      huyen: item.huyen,
      xa: item.xa,
      tinhId: item.tinhId,
      huyenId: item.huyenId,
      xaId: item.xaId
    }));
  } catch (error) {
    console.error('Error fetching addresses:', error);
  } finally {
    loadingAddresses.value = false;
  }
};

const openAddAddress = async () => {
  resetAddressForm();
  if (tinhs.value.length === 0) {
    await fetchTinh();
  }
  showAddressModal.value = true;
};

const openEditAddress = async (addr) => {
  if (tinhs.value.length === 0) {
    await fetchTinh();
  }

  addressForm.value = {
    id: addr.id,
    tenNguoiNhan: addr.name,
    soDienThoai: addr.phone,
    diaChiChiTiet: addr.address,
    tinhId: addr.tinhId || '',
    huyenId: addr.huyenId || '',
    xaId: addr.xaId || '',
    tinhText: addr.tinh || '',
    huyenText: addr.huyen || '',
    xaText: addr.xa || '',
    loaiDiaChi: addr.type || 'Nhà riêng',
    laMacDinh: !!addr.isDefault
  };

  await fetchHuyen(addressForm.value.tinhId);
  await fetchXa(addressForm.value.huyenId);
  regionPanelOpen.value = false;
  regionTab.value = addressForm.value.xaId ? 'xa' : addressForm.value.huyenId ? 'huyen' : 'tinh';
  regionKeyword.value = '';
  showAddressModal.value = true;
};

const saveAddress = async () => {
  if (
    !addressForm.value.tenNguoiNhan ||
    !addressForm.value.soDienThoai ||
    !addressForm.value.diaChiChiTiet ||
    !addressForm.value.tinhId ||
    !addressForm.value.huyenId ||
    !addressForm.value.xaId
  ) {
    alert('Vui lòng nhập đầy đủ thông tin địa chỉ!');
    return;
  }

  try {
    savingAddress.value = true;
    await axios.post(`${apiBaseUrl}/addresses/${authStore.currentUser.id}`, {
      ...addressForm.value,
      xaId: Number(addressForm.value.xaId)
    });
    showAddressModal.value = false;
    await fetchAddresses();
  } catch (error) {
    console.error('Error saving address:', error);
    alert('Không thể lưu địa chỉ. Vui lòng thử lại.');
  } finally {
    savingAddress.value = false;
  }
};

const deleteAddress = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

  try {
    await axios.delete(`${apiBaseUrl}/addresses/${authStore.currentUser.id}/${id}`);
    await fetchAddresses();
  } catch (error) {
    console.error('Error deleting address:', error);
    alert('Không thể xóa địa chỉ.');
  }
};

const setDefaultAddress = async (id) => {
  try {
    await axios.put(`${apiBaseUrl}/addresses/${authStore.currentUser.id}/${id}/default`);
    await fetchAddresses();
  } catch (error) {
    console.error('Error setting default address:', error);
    alert('Không thể đặt địa chỉ mặc định.');
  }
};

const handleUpdateProfile = async () => {
  try {
    await authStore.updateProfile(authStore.currentUser.id, {
      hoTen: userForm.value.hoTen,
      soDienThoai: userForm.value.soDienThoai
    });
    alert('Cập nhật thông tin thành công!');
  } catch (error) {
    alert(error);
  }
};

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('Mật khẩu xác nhận không khớp!');
    return;
  }

  try {
    await authStore.changePassword(authStore.currentUser.id, {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    });
    alert('Đổi mật khẩu thành công!');
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    alert(error);
  }
};

const handleLogout = () => {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    authStore.logout();
    router.push('/login');
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  await Promise.all([fetchTinh(), fetchAddresses()]);
});
</script>

<template>
  <div class="container py-5">
    <div class="row g-4">
      <div class="col-lg-3">
        <div class="bg-white rounded-4 shadow-sm p-4 h-100">
          <div class="text-center mb-4 pb-4 border-bottom">
            <div class="avatar-placeholder bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
              <i class="fas fa-user fs-2 text-secondary"></i>
            </div>
            <h6 class="fw-bold mb-1">{{ user.hoTen }}</h6>
            <p class="text-secondary small mb-0">{{ user.email }}</p>
          </div>

          <div class="nav flex-column nav-pills small">
            <button
              @click="activeTab = 'info'"
              :class="['nav-link border-0 text-start rounded-3 mb-2 px-3 py-2 fw-bold shadow-none', activeTab === 'info' ? 'active' : 'text-dark']"
            >
              <i class="far fa-user me-2"></i> Thông tin tài khoản
            </button>
            <router-link to="/order-history" class="nav-link text-dark text-start rounded-3 mb-2 px-3 py-2 fw-bold">
              <i class="fas fa-history me-2"></i> Lịch sử đơn hàng
            </router-link>
            <button
              @click="activeTab = 'address'"
              :class="['nav-link border-0 text-start rounded-3 mb-2 px-3 py-2 fw-bold shadow-none', activeTab === 'address' ? 'active' : 'text-dark']"
            >
              <i class="fas fa-map-marker-alt me-2"></i> Sổ địa chỉ
            </button>
            <hr>
            <button @click="handleLogout" class="nav-link text-danger text-start rounded-3 px-3 py-2 fw-bold">
              <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-9">
        <div class="bg-white rounded-4 shadow-sm p-5 h-100">
          <div v-if="activeTab === 'info'">
            <h4 class="fw-bold mb-4">Thông Tin Tài Khoản</h4>

            <form class="row g-4" @submit.prevent="handleUpdateProfile">
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary text-uppercase">Họ và tên</label>
                <input type="text" v-model="userForm.hoTen" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Họ và tên">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary text-uppercase">Số điện thoại</label>
                <input type="tel" v-model="userForm.soDienThoai" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Số điện thoại">
              </div>
              <div class="col-md-12">
                <label class="form-label small fw-bold text-secondary text-uppercase">Email</label>
                <input type="email" v-model="userForm.email" class="form-control border-0 bg-light rounded-3 px-3 py-2" disabled>
              </div>
              <div class="col-md-12 mt-5">
                <button type="submit" class="btn btn-dark rounded-pill px-5 py-2 fw-bold shadow-sm" :disabled="authStore.loading">
                  <span v-if="authStore.loading" class="spinner-border spinner-border-sm me-2"></span>
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>

            <div class="mt-5 pt-5 border-top">
              <h5 class="fw-bold mb-3">Đổi mật khẩu</h5>
              <form class="row g-3" @submit.prevent="handleChangePassword">
                <div class="col-md-3">
                  <input type="password" v-model="passwordForm.oldPassword" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Mật khẩu hiện tại" required>
                </div>
                <div class="col-md-3">
                  <input type="password" v-model="passwordForm.newPassword" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Mật khẩu mới" required>
                </div>
                <div class="col-md-3">
                  <input type="password" v-model="passwordForm.confirmPassword" class="form-control border-0 bg-light rounded-3 px-3 py-2" placeholder="Xác nhận mật khẩu mới" required>
                </div>
                <div class="col-md-3">
                  <button type="submit" class="btn btn-outline-dark w-100 rounded-pill py-2 fw-bold small" :disabled="authStore.loading">
                    CẬP NHẬT
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div v-if="activeTab === 'address'">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="fw-bold mb-0">Sổ Địa Chỉ</h4>
              <button class="btn btn-dark rounded-pill px-4 fw-bold small" @click="openAddAddress">
                <i class="fas fa-plus me-2"></i> THÊM ĐỊA CHỈ MỚI
              </button>
            </div>

            <div v-if="loadingAddresses" class="text-center py-5">
              <div class="spinner-border text-dark" role="status"></div>
            </div>

            <div v-else class="address-list">
              <div v-for="addr in addresses" :key="addr.id" class="address-item p-4 rounded-4 border mb-3 position-relative">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="d-flex align-items-center flex-wrap gap-2">
                    <span class="fw-bold">{{ addr.name }}</span>
                    <span v-if="addr.isDefault" class="badge bg-success-subtle text-success small fw-normal">Mặc định</span>
                    <span class="badge bg-light text-dark border small fw-normal">{{ addr.type }}</span>
                  </div>
                  <div class="address-actions d-flex gap-3">
                    <button class="btn btn-link text-primary p-0 text-decoration-none small fw-bold" @click="openEditAddress(addr)">Chỉnh sửa</button>
                    <button @click="deleteAddress(addr.id)" class="btn btn-link text-danger p-0 text-decoration-none small fw-bold" :disabled="addr.isDefault">Xóa</button>
                  </div>
                </div>

                <p class="text-secondary small mb-1"><i class="fas fa-phone-alt me-2"></i> {{ addr.phone }}</p>
                <p class="text-secondary small mb-3"><i class="fas fa-map-marker-alt me-2"></i> {{ formatFullAddress(addr) }}</p>

                <button
                  v-if="!addr.isDefault"
                  @click="setDefaultAddress(addr.id)"
                  class="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold"
                >
                  Thiết lập mặc định
                </button>
              </div>

              <div v-if="addresses.length === 0" class="text-center py-5">
                <i class="fas fa-map-marked-alt fa-3x text-light mb-3"></i>
                <p class="text-muted">Bạn chưa có địa chỉ nào trong sổ địa chỉ.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddressModal" class="modal-backdrop fade show"></div>
    <div v-if="showAddressModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">{{ addressForm.id ? 'Chỉnh sửa địa chỉ' : 'Địa chỉ mới' }}</h5>
            <button type="button" class="btn-close shadow-none" @click="showAddressModal = false"></button>
          </div>

          <div class="modal-body">
            <p class="text-secondary mb-4">Dùng thông tin trước sắp nhập</p>

            <div class="row g-3 mb-3">
              <div class="col-6">
                <input v-model="addressForm.tenNguoiNhan" type="text" class="form-control bg-light border rounded-3 py-2" placeholder="Họ và tên">
              </div>
              <div class="col-6">
                <input v-model="addressForm.soDienThoai" type="text" class="form-control bg-light border rounded-3 py-2" placeholder="Số điện thoại">
              </div>
            </div>

            <div class="region-picker mb-3">
              <button type="button" class="region-trigger" @click="toggleRegionPanel">
                <span :class="{ placeholder: !regionSummary }">
                  {{ regionSummary || 'Tỉnh/Thành phố, Quận/Huyện, Phường/Xã' }}
                </span>
                <span class="region-trigger-icons">
                  <i class="fas fa-search"></i>
                  <i class="fas fa-chevron-down small"></i>
                </span>
              </button>

              <div v-if="regionPanelOpen" class="region-panel">
                <div class="region-tabs">
                  <button
                    type="button"
                    class="region-tab"
                    :class="{ active: regionTab === 'tinh' }"
                    @click="regionTab = 'tinh'; regionKeyword = ''"
                  >
                    Tỉnh/Thành phố
                  </button>
                  <button
                    type="button"
                    class="region-tab"
                    :class="{ active: regionTab === 'huyen' }"
                    :disabled="!addressForm.tinhId"
                    @click="regionTab = 'huyen'; regionKeyword = ''"
                  >
                    Quận/Huyện
                  </button>
                  <button
                    type="button"
                    class="region-tab"
                    :class="{ active: regionTab === 'xa' }"
                    :disabled="!addressForm.huyenId"
                    @click="regionTab = 'xa'; regionKeyword = ''"
                  >
                    Phường/Xã
                  </button>
                </div>

                <div class="region-search">
                  <input
                    v-model="regionKeyword"
                    type="text"
                    class="form-control border-0 shadow-none"
                    :placeholder="regionTab === 'tinh' ? 'Tìm tỉnh/thành phố' : regionTab === 'huyen' ? 'Tìm quận/huyện' : 'Tìm phường/xã'"
                  >
                </div>

                <div class="region-list">
                  <template v-if="regionTab === 'tinh'">
                    <button
                      v-for="tinh in filteredTinhs"
                      :key="tinh.id"
                      type="button"
                      class="region-item"
                      :class="{ selected: addressForm.tinhId === tinh.id }"
                      @click="selectTinh(tinh)"
                    >
                      {{ tinh.tenTinh }}
                    </button>
                  </template>

                  <template v-else-if="regionTab === 'huyen'">
                    <button
                      v-for="huyen in filteredHuyens"
                      :key="huyen.id"
                      type="button"
                      class="region-item"
                      :class="{ selected: addressForm.huyenId === huyen.id }"
                      @click="selectHuyen(huyen)"
                    >
                      {{ huyen.tenHuyen }}
                    </button>
                  </template>

                  <template v-else>
                    <button
                      v-for="xa in filteredXas"
                      :key="xa.id"
                      type="button"
                      class="region-item"
                      :class="{ selected: addressForm.xaId === xa.id }"
                      @click="selectXa(xa)"
                    >
                      {{ xa.tenXa }}
                    </button>
                  </template>

                  <div
                    v-if="(regionTab === 'tinh' && filteredTinhs.length === 0) || (regionTab === 'huyen' && filteredHuyens.length === 0) || (regionTab === 'xa' && filteredXas.length === 0)"
                    class="region-empty"
                  >
                    Không có kết quả phù hợp
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <textarea
                v-model="addressForm.diaChiChiTiet"
                rows="3"
                class="form-control bg-light border rounded-3 py-2"
                placeholder="Số nhà, tên đường..."
              ></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold small">Loại địa chỉ</label>
              <select v-model="addressForm.loaiDiaChi" class="form-select bg-light border rounded-3 py-2">
                <option value="Nhà riêng">Nhà riêng</option>
                <option value="Văn phòng">Văn phòng</option>
              </select>
            </div>

            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="addressForm.laMacDinh" id="defaultAddress">
              <label class="form-check-label small fw-bold" for="defaultAddress">Đặt làm địa chỉ mặc định</label>
            </div>
          </div>

          <div class="modal-footer border-0 justify-content-between">
            <button class="btn btn-link text-secondary text-decoration-none" @click="showAddressModal = false">Trở lại</button>
            <button class="btn btn-danger rounded-3 px-4 fw-bold" @click="saveAddress" :disabled="savingAddress">
              <span v-if="savingAddress" class="spinner-border spinner-border-sm me-2"></span>
              Hoàn thành
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-pills .nav-link.active {
  background-color: #000;
  color: #fff !important;
}

.nav-link:hover:not(.active) {
  background-color: #f8f9fa;
}

.form-control:focus,
.form-select:focus {
  background-color: #fff;
  box-shadow: none;
  border-color: #d7d7d7;
}

.address-item {
  transition: all 0.2s;
}

.address-item:hover {
  border-color: #000 !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.region-picker {
  position: relative;
}

.region-trigger {
  width: 100%;
  min-height: 46px;
  border: 1px solid #d7d7d7;
  background: #fff;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
}

.region-trigger .placeholder {
  color: #9aa0a6;
}

.region-trigger-icons {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #7a7a7a;
}

.region-panel {
  margin-top: 8px;
  border: 1px solid #d7d7d7;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.region-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #ececec;
}

.region-tab {
  border: 0;
  background: #fff;
  padding: 14px 10px;
  color: #444;
  position: relative;
}

.region-tab.active {
  color: #ff5a3c;
}

.region-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #ff5a3c;
}

.region-tab:disabled {
  color: #b9b9b9;
}

.region-search {
  border-bottom: 1px solid #ececec;
  padding: 10px 12px;
}

.region-list {
  max-height: 260px;
  overflow-y: auto;
}

.region-item {
  width: 100%;
  border: 0;
  background: #fff;
  text-align: left;
  padding: 12px 14px;
}

.region-item:hover,
.region-item.selected {
  background: #fff3f0;
  color: #ff5a3c;
}

.region-empty {
  padding: 16px 14px;
  color: #7a7a7a;
}
</style>
