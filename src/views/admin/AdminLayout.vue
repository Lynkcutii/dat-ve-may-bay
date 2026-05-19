<script setup>
import { RouterView } from 'vue-router'
import { ref } from 'vue'

const isSidebarOpen = ref(false)
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="container-fluid overflow-hidden">
    <div class="row">
      <!-- Mobile Header Toggler -->
      <div class="col-12 d-md-none bg-dark text-white p-3 d-flex justify-content-between align-items-center sticky-top">
        <img src="/src/img/logo2.jpg" height="40px">
        <button class="btn btn-outline-light border-0" @click="toggleSidebar">
          <i class="fas fa-bars fs-3"></i>
        </button>
      </div>

      <!-- Sidebar Admin bên trái -->
      <nav 
        class="col-md-3 col-lg-2 sidebar p-3 sticky-top shadow" 
        :class="['admin-sidebar', { 'show-mobile': isSidebarOpen }]"
        style="background-color: #305a78;"
      >
        <div class="d-flex justify-content-between align-items-center mb-4 d-none d-md-flex">
          <img src="/src/img/logo2.jpg" height="60px" class="mx-auto">
        </div>
        
        <!-- Close button for mobile -->
        <div class="d-md-none text-end mb-3">
          <button class="btn btn-link text-white p-0" @click="toggleSidebar">
            <i class="fas fa-times fs-4"></i>
          </button>
        </div>

        <ul class="nav flex-column gap-1 overflow-auto custom-scrollbar" style="max-height: calc(100vh - 150px);">
          <li class="nav-item">
            <router-link to="/admin/pos" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-cash-register me-2"></i>Bán hàng</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/products" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-box me-2"></i>Sản phẩm</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/categories" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-list me-2"></i>Danh mục</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/attributes" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-tags me-2"></i>Thuộc tính</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/bills" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-file-invoice me-2"></i>Hóa đơn</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/returns" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-undo-alt me-2"></i>Đổi trả</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/return-policy" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-sliders-h me-2"></i>Cấu hình đổi trả</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/kho-loi" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-exclamation-triangle me-2"></i>Kho lỗi</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/vouchers" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-ticket-alt me-2"></i>Voucher</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/promotions" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-percentage me-2"></i>Khuyến mại</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/customers" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-users me-2"></i>Khách hàng</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/staff" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-user-shield me-2"></i>Nhân viên</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/admin/revenue" @click="isSidebarOpen = false" class="nav-link text-white small hover-link py-2"><i class="fas fa-chart-line me-2"></i>Doanh thu</router-link>
          </li>
          <hr class="text-secondary opacity-25">
          <li class="nav-item">
            <router-link to="/login" class="nav-link text-warning small py-2"><i class="fas fa-sign-out-alt me-2"></i>Quay lại Web</router-link>
          </li>
        </ul>
      </nav>

      <!-- Overlay for mobile sidebar -->
      <div v-if="isSidebarOpen" class="sidebar-overlay d-md-none" @click="toggleSidebar"></div>

      <!-- Nội dung chính bên phải -->
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4 min-vh-100">
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-2 pb-2 mb-3 border-bottom">
          <h1 class="h4 fw-bold text-dark">Hệ Thống Quản Trị BeeSport</h1>
        </div>
        
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.hover-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}
.nav-link.router-link-active {
  background-color: #dc3545 !important;
  border-radius: 5px;
  font-weight: bold;
}

@media (max-width: 767.98px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    width: 260px;
    z-index: 1050;
    transition: all 0.3s ease;
  }
  .admin-sidebar.show-mobile {
    left: 0;
  }
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 1040;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
}
</style>