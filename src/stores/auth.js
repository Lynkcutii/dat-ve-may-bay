import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    error: null,
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.vaiTro?.ma === 'ADMIN',
    currentUser: (state) => state.user
  },
  actions: {
    async login(identifier, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('http://localhost:8080/api/auth/login', {
          identifier,
          password
        });
        this.user = response.data;
        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
      } catch (err) {
        this.error = err.response?.data || 'Login failed';
        throw this.error;
      } finally {
        this.loading = false;
      }
    },
    async register(userData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('http://localhost:8080/api/auth/register', userData);
        return response.data;
      } catch (err) {
        this.error = err.response?.data || 'Registration failed';
        throw this.error;
      } finally {
        this.loading = false;
      }
    },
    async forgotPassword(email, newPassword) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post('http://localhost:8080/api/auth/forgot-password', {
          email,
          newPassword
        });
        return response.data;
      } catch (err) {
        this.error = err.response?.data || 'Reset failed';
        throw this.error;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.user = null;
      localStorage.removeItem('user');
    }
  }
});
