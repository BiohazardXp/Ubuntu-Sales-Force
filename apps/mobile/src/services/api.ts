import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change to your machine IP when testing on a physical device
// Android emulator: http://10.0.2.2:3000/api/v1
// Physical device:  http://192.168.x.x:3000/api/v1
export const API_URL = 'http://172.20.10.10:3000/api/v1';

const TOKEN_KEY = 'accessToken';
const USER_KEY  = 'currentUser';

export const storage = {
  getToken: ()            => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (t: string)   => AsyncStorage.setItem(TOKEN_KEY, t),
  getUser:  async ()      => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  },
  setUser:  (u: AuthUser) => AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearAll: ()            => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SUPERVISOR' | 'SALES_REP';

export interface AuthUser {
  id: string; username: string; email: string;
  firstName: string; lastName: string; phone: string | null;
  role: UserRole; territory: string | null; companyId: string | null; isActive: boolean;
}
export interface LoginResponse { accessToken: string; user: AuthUser; }
export type StopStatus = 'PENDING' | 'VISITED' | 'SKIPPED';
export interface Stop {
  id: string; customerName: string; address: string; order: number;
  status: StopStatus; visitedAt: string | null; lat: number | null; lng: number | null; notes: string | null;
}
export interface Route { id: string; date: string; name: string | null; stops: Stop[]; }
export interface Attendance { id: string; date: string; clockIn: string | null; clockOut: string | null; status: 'PRESENT' | 'LATE' | 'ABSENT'; }
export interface Sale { id: string; product: string; quantity: number; unitPrice: number; total: number; createdAt: string; }

// ── Axios ─────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

api.interceptors.request.use(async config => {
  const token = await storage.getToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> =>
    (await api.post<LoginResponse>('/auth/login', { username, password })).data,
  me: async (): Promise<AuthUser> => (await api.get<AuthUser>('/auth/me')).data,
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  today:    async () => (await api.get<Attendance | null>('/attendance/today')).data,
  clockIn:  async (d?: { lat?: number; lng?: number }) => (await api.post<Attendance>('/attendance/clock-in', d ?? {})).data,
  clockOut: async (d?: { lat?: number; lng?: number }) => (await api.post<Attendance>('/attendance/clock-out', d ?? {})).data,
};

// ── Routes ────────────────────────────────────────────────────────────────────
export const routesApi = {
  myToday:    async () => (await api.get<Route | null>('/routes/my/today')).data,
  updateStop: async (stopId: string, d: { status: StopStatus; lat?: number; lng?: number }) =>
    (await api.patch<Stop>(`/routes/stops/${stopId}`, d)).data,
};

// ── Sales ─────────────────────────────────────────────────────────────────────
export const salesApi = {
  myToday: async () => (await api.get<{ sales: Sale[]; total: number; count: number }>('/sales/my/today')).data,
  create:  async (d: { product: string; quantity: number; unitPrice: number; stopId?: string; lat?: number; lng?: number; localId?: string }) =>
    (await api.post<Sale>('/sales', d)).data,
  sync:    async (sales: any[]) => (await api.post('/sales/sync', { sales })).data,
};

// ── Location ──────────────────────────────────────────────────────────────────
export const locationApi = {
  ping:     async (d: { lat: number; lng: number; accuracy?: number; battery?: number }) => (await api.post('/location/ping', d)).data,
  bulkPing: async (pings: { lat: number; lng: number }[]) => (await api.post('/location/ping/bulk', { pings })).data,
};

export default api;
