'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiClient, { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email?: string; password?: string; no_telepon?: string; identifier?: string; role?: 'player' | 'admin' }) => Promise<{ success: boolean; message?: string }>;
  register: (data: { nama: string; email: string; password?: string; no_telepon?: string; handle?: string; kemahiran?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setDemoUser: (role: 'player' | 'admin') => void;
}

const defaultPlayerUser: User = {
  id: 841,
  nama: 'Kevin Sanjaya',
  email: 'kevin.sanjaya@mahjongyuks.id',
  no_telepon: '081234567890',
  role: 'player',
  handle: 'Kevin_S',
  dan_rank: 'DAN 5',
  points: 14850,
  avatar_url: '/assets/avatar_kevin.jpg',
};

const defaultAdminUser: User = {
  id: 42,
  nama: 'Staf Operasional Sedayu',
  email: 'admin.sedayu@mahjongyuks.id',
  no_telepon: '081987654321',
  role: 'admin',
  handle: 'ADM-JKT-042',
  avatar_url: '/assets/avatar_kevin.jpg',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage if available
    const savedUser = ApiClient.getUser();
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('mahjongyuks_token') : null;

    if (savedUser && savedToken) {
      setUser(savedUser);
      setTokenState(savedToken);
    } else {
      setUser(null);
      setTokenState(null);
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email?: string; password?: string; no_telepon?: string; identifier?: string; role?: 'player' | 'admin' }) => {
    setLoading(true);
    try {
      const response = await ApiClient.login(credentials);
      if (response.success && response.data?.token) {
        ApiClient.setToken(response.data.token);
        ApiClient.setUser(response.data.user);
        setUser(response.data.user);
        setTokenState(response.data.token);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return {
          success: false,
          message: response.message || 'Email / ID atau kata sandi tidak valid. Silakan periksa kembali.',
        };
      }
    } catch (err: any) {
      setLoading(false);
      return {
        success: false,
        message: err.message || 'Gagal terhubung ke server backend.',
      };
    }
  };

  const register = async (data: { nama: string; email: string; password?: string; no_telepon?: string; handle?: string; kemahiran?: string }) => {
    setLoading(true);
    try {
      const response = await ApiClient.register({
        nama: data.nama,
        email: data.email,
        password: data.password || '',
        no_telepon: data.no_telepon,
        handle: data.handle,
        kemahiran: data.kemahiran,
      });

      if (response.success && response.data?.token) {
        ApiClient.setToken(response.data.token);
        ApiClient.setUser(response.data.user);
        setUser(response.data.user);
        setTokenState(response.data.token);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return {
          success: false,
          message: response.message || 'Registrasi gagal. Silakan periksa kembali data Anda.',
        };
      }
    } catch (err: any) {
      setLoading(false);
      return { success: false, message: err.message || 'Gagal melakukan registrasi' };
    }
  };

  const logout = () => {
    ApiClient.clearToken();
    setUser(null);
    setTokenState(null);
  };

  const setDemoUser = (role: 'player' | 'admin') => {
    const target = role === 'admin' ? defaultAdminUser : defaultPlayerUser;
    setUser(target);
    ApiClient.setUser(target);
    ApiClient.setToken('demo_token');
    setTokenState('demo_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
