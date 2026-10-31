import type { Metadata } from 'next';
import './globals.css';
import '@/components/landing/landing.css';
import { AuthProvider } from '@/context/AuthContext';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'MahjongYuks — Gamehouse Community & Esports Parlor',
  description: 'Sistem Terpadu Reservasi Meja, Turnamen, Leaderboard & Sesi Bermain Mahjongyuks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <div className="site-wrapper">
            <main className="site-main">
              {children}
            </main>
            <LandingFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
