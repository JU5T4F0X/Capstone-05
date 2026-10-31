import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        flex: '1 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
        minHeight: '60vh',
        backgroundColor: '#FAF8F5',
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '1px',
          color: '#B8860B',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        Kesalahan 404
      </span>
      <h1
        style={{
          fontSize: '56px',
          fontWeight: 800,
          color: '#183629',
          letterSpacing: '-1px',
          lineHeight: 1.1,
          marginBottom: '16px',
        }}
      >
        Halaman Tidak Ditemukan
      </h1>
      <p
        style={{
          fontSize: '15px',
          color: '#4A524D',
          maxWidth: '480px',
          lineHeight: 1.6,
          marginBottom: '32px',
        }}
      >
        Halaman yang Anda tuju mungkin telah dipindahkan, dinonaktifkan, atau alamat URL yang Anda masukkan kurang tepat.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          padding: '0 24px',
          backgroundColor: '#183629',
          color: '#FAF8F5',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '14px',
          textDecoration: 'none',
          transition: 'background-color 0.15s ease',
        }}
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}

