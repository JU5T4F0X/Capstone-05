'use client';

import React from 'react';

const HOW_IT_WORKS_STEPS = [
  {
    stepNumber: 'Langkah 01',
    title: 'Pilih Jadwal & Sesi Bermain',
    description: 'Pilih jadwal dan venue yang Anda inginkan, mulai dari sesi santai hingga event komunitas berperingkat. Peralatan ubin dan meja telah disediakan.',
  },
  {
    stepNumber: 'Langkah 02',
    title: 'Reservasi Meja & Kursi',
    description: 'Pilih kursi mata angin pada meja yang tersedia. Regulasi MahjongYuks memastikan meja terisi lengkap agar permainan dapat segera dimulai.',
  },
  {
    stepNumber: 'Langkah 03',
    title: 'Tiba & Mulai Pertandingan',
    description: 'Tunjukkan kode pemesanan saat tiba di venue. Meja otomatis dengan sistem pencatatan skor resmi siap digunakan bersama 4 pemain lengkap.',
  },
];

export default function HowItWorks() {
  return (
    <section id="panduan" className="landing-section landing-section-alt">
      <div className="landing-container">
        {/* Section Header */}
        <div style={{ maxWidth: '640px', marginBottom: '40px' }}>
          <div className="landing-section-subtitle">
            Alur Kunjungan Bermain
          </div>
          <h2 className="landing-section-title">
            Cara Memulai di Mahjongyuks
          </h2>
          <p className="landing-section-desc">
            Pengalaman bermain modern yang inklusif. Anda tidak perlu membawa peralatan pribadi maupun menghafal seluruh aturan sebelum datang.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="landing-steps-grid">
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <div key={idx} className="landing-step-item">
              <div className="landing-step-num">
                {step.stepNumber}
              </div>
              <h3 className="landing-step-title">
                {step.title}
              </h3>
              <p className="landing-step-desc">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
