'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VenueDetailPage() {
  const router = useRouter();

  useEffect(() => {
    // Karena MahjongYuks beroperasi di satu lokasi tunggal (Game House),
    // seluruh rute id dialihkan langsung ke halaman utama informasi lokasi.
    router.replace('/venues');
  }, [router]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#5A675E', fontSize: '14px' }}>Mengalihkan ke informasi lokasi Game House...</p>
    </div>
  );
}
