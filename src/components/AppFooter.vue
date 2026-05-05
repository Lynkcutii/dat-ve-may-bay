<script setup></script>

<template>
  <footer class="app-footer">
    <div class="footer-top py-5">
      <div class="container">
        <div class="row gy-5">
          <!-- Brand Info -->
          <div class="col-lg-4 col-md-6">
            <router-link to="/" class="footer-logo mb-4 d-inline-block">
              <img src="/src/img/logo2.jpg" height="60" class="rounded shadow-sm" alt="BeeSport Logo">
            </router-link>
            <p class="footer-description mb-4">
              BeeSport - Hệ thống cửa hàng đồ thể thao nam uy tín. Chúng tôi mang đến những sản phẩm chất lượng bền bỉ, giúp bạn tự tin bứt phá mọi giới hạn.
            </p>
            <div class="social-links d-flex gap-3">
              <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-tiktok"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-youtube"></i></a>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="col-lg-2 col-md-6">
            <h6 class="footer-title">Khám Phá</h6>
            <ul class="footer-links">
              <li><router-link to="/">Trang chủ</router-link></li>
              <li><router-link to="/products">Sản phẩm</router-link></li>
              <li><router-link to="/about">Giới thiệu</router-link></li>
              <li><router-link to="/contact">Liên hệ</router-link></li>
            </ul>
          </div>

          <!-- Support Links -->
          <div class="col-lg-2 col-md-6">
            <h6 class="footer-title">Hỗ Trợ</h6>
            <ul class="footer-links">
              <li><a href="#">Đổi trả 7 ngày</a></li>
              <li><a href="#">Chính sách bảo hành</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản dịch vụ</a></li>
              <li><a href="#">Câu hỏi thường gặp</a></li>
            </ul>
          </div>

          <!-- Contact Info -->
          <div class="col-lg-4 col-md-6">
            <h6 class="footer-title">Liên Hệ</h6>
            <div class="contact-info">
              <div class="contact-item mb-3">
                <div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div>
                <span>123 Đường Thể Thao, Quận 1, TP. Hồ Chí Minh</span>
              </div>
              <div class="contact-item mb-3">
                <div class="contact-icon"><i class="fas fa-phone-alt"></i></div>
                <span>+84 363 652 758</span>
              </div>
              <div class="contact-item mb-4">
                <div class="contact-icon"><i class="fas fa-envelope"></i></div>
                <span>support@beesport.com</span>
              </div>
            </div>
            <div class="payment-methods">
              <p class="small text-muted mb-2">Phương thức thanh toán:</p>
              <div class="d-flex gap-2">
                <i class="fab fa-cc-visa fs-3 opacity-50"></i>
                <i class="fab fa-cc-mastercard fs-3 opacity-50"></i>
                <i class="fab fa-cc-paypal fs-3 opacity-50"></i>
                <i class="fas fa-wallet fs-3 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer Bottom -->
    <div class="footer-bottom py-3">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6 text-center text-md-start">
            <p class="mb-0 small opacity-50">&copy; 2026 BeeSport. All Rights Reserved. Designed by Zencoder.</p>
          </div>
          <div class="col-md-6 text-center text-md-end mt-2 mt-md-0">
            <ul class="footer-bottom-links list-inline mb-0 small opacity-50">
              <li class="list-inline-item"><a href="#" class="text-white text-decoration-none">Privacy Policy</a></li>
              <li class="list-inline-item ms-3"><a href="#" class="text-white text-decoration-none">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #0f172a;
  color: #fff;
  font-family: 'Inter', sans-serif;
}

.footer-top {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-description {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.8;
  font-size: 0.95rem;
}

.footer-title {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 30px;
  position: relative;
  padding-bottom: 12px;
}

.footer-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 2px;
  background: #ff4d6d;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.footer-links a:hover {
  color: #ff4d6d;
  padding-left: 8px;
}

.social-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: #ff4d6d;
  color: #fff;
  transform: translateY(-3px);
}

.contact-item {
  display: flex;
  gap: 15px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.contact-icon {
  color: #ff4d6d;
}

.footer-bottom {
  background: #020617;
}

.footer-bottom-links a:hover {
  opacity: 1;
  color: #ff4d6d !important;
}

@media (max-width: 991px) {
  .footer-title {
    margin-bottom: 20px;
  }
}
</style>
