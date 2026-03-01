import { defineStore } from 'pinia';
import axios from 'axios';

const apiBaseUrl = 'http://localhost:8080/api/user';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    loading: false,
    userId: 1, // Mock user ID
  }),
  getters: {
    totalItems: (state) => state.items.reduce((acc, item) => acc + item.soLuong, 0),
    totalPrice: (state) => state.items.reduce((acc, item) => acc + (item.sanPhamChiTiet.sanPham.giaGoc * item.soLuong), 0),
  },
  actions: {
    async fetchCart() {
      this.loading = true;
      try {
        const res = await axios.get(`${apiBaseUrl}/cart/${this.userId}`);
        this.items = res.data;
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        this.loading = false;
      }
    },
    async addToCart(spctId, quantity) {
      try {
        await axios.post(`${apiBaseUrl}/cart/${this.userId}/add?spctId=${spctId}&quantity=${quantity}`);
        await this.fetchCart();
      } catch (error) {
        console.error("Error adding to cart:", error);
        throw error;
      }
    },
    // We can add more actions like updateQuantity or removeItem if the backend supports it
  }
});
