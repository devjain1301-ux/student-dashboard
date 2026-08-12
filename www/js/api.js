// js/api.js - Secure API Client for College Dashboard Backend
(function (window) {
  'use strict';

  const TOKEN_STORAGE_KEY = 'COLLEGE_DASHBOARD_AUTH_TOKEN';
  const API_BASE = (window.location.port === '5173' || window.location.port === '5174')
    ? 'http://localhost:5000/api'
    : '/api';

  class ApiClient {
    constructor() {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
      this.isBackendReachable = true;
    }

    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }

    getToken() {
      return this.token || localStorage.getItem(TOKEN_STORAGE_KEY);
    }

    isAuthenticated() {
      return !!this.getToken();
    }

    async request(endpoint, options = {}) {
      const url = `${API_BASE}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // If body is FormData, don't set Content-Type header manually
      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        this.isBackendReachable = true;

        if (response.status === 401) {
          // Token expired or invalid
          this.setToken(null);
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `HTTP Error ${response.status}`);
        }

        return data;
      } catch (err) {
        // Handle network connection failures gracefully (offline fallback)
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          this.isBackendReachable = false;
        }
        throw err;
      }
    }

    // ==========================================
    // AUTHENTICATION APIS
    // ==========================================
    auth = {
      register: async (payload) => {
        const res = await this.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success && res.token) {
          this.setToken(res.token);
        }
        return res;
      },

      login: async (email, pin) => {
        const res = await this.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, pin })
        });
        if (res.success && res.token) {
          this.setToken(res.token);
        }
        return res;
      },

      getProfile: async () => {
        return this.request('/auth/me', { method: 'GET' });
      },

      changePin: async (currentPin, newPin) => {
        return this.request('/auth/change-pin', {
          method: 'POST',
          body: JSON.stringify({ currentPin, newPin })
        });
      },

      logout: () => {
        this.setToken(null);
      }
    };

    // ==========================================
    // STUDENT ACADEMIC DATA & SYNC APIS
    // ==========================================
    student = {
      getData: async () => {
        return this.request('/student/data', { method: 'GET' });
      },

      saveData: async (data) => {
        return this.request('/student/data', {
          method: 'PUT',
          body: JSON.stringify({ data })
        });
      },

      sync: async (clientData, clientUpdatedAt) => {
        return this.request('/student/sync', {
          method: 'POST',
          body: JSON.stringify({ clientData, clientUpdatedAt })
        });
      },

      logStudySession: async (session) => {
        return this.request('/student/study-session', {
          method: 'POST',
          body: JSON.stringify(session)
        });
      }
    };

    // ==========================================
    // DOCUMENTS & PDF UPLOAD APIS
    // ==========================================
    documents = {
      upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return this.request('/documents/upload', {
          method: 'POST',
          body: formData
        });
      },

      list: async () => {
        return this.request('/documents', { method: 'GET' });
      },

      getDownloadUrl: (docId) => {
        return `${API_BASE}/documents/${docId}`;
      },

      delete: async (docId) => {
        return this.request(`/documents/${docId}`, { method: 'DELETE' });
      }
    };
  }

  // Expose singleton to window
  window.apiClient = new ApiClient();

})(window);
