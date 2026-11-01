'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardBookingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pemesanan');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      fontFamily: 'sans-serif',
      color: '#183629'
    }}>
      <p>Mengalihkan ke modul Pemesanan &amp; Reservasi Meja...</p>
    </div>
  );
}
