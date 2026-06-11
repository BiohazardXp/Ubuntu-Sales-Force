import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { storage, API_URL } from '../services/api';
import type { AuthUser } from '../services/api';

interface AuthContextType {
  user:    AuthUser | null;
  loading: boolean;
  login:   (username: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from storage
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getToken();
        if (token) {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const me: AuthUser = await res.json();
            setUser(me);
            await storage.setUser(me);
          } else {
            await storage.clearAll();
          }
        }
      } catch {
        await storage.clearAll();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();
    console.log('Login response status:', res.status);
    console.log('Login response data:', JSON.stringify(data));
    if (!res.ok) throw { response: { data } };
    await storage.setToken(data.accessToken);
    await storage.setUser(data.user);
    setUser(data.user);
    router.replace('/(tabs)/home');
  };

  const logout = async () => {
    await storage.clearAll();
    setUser(null);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
