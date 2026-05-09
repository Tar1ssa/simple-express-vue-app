const API_BASE = '/api';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken') || null;
    this.refreshToken = localStorage.getItem('refreshToken') || null;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(method, endpoint, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    let response = await fetch(`${API_BASE}${endpoint}`, options);

    // If 401 and we have a refresh token, attempt token refresh
    if (response.status === 401 && auth && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        options.headers = headers;
        response = await fetch(`${API_BASE}${endpoint}`, options);
      }
    }

    const data = await response.json();
    return { status: response.status, ok: response.ok, data };
  }

  async refreshAccessToken() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const data = await res.json();
      if (res.ok && data.data?.accessToken) {
        this.accessToken = data.data.accessToken;
        localStorage.setItem('accessToken', data.data.accessToken);
        return true;
      }
      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // ─── Auth Endpoints ──────────────────────────────────────
  register(name, email, password) {
    return this.request('POST', '/auth/register', { name, email, password });
  }

  login(email, password) {
    return this.request('POST', '/auth/login', { email, password });
  }

  logout() {
    return this.request('POST', '/auth/logout', { refreshToken: this.refreshToken });
  }

  changePassword(currentPassword, newPassword) {
    return this.request('POST', '/auth/change-password', { currentPassword, newPassword }, true);
  }

  forgotPassword(email) {
    return this.request('POST', '/auth/forgot-password', { email });
  }

  resetPassword(token, newPassword) {
    return this.request('POST', '/auth/reset-password', { token, newPassword });
  }

  // ─── User Endpoints ──────────────────────────────────────
  getProfile() {
    return this.request('GET', '/users/profile', null, true);
  }

  updateProfile(updates) {
    return this.request('PUT', '/users/profile', updates, true);
  }

  listUsers() {
    return this.request('GET', '/users', null, true);
  }

  // ─── Health ──────────────────────────────────────────────
  healthCheck() {
    return this.request('GET', '/health');
  }
}

export const api = new ApiService();
