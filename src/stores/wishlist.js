import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from './auth';

const apiBaseUrl = 'http://localhost:8080/api/user';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [],
    loading: false
  }),
  getters: {
    userId: () => {
      const authStore = useAuthStore();
      return authStore.currentUser?.id;
    },
    productIds: (state) => state.items.map(item => item.id),
    totalItems: (state) => state.items.length,
    isInWishlist: (state) => (productId) => state.items.some(item => item.id === productId)
  },
  actions: {
    async fetchWishlist() {
      if (!this.userId) {
        this.items = [];
        return;
      }

      try {
        this.loading = true;
        const res = await axios.get(`${apiBaseUrl}/wishlist/${this.userId}`);
        this.items = (res.data || []).map(p => ({
          id: p.id,
          name: p.tenSanPham,
          price: p.giaBanMin ?? p.giaSauGiam ?? p.giaGoc ?? 0,
          originalPrice: p.giaGoc ?? 0,
          hasPromotion: (p.giaBanMin ?? p.giaSauGiam ?? p.giaGoc ?? 0) < (p.giaGoc ?? 0),
          category: p.danhMuc?.ten || 'Khác',
          isNew: true,
          image: p.hinhAnhs?.[0]?.url || 'https://placehold.co/400x400?text=No+Image'
        }));
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        this.loading = false;
      }
    },
    async toggleWishlist(product) {
      if (!this.userId) {
        throw new Error('Vui lòng đăng nhập để sử dụng danh sách yêu thích');
      }

      await axios.post(`${apiBaseUrl}/wishlist/${this.userId}/toggle?productId=${product.id}`);
      await this.fetchWishlist();
    },
    async removeFromWishlist(productId) {
      if (!this.userId) return;
      await axios.delete(`${apiBaseUrl}/wishlist/${this.userId}/${productId}`);
      this.items = this.items.filter(item => item.id !== productId);
    }
  }
});
