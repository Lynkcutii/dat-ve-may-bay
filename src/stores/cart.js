import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from './auth';
import { API_BASE_URL } from '@/config';

const apiBaseUrl = `${API_BASE_URL}/api/user`;

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    selectedItemIds: [],
    loading: false,
  }),
  getters: {
    userId: () => {
      const authStore = useAuthStore();
      return authStore.currentUser?.id;
    },
    totalItems: (state) => state.items.reduce((acc, item) => acc + item.soLuong, 0),
    totalPrice: (state) => state.items.reduce((acc, item) => {
      const price = item.donGia || item.sanPhamChiTiet.giaBan;
      return acc + (price * item.soLuong);
    }, 0),
    selectedItems: (state) => state.items.filter(item => state.selectedItemIds.includes(item.idGhct)),
    selectedTotalPrice: (state) => state.items
      .filter(item => state.selectedItemIds.includes(item.idGhct))
      .reduce((acc, item) => {
        const price = item.donGia || item.sanPhamChiTiet.giaBan;
        return acc + (price * item.soLuong);
      }, 0),
  },
  actions: {
    async fetchCart() {
      if (!this.userId) {
        this.items = [];
        return;
      }
      this.loading = true;
      try {
        const res = await axios.get(`${apiBaseUrl}/cart/${this.userId}`);
        this.items = res.data;
        // Keep selectedItemIds that are still in the cart
        const cartItemIds = this.items.map(item => item.idGhct);
        this.selectedItemIds = this.selectedItemIds.filter(id => cartItemIds.includes(id));
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        this.loading = false;
      }
    },
    async addToCart(spctId, quantity) {
      if (!this.userId) {
        throw new Error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      }
      try {
        await axios.post(`${apiBaseUrl}/cart/${this.userId}/add?spctId=${spctId}&quantity=${quantity}`, {});
        await this.fetchCart();
      } catch (error) {
        console.error("Error adding to cart:", error.response?.data || error.message);
        throw error;
      }
    },
    async removeFromCart(ghctId) {
      if (!this.userId) return;
      try {
        await axios.delete(`${apiBaseUrl}/cart/${this.userId}/remove/${ghctId}`);
        await this.fetchCart();
      } catch (error) {
        console.error("Error removing from cart:", error.response?.data || error.message);
        throw error;
      }
    },
  // Trong cart.js
toggleSelection(itemId) {
  if (itemId === null || itemId === undefined) {
    console.error("Lỗi: ID sản phẩm bị trống!", itemId);
    return;
  }
  
  const index = this.selectedItemIds.indexOf(itemId);
  if (index === -1) {
    this.selectedItemIds.push(itemId);
  } else {
    this.selectedItemIds.splice(index, 1);
  }
  
  // Log ra để kiểm tra danh sách đã chọn
  console.log("Danh sách ID đã chọn:", this.selectedItemIds);
},
    toggleAll(selected) {
      if (selected) {
        this.selectedItemIds = this.items.map(item => item.idGhct);
      } else {
        this.selectedItemIds = [];
      }
    },
    async clearSelected() {
      // Clear items locally first to provide immediate feedback
      this.items = this.items.filter(item => !this.selectedItemIds.includes(item.idGhct));
      this.selectedItemIds = [];
      // Optionally re-fetch from server to be 100% sure
      await this.fetchCart();
    }
  }
});
