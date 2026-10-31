'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LogIn, Calendar } from 'lucide-react';

interface CtaBannerProps {
  onSecureBooking: (target?: string) => void;
}

export default function CtaBanner({ onSecureBooking }: CtaBannerProps) {
  return (
    <section id="komunitas" className="landing-section">
      <div className="landing-container">
        <div className="landing-cta-banner">
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 className="landing-cta-title">
              Siap Menikmati Pengalaman Bermain yang Lebih Baik?
            </h2>

            <p className="landing-cta-desc">
              Pesan kursi Anda di Game House, ikuti turnamen resmi berstandar WRC, atau mulai belajar dari nol bersama pelatih kami.
            </p>

            <div className="landing-cta-actions">
              <button
                type="button"
                onClick={() => onSecureBooking('Reservasi Kursi')}
                className="landing-btn-gold"
              >
                <Calendar size={16} />
                <span>Reservasi Kursi Sekarang</span>
                <ArrowRight size={15} />
              </button>

              <Link href="/login" className="landing-btn-white-outline">
                <LogIn size={15} />
                <span>Masuk ke Akun</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
