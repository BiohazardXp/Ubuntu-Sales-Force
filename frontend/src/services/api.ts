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
  companyId: string | null;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user:        AuthUser;
}

// Route / Stop types
export type StopStatus = 'PENDING' | 'VISITED' | 'SKIPPED';

export interface Stop {
  id:           string;
  customerName: string;
  address:      string;
  lat:          number | null;
  lng:          number | null;
  order:        number;
  status:       StopStatus;
  visitedAt:    string | null;
  notes:        string | null;
}

export interface Route {
  id:    string;
  date:  string;
  name:  string | null;
  notes: string | null;
  stops: Stop[];
}

// Sale types
export interface Sale {
  id:        string;
  product:   string;
  quantity:  number;
  unitPrice: number;
  total:     number;
  notes:     string | null;
  createdAt: string;
}

// Attendance types
export interface Attendance {
  id:        string;
  date:      string;
  clockIn:   string | null;
  clockOut:  string | null;
  status:    'PRESENT' | 'LATE' | 'ABSENT';
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance — NestJS API
// ─────────────────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenHelpers.get();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// On 401 — clear and redirect to login
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
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> =>
    (await api.post<LoginResponse>('/auth/login', { username, password })).data,
  me: async (): Promise<AuthUser> =>
    (await api.get<AuthUser>('/auth/me')).data,
  logout: () => { tokenHelpers.clearAll(); window.location.href = '/'; },
};

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  username: string; email: string; password: string;
  firstName: string; lastName: string;
  phone?: string; role?: UserRole; territory?: string;
}
export interface UpdateUserPayload extends Partial<CreateUserPayload> { isActive?: boolean; }

export const usersApi = {
  getAll:  async ():                              Promise<AuthUser[]>          => (await api.get('/users')).data,
  getOne:  async (id: string):                    Promise<AuthUser>            => (await api.get(`/users/${id}`)).data,
  create:  async (d: CreateUserPayload):          Promise<AuthUser>            => (await api.post('/users', d)).data,
  update:  async (id: string, d: UpdateUserPayload): Promise<AuthUser>         => (await api.patch(`/users/${id}`, d)).data,
  remove:  async (id: string):                    Promise<{ message: string }> => (await api.delete(`/users/${id}`)).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRoutePayload {
  userId: string;
  date:   string;
  name?:  string;
  notes?: string;
  stops:  {
    customerName: string;
    address:      string;
    order:        number;
    lat?:         number;
    lng?:         number;
    notes?:       string;
  }[];
}

export const routesApi = {
  // POST create a route + stops for a rep
  create: async (d: CreateRoutePayload): Promise<Route> =>
    (await api.post<Route>('/routes', d)).data,

  // GET today's route for the logged-in rep
  myToday: async (): Promise<Route | null> =>
    (await api.get<Route | null>('/routes/my/today')).data,

  // GET all routes today for the whole company (managers)
  companyToday: async (): Promise<Route[]> =>
    (await api.get<Route[]>('/routes/company/today')).data,

  // GET route history for a specific rep
  forRep: async (userId: string): Promise<Route[]> =>
    (await api.get<Route[]>(`/routes/rep/${userId}`)).data,

  // PATCH mark a stop as visited / skipped
  updateStop: async (
    stopId: string,
    data: { status: StopStatus; lat?: number; lng?: number; notes?: string },
  ): Promise<Stop> =>
    (await api.patch<Stop>(`/routes/stops/${stopId}`, data)).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sales
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSalePayload {
  product:    string;
  quantity:   number;
  unitPrice:  number;
  stopId?:    string;
  lat?:       number;
  lng?:       number;
  notes?:     string;
  localId?:   string;
}

export const salesApi = {
  create: async (d: CreateSalePayload): Promise<Sale> =>
    (await api.post<Sale>('/sales', d)).data,

  myToday: async (): Promise<{ sales: Sale[]; total: number; count: number }> =>
    (await api.get('/sales/my/today')).data,

  companyToday: async (): Promise<{ sales: Sale[]; total: number; count: number }> =>
    (await api.get('/sales/company/today')).data,

  summaryByRep: async (): Promise<{ userId: string; name: string; total: number; saleCount: number }[]> =>
    (await api.get('/sales/summary/reps')).data,

  sync: async (sales: CreateSalePayload[]): Promise<{ synced: number; sales: Sale[] }> =>
    (await api.post('/sales/sync', { sales })).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────────────────────

export const attendanceApi = {
  clockIn: async (data?: { lat?: number; lng?: number; notes?: string }): Promise<Attendance> =>
    (await api.post<Attendance>('/attendance/clock-in', data ?? {})).data,

  clockOut: async (data?: { lat?: number; lng?: number; notes?: string }): Promise<Attendance> =>
    (await api.post<Attendance>('/attendance/clock-out', data ?? {})).data,

  today: async (): Promise<Attendance | null> =>
    (await api.get<Attendance | null>('/attendance/today')).data,

  companyToday: async (): Promise<Attendance[]> =>
    (await api.get<Attendance[]>('/attendance/company/today')).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────────────────────────────────────

export const locationApi = {
  ping: async (data: { lat: number; lng: number; accuracy?: number; battery?: number }) =>
    (await api.post('/location/ping', data)).data,

  bulkPing: async (pings: { lat: number; lng: number; accuracy?: number; battery?: number }[]) =>
    (await api.post('/location/ping/bulk', { pings })).data,

  companyLatest: async () =>
    (await api.get('/location/company/latest')).data,

  repTrail: async (userId: string) =>
    (await api.get(`/location/rep/${userId}/trail`)).data,
};

export default api;
