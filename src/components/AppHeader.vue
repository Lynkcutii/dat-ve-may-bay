
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark sticky-top main-header p-0">
    <div class="container-fluid px-lg-5 d-flex align-items-center justify-content-between">
      
      <!-- 1. LOGO (Bên trái) -->
      <div class="header-left d-flex align-items-center">
        <!-- Hamburger Menu for Mobile -->
        <button class="navbar-toggler border-0 shadow-none d-lg-none me-2" type="button" @click="toggleMobileMenu">
          <i class="fas fa-bars text-white fs-4"></i>
        </button>
        <router-link class="navbar-brand m-0 p-0" to="/">
          <img src="/src/img/logo2.jpg" alt="BeeSport" class="logo-img">
        </router-link>
      </div>

      <!-- 2. MENU CHÍNH (Ở giữa - Ép cùng hàng) -->
      <div class="header-center d-none d-lg-block">
        <ul class="nav-menu-list m-0 p-0">
          <li>
            <router-link class="menu-link" to="/">TRANG CHỦ</router-link>
          </li>
          
          <!-- SẢN PHẨM CÓ HOVER -->
          <li class="has-submenu">
            <router-link class="menu-link" to="/products">
              SẢN PHẨM 
            </router-link>
            <!-- Menu con hiện ra khi hover -->
            <ul class="submenu-box shadow-lg">
              <li><router-link to="/products">Chạy bộ</router-link></li>
              <li><router-link to="/products">Cầu lông</router-link></li>
              <li><router-link to="/products">Đá bóng</router-link></li>
            </ul>
          </li>

          <li>
            <router-link class="menu-link" to="/about">GIỚI THIỆU</router-link>
          </li>
          <li>
            <router-link class="menu-link" to="/contact">LIÊN HỆ</router-link>
          </li>
        </ul>
      </div>

      <!-- 3. SEARCH & ICONS (Bên phải) -->
      <div class="header-right d-flex align-items-center gap-2 gap-sm-3">
        <div class="search-box d-none d-xl-flex">
          <input type="text" placeholder="Tìm kiếm...">
          <i class="fas fa-search"></i>
        </div>
        <div class="icon-group d-flex align-items-center gap-3 gap-lg-4">
          <div v-if="authStore.isAuthenticated" class="user-dropdown position-relative">
            <a href="javascript:void(0)" class="icon-item d-flex align-items-center gap-2 text-decoration-none">
              <i class="far fa-user"></i>
              <span class="d-none d-md-inline small fw-bold text-white">{{ authStore.currentUser.hoTen }}</span>
            </a>
            <ul class="user-submenu shadow-lg">
              <li><router-link to="/account">Tài khoản</router-link></li>
              <li v-if="authStore.isAdmin"><router-link to="/admin">Quản trị</router-link></li>
              <li><router-link to="/order-history">Đơn hàng</router-link></li>
              <li><a href="javascript:void(0)" @click="handleLogout" class="text-danger">Đăng xuất</a></li>
            </ul>
          </div>
          <router-link v-else to="/login" class="icon-item"><i class="far fa-user"></i></router-link>
          
          <router-link to="/wishlist" class="icon-item d-none d-sm-block"><i class="far fa-heart"></i></router-link>
          <router-link to="/cart" class="icon-item position-relative">
            <i class="fas fa-shopping-bag"></i>
            <span class="cart-badge">0</span>
          </router-link>
        </div>
      </div>

      <!-- MOBILE OVERLAY MENU -->
      <div 
        class="mobile-overlay d-lg-none" 
        :class="{ 'show': isMobileMenuOpen }"
        @click="toggleMobileMenu"
      ></div>
      
      <div 
        class="mobile-menu-content d-lg-none bg-white p-4"
        :class="{ 'show': isMobileMenuOpen }"
      >
        <div class="d-flex justify-content-between align-items-center mb-4">
          <img src="/src/img/logo2.jpg" height="40px">
          <button class="btn btn-link text-dark p-0" @click="toggleMobileMenu">
            <i class="fas fa-times fs-4"></i>
          </button>
        </div>
        
        <ul class="nav flex-column gap-3 fw-bold">
          <li class="nav-item">
            <router-link class="nav-link text-dark p-0" to="/" @click="isMobileMenuOpen = false">TRANG CHỦ</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link text-dark p-0" to="/products" @click="isMobileMenuOpen = false">SẢN PHẨM</router-link>
          </li>
          <li class="nav-item ps-3 border-start">
            <router-link class="nav-link text-secondary py-1 small" to="/products" @click="isMobileMenuOpen = false">Chạy bộ</router-link>
            <router-link class="nav-link text-secondary py-1 small" to="/products" @click="isMobileMenuOpen = false">Cầu lông</router-link>
            <router-link class="nav-link text-secondary py-1 small" to="/products" @click="isMobileMenuOpen = false">Đá bóng</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link text-dark p-0" to="/about" @click="isMobileMenuOpen = false">GIỚI THIỆU</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link text-dark p-0" to="/contact" @click="isMobileMenuOpen = false">LIÊN HỆ</router-link>
          </li>
        </ul>
        
        <div class="mt-5 border-top pt-4">
          <div class="search-box w-100 mb-4">
            <input type="text" placeholder="Tìm kiếm..." class="w-100">
            <i class="fas fa-search"></i>
          </div>
          <div class="d-flex gap-4 fs-4 text-secondary justify-content-center">
            <i class="fab fa-facebook"></i>
            <i class="fab fa-instagram"></i>
            <i class="fab fa-tiktok"></i>
          </div>
        </div>
      </div>

    </div>
  </nav>
</template>

<style scoped>
/* KHUNG HEADER */
.main-header {
  height: 80px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
  background: #305a78;
  z-index: 1030;
}

.logo-img {
  height: 60px;
  width: auto;
  display: block;
}

/* MENU CHÍNH */
.nav-menu-list {
  display: flex;
  list-style: none;
  align-items: center;
  gap: 30px;
}

.menu-link {
  text-decoration: none;
  color: #fff !important;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  padding: 10px 0;
  display: block;
  transition: 0.3s;
}

.menu-link:hover {
  color: #ffc107 !important;
}

/* HIỆU ỨNG HOVER SẢN PHẨM */
.has-submenu {
  position: relative;
}

.submenu-box {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(15px);
  background: #fff;
  min-width: 200px;
  list-style: none;
  padding: 15px 0;
  border-radius: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
}

.has-submenu:hover .submenu-box {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.submenu-box li a {
  display: block;
  padding: 10px 25px;
  color: #444;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: 0.2s;
  text-align: left;
}

.submenu-box li a:hover {
  background: #f8f9fa;
  color: #dc3545;
  padding-left: 30px;
}

/* THANH SEARCH & ICONS */
.search-box {
  background: rgba(255,255,255,0.1);
  border-radius: 50px;
  padding: 7px 18px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.2);
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 12px;
  width: 140px;
  color: #fff;
}
.search-box input::placeholder { color: rgba(255,255,255,0.6); }
.search-box i { color: #fff; }

.icon-item {
  color: #fff;
  font-size: 20px;
  text-decoration: none;
  transition: 0.3s;
}

.icon-item:hover { color: #ffc107; transform: translateY(-2px); }

.cart-badge {
  position: absolute;
  top: -8px;
  right: -10px;
  background: #dc3545;
  color: #fff;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 50px;
}

/* MOBILE MENU */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 1040;
  opacity: 0;
  visibility: hidden;
  transition: 0.3s;
}
.mobile-overlay.show {
  opacity: 1;
  visibility: visible;
}

.mobile-menu-content {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  z-index: 1050;
  transition: 0.3s;
  box-shadow: 5px 0 15px rgba(0,0,0,0.1);
}
.mobile-menu-content.show {
  left: 0;
}

/* USER DROPDOWN */
.user-dropdown {
  cursor: pointer;
}

.user-submenu {
  position: absolute;
  top: 100%;
  right: 0;
  transform: translateY(15px);
  background: #fff;
  min-width: 160px;
  list-style: none;
  padding: 10px 0;
  border-radius: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
}

.user-dropdown:hover .user-submenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(5px);
}

.user-submenu li a {
  display: block;
  padding: 8px 20px;
  color: #444;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: 0.2s;
}

.user-submenu li a:hover {
  background: #f8f9fa;
  color: #dc3545;
}

/* RESPONSIVE */
@media (max-width: 991px) {
  .main-header { height: 70px; }
  .logo-img { height: 40px; }
}
</style>