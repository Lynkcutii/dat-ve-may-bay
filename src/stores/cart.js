import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from './auth';

const apiBaseUrl = 'http://localhost:8080/api/user';

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
    totalPrice: (state) => state.items.reduce((acc, item) => acc + (item.sanPhamChiTiet.sanPham.giaGoc * item.soLuong), 0),
    selectedItems: (state) => state.items.filter(item => state.selectedItemIds.includes(item.id)),
    selectedTotalPrice: (state) => state.items
      .filter(item => state.selectedItemIds.includes(item.id))
      .reduce((acc, item) => acc + (item.sanPhamChiTiet.sanPham.giaGoc * item.soLuong), 0),
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
        const cartItemIds = this.items.map(item => item.id);
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
    toggleSelection(itemId) {
      const index = this.selectedItemIds.indexOf(itemId);
      if (index === -1) {
        this.selectedItemIds.push(itemId);
      } else {
        this.selectedItemIds.splice(index, 1);
      }
    },
    toggleAll(selected) {
      if (selected) {
        this.selectedItemIds = this.items.map(item => item.id);
      } else {
        this.selectedItemIds = [];
      }
    }
  }
});
