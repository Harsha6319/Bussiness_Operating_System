import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('ai_bos_access_token')));

  useEffect(() => {
    if (!loading) return;
    endpoints.auth.me()
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('ai_bos_access_token'))
      .finally(() => setLoading(false));
  }, [loading]);

  async function login(payload) {
    const { data } = await endpoints.auth.login(payload);
    localStorage.setItem('ai_bos_access_token', data.accessToken);
    setUser(data.user);
  }

  async function register(payload) {
    const { data } = await endpoints.auth.register(payload);
    localStorage.setItem('ai_bos_access_token', data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await endpoints.auth.logout().catch(() => null);
    localStorage.removeItem('ai_bos_access_token');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, isAuthenticated: Boolean(user) }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
