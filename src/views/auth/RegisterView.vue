<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const hoTen = ref('');
const email = ref('');
const soDienThoai = ref('');
const matKhau = ref('');
const confirmPassword = ref('');
const error = ref('');

const handleRegister = async () => {
  if (matKhau.value !== confirmPassword.value) {
    error.value = "Mật khẩu xác nhận không khớp!";
    return;
  }
  
  error.value = '';
  try {
    await authStore.register({
      hoTen: hoTen.value,
      email: email.value,
      soDienThoai: soDienThoai.value,
      matKhau: matKhau.value
    });
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    router.push('/login');
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Đăng ký thất bại. Vui lòng thử lại!';
  }
};
</script>

<template>
  <div class="register-wrapper d-flex align-items-center">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="card-body p-4 p-sm-5">
              <div class="text-center mb-4">
                <img src="/src/img/logo1.jpg" alt="BeeSport" class="img-fluid mb-3" style="max-height: 70px;">
                <h3 class="fw-bold text-dark">ĐĂNG KÝ TÀI KHOẢN</h3>
                <p class="text-secondary small">Tham gia cộng đồng BeeSport ngay hôm nay!</p>
              </div>

              <div v-if="error" class="alert alert-danger mb-4 py-2 small border-0 rounded-3">
                <i class="fas fa-exclamation-circle me-2"></i> {{ error }}
              </div>

              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-uppercase">Họ và tên</label>
                  <div class="input-group custom-input-group">
                    <span class="input-group-text bg-light border-0"><i class="far fa-user"></i></span>
                    <input 
                      type="text" 
                      v-model="hoTen"
                      class="form-control bg-light border-0 shadow-none" 
                      placeholder="Nhập họ và tên..."
                      required
                    >
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold text-uppercase">Email</label>
                  <div class="input-group custom-input-group">
                    <span class="input-group-text bg-light border-0"><i class="far fa-envelope"></i></span>
                    <input 
                      type="email" 
                      v-model="email"
                      class="form-control bg-light border-0 shadow-none" 
                      placeholder="example@gmail.com"
                      required
                    >
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold text-uppercase">Số điện thoại</label>
                  <div class="input-group custom-input-group">
                    <span class="input-group-text bg-light border-0"><i class="fas fa-phone"></i></span>
                    <input 
                      type="tel" 
                      v-model="soDienThoai"
                      class="form-control bg-light border-0 shadow-none" 
                      placeholder="Nhập số điện thoại..."
                      required
                    >
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold text-uppercase">Mật khẩu</label>
                  <div class="input-group custom-input-group">
                    <span class="input-group-text bg-light border-0"><i class="fas fa-lock"></i></span>
                    <input 
                      type="password" 
                      v-model="matKhau"
                      class="form-control bg-light border-0 shadow-none" 
                      placeholder="********"
                      required
                    >
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label small fw-bold text-uppercase">Xác nhận mật khẩu</label>
                  <div class="input-group custom-input-group">
                    <span class="input-group-text bg-light border-0"><i class="fas fa-check-double"></i></span>
                    <input 
                      type="password" 
                      v-model="confirmPassword"
                      class="form-control bg-light border-0 shadow-none" 
                      placeholder="********"
                      required
                    >
                  </div>
                </div>

                <button type="submit" class="btn btn-danger w-100 py-2 fw-bold rounded-pill shadow-sm mb-4">
                  ĐĂNG KÝ NGAY
                </button>
              </form>

              <div class="text-center mt-3">
                <span class="small text-secondary">Bạn đã có tài khoản? </span>
                <router-link to="/login" class="text-primary small text-decoration-none fw-bold">Đăng nhập ngay</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-wrapper {
  min-height: 80vh;
  padding: 40px 0;
}

.custom-input-group {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid transparent;
  transition: 0.3s;
}

.custom-input-group:focus-within {
  border-color: #dc3545;
  box-shadow: 0 0 10px rgba(220, 53, 69, 0.1);
}

.form-control {
  padding: 12px;
}

.btn-danger {
  background-color: #dc3545;
  border: none;
  letter-spacing: 1px;
  transition: 0.3s;
}

.btn-danger:hover {
  background-color: #bb2d3b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
}

.card {
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.1) !important;
}
</style>
