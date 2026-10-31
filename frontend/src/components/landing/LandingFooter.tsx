'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SOCIAL_LINKS } from '@/lib/site-config';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  // Social media definitions with inline SVG icons (20px)
  const socialList = [
    {
      name: 'instagram',
      label: 'Instagram MahjongYuks',
      href: SOCIAL_LINKS.instagram,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      name: 'tiktok',
      label: 'TikTok MahjongYuks',
      href: SOCIAL_LINKS.tiktok,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.34V8.45a8.16 8.16 0 0 0 3.91 1.09V6.69z" />
        </svg>
      ),
    },
    {
      name: 'youtube',
      label: 'YouTube MahjongYuks',
      href: SOCIAL_LINKS.youtube,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'whatsapp',
      label: 'WhatsApp MahjongYuks',
      href: SOCIAL_LINKS.whatsapp,
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
  ];

  // Only display platforms with non-empty URLs
  const activeSocials = socialList.filter(
    (item) => typeof item.href === 'string' && item.href.trim() !== ''
  );

  return (
    <footer className="landing-footer-minimal" role="contentinfo">
      <div className="landing-container">
        <div className="landing-footer-inner">
          {/* 1. Logo MahjongYuks (Rata Tengah Sempurna) */}
          <Link href="/" className="landing-footer-logo-link" aria-label="Beranda MahjongYuks">
            <Image
              src="/assets/mahjongyuks_logo.png"
              alt="Logo MahjongYuks"
              width={180}
              height={60}
              style={{ objectFit: 'contain', height: '60px', width: 'auto' }}
              priority={false}
            />
          </Link>

          {/* 2. Tagline Resmi */}
          <p className="landing-footer-tagline">
            Platform reservasi meja &amp; turnamen Riichi Mahjong resmi di Indonesia.
          </p>

          {/* 3. Baris Ikon Media Sosial (Hanya yang memiliki tautan valid) */}
          {activeSocials.length > 0 && (
            <div className="landing-footer-social-row" aria-label="Media Sosial MahjongYuks">
              {activeSocials.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-footer-social-btn"
                  aria-label={item.label}
                  title={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          )}

          {/* 4. Garis Pemisah Tipis */}
          <div className="landing-footer-divider" />

          {/* 5. Teks Hak Cipta */}
          <p className="landing-footer-copyright">
            &copy; {currentYear} MahjongYuks. Hak cipta dilindungi undang-undang.
          </p>
        </div>
      </div>
    </footer>
  );
}
