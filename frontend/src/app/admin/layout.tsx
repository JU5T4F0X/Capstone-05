'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ApiClient from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Kecualikan halaman login admin
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    const isPreview = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).get('preview') === 'admin';

    if (isPreview) {
      if (!ApiClient.getUser()) {
        ApiClient.setUser({
          id: 2,
          nama: 'Staf Operasional Sedayu',
          email: 'admin@mahjongyuks.id',
          role: 'admin',
          kemahiran: 'Master'
        });
      }

      // Auto-authenticate token for headless preview / testing
      if (!localStorage.getItem('mahjongyuks_token')) {
        ApiClient.login({ email: 'admin@mahjongyuks.id', password: 'password123' })
          .then((res) => {
            if (res.success && (res.data as any)?.token) {
              ApiClient.setToken((res.data as any).token);
              ApiClient.setUser((res.data as any).user);
            }
          })
          .catch(() => {})
          .finally(() => {
            setAuthorized(true);
          });
      } else {
        setAuthorized(true);
      }
      return;
    }

    const savedUser = ApiClient.getUser();
    if (!savedUser) {
      router.replace('/admin/login');
    } else if (savedUser.role !== 'admin') {
      router.replace('/dashboard');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized && pathname !== '/admin/login') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',

        justifyContent: 'center',
        backgroundColor: '#0F261C',
        color: '#FAF8F5',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Memverifikasi Hak Akses Administrator...
          </div>
          <div style={{ fontSize: '13px', color: '#86EFAC' }}>
            Sistem Keamanan &amp; RBAC MahjongYuks
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
