import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'accessToken';
const USER_KEY  = 'currentUser';

export const tokenHelpers = {
  get:        ()            => localStorage.getItem(TOKEN_KEY),
  set:        (t: string)   => localStorage.setItem(TOKEN_KEY, t),
  remove:     ()            => localStorage.removeItem(TOKEN_KEY),
  getUser:    ()            => { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; },
  setUser:    (u: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  removeUser: ()            => localStorage.removeItem(USER_KEY),
  clearAll:   ()            => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'SALES_REP';

export interface AuthUser {
  id:        string;
  username:  string;
  email:     string;
  firstName: string;
  lastName:  string;
  phone:     string | null;
  role:      UserRole;
  territory: string | null;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user:        AuthUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every outgoing request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenHelpers.get();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// On 401 → clear storage and redirect to login
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenHelpers.clearAll();
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Auth endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', { username, password });
    return res.data;
  },
  me: async (): Promise<AuthUser> => {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },
  logout: () => {
    tokenHelpers.clearAll();
    window.location.href = '/';
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Users endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  username: string; email: string; password: string;
  firstName: string; lastName: string;
  phone?: string; role?: UserRole; territory?: string;
}
export interface UpdateUserPayload extends Partial<CreateUserPayload> { isActive?: boolean; }

export const usersApi = {
  getAll:  async ():                             Promise<AuthUser[]>          => (await api.get<AuthUser[]>('/users')).data,
  getOne:  async (id: string):                   Promise<AuthUser>            => (await api.get<AuthUser>(`/users/${id}`)).data,
  create:  async (d: CreateUserPayload):         Promise<AuthUser>            => (await api.post<AuthUser>('/users', d)).data,
  update:  async (id: string, d: UpdateUserPayload): Promise<AuthUser>        => (await api.patch<AuthUser>(`/users/${id}`, d)).data,
  remove:  async (id: string):                   Promise<{ message: string }> => (await api.delete<{ message: string }>(`/users/${id}`)).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy helpers (RoutesPage / Visit still use these)
// ─────────────────────────────────────────────────────────────────────────────

const legacy = axios.create({ baseURL: 'http://localhost:3000' });

export const getRoutes    = async (userId: number)                                                          => (await legacy.get(`/routes/${userId}`)).data;
export const getRouteStop = async (userId: number, stopId: number)                                          => (await legacy.get(`/route/${userId}/${stopId}`)).data;
export const checkInVisit = async (userId: number, stopId: number)                                          => (await legacy.post(`/visit/checkin`, { userId, stopId })).data;
export const addSale      = async (userId: number, stopId: number, d: { product: string; quantity: number; price: number }) => (await legacy.post('/sales/add', { userId, stopId, ...d })).data;
export const getAnalytics = async (userId: number)                                                          => (await legacy.get(`/analytics/${userId}`)).data;

export default api;
