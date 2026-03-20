<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const activeTab = ref('info'); // 'info', 'address'
const addresses = ref([]); // Restore missing variable

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

const user = authStore.currentUser || {
  hoTen: '',
  email: '',
  soDienThoai: ''
};

const handleLogout = () => {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    authStore.logout();
    router.push('/login');
  }
};

const deleteAddress = (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
    addresses.value = addresses.value.filter(a => a.id !== id);
  }
};

const setDefaultAddress = (id) => {
  addresses.value = addresses.value.map(a => ({
    ...a,
    isDefault: a.id === id
  }));
};
</script>

<template>
  <div class="container py-5">
    <div class="row g-4">
      <!-- Sidebar -->
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

      <!-- Content -->
      <div class="col-lg-9">
        <div class="bg-white rounded-4 shadow-sm p-5 h-100">
          <!-- Info Tab -->
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

          <!-- Address Book Tab -->
          <div v-if="activeTab === 'address'">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="fw-bold mb-0">Sổ Địa Chỉ</h4>
              <button class="btn btn-dark rounded-pill px-4 fw-bold small">
                <i class="fas fa-plus me-2"></i> THÊM ĐỊA CHỈ MỚI
              </button>
            </div>

            <div class="address-list">
              <div v-for="addr in addresses" :key="addr.id" class="address-item p-4 rounded-4 border mb-3 position-relative">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="d-flex align-items-center">
                    <span class="fw-bold me-2">{{ addr.name }}</span>
                    <span v-if="addr.isDefault" class="badge bg-success-subtle text-success small fw-normal">Mặc định</span>
                  </div>
                  <div class="address-actions">
                    <button class="btn btn-link text-primary p-0 me-3 text-decoration-none small fw-bold">Chỉnh sửa</button>
                    <button @click="deleteAddress(addr.id)" class="btn btn-link text-danger p-0 text-decoration-none small fw-bold" :disabled="addr.isDefault">Xóa</button>
                  </div>
                </div>
                
                <p class="text-secondary small mb-1"><i class="fas fa-phone-alt me-2"></i> {{ addr.phone }}</p>
                <p class="text-secondary small mb-3"><i class="fas fa-map-marker-alt me-2"></i> {{ addr.address }}</p>
                
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
.form-control:focus {
  background-color: #eee;
  box-shadow: none;
}
.address-item {
  transition: all 0.2s;
}
.address-item:hover {
  border-color: #000 !important;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}
</style>
