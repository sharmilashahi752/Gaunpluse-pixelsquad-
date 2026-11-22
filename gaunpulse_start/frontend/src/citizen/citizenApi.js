import axios from 'axios';

const TOKEN_KEY = 'gaunpulse_citizen_token';
const USER_KEY = 'gaunpulse_citizen_user';

export const citizenClient = axios.create({
  baseURL: '',
  headers: {
    'Accept': 'application/json',
  },
});

citizenClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

citizenClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

export const citizenAuth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  saveSession: (token, user) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const citizenService = {
  async register(data) {
    const res = await citizenClient.post('/api/citizen/register', data);
    if (res.data?.token) {
      citizenAuth.saveSession(res.data.token, res.data.user);
    }
    return res.data;
  },

  async login(credentials) {
    const res = await citizenClient.post('/api/citizen/login', credentials);
    if (res.data?.token) {
      citizenAuth.saveSession(res.data.token, res.data.user);
    }
    return res.data;
  },

  async logout() {
    try {
      await citizenClient.post('/api/citizen/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      citizenAuth.clearSession();
    }
  },

  async me() {
    const res = await citizenClient.get('/api/citizen/me');
    if (res.data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getLocations(params = {}) {
    const res = await citizenClient.get('/api/citizen/locations', { params });
    return res.data;
  },

  async getDashboard() {
    const res = await citizenClient.get('/api/citizen/dashboard');
    return res.data;
  },

  async submitComplaint(formData) {
    const res = await citizenClient.post('/api/citizen/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });
    return res.data;
  },

  async transcribeAudio(formData) {
    const res = await citizenClient.post('/api/citizen/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 45000,
    });
    return res.data;
  },

  async getComplaints(params = {}) {
    const res = await citizenClient.get('/api/citizen/complaints', { params });
    return res.data;
  },

  async getComplaint(id) {
    const res = await citizenClient.get(`/api/citizen/complaints/${id}`);
    return res.data;
  },

  async withdrawComplaint(id) {
    const res = await citizenClient.post(`/api/citizen/complaints/${id}/withdraw`);
    return res.data;
  },

  async getNotifications() {
    const res = await citizenClient.get('/api/citizen/notifications');
    return res.data;
  },

  async markNotificationRead(id) {
    const res = await citizenClient.patch(`/api/citizen/notifications/${id}/read`);
    return res.data;
  },
};
