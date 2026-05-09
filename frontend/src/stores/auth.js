import { defineStore } from 'pinia';
import { api } from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
  }),

  actions: {
    async login(email, password) {
      this.loading = true;
      try {
        const res = await api.login(email, password);
        if (res.ok) {
          api.setTokens(res.data.data.accessToken, res.data.data.refreshToken);
          await this.fetchProfile();
        }
        return res;
      } finally {
        this.loading = false;
      }
    },

    async register(name, email, password) {
      this.loading = true;
      try {
        const res = await api.register(name, email, password);
        return res;
      } finally {
        this.loading = false;
      }
    },

    async fetchProfile() {
      const res = await api.getProfile();
      if (res.ok) {
        this.user = res.data.data;
        this.isAuthenticated = true;
      } else {
        this.user = null;
        this.isAuthenticated = false;
      }
      return res;
    },

    async logout() {
      await api.logout();
      api.clearTokens();
      this.user = null;
      this.isAuthenticated = false;
    },

    async init() {
      if (api.accessToken) {
        await this.fetchProfile();
      }
    },
  },
});
