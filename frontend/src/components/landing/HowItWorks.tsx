'use client';

import React from 'react';
import { HOW_IT_WORKS_STEPS } from '@/lib/mock-data';

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
