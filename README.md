<p align="center">
  <img src="docs/assets/logo.png" alt="MahjongYuks Logo" width="220" />
</p>

<h1 align="center">MahjongYuks — Integrated Web Platform</h1>

<p align="center">
  <strong>Sistem Informasi Terintegrasi Multi-Venue MahjongYuks: Informasi Venue & Event, Reservasi Meja & Kursi, Simulasi Pembayaran, Check-in, Sesi Permainan, dan Leaderboard</strong><br>
  <em>Capstone Design Project — Program Studi S1 Sistem Informasi, Fakultas Rekayasa Industri, Universitas Telkom Jakarta</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Auth-Laravel%20Sanctum-004F27?style=flat-square" alt="Sanctum Auth" />
</p>

---

## Daftar Isi
1. [Tentang Proyek](#tentang-proyek)
2. [Fitur Utama Sistem](#fitur-utama-sistem)
3. [Arsitektur Sistem & Alur Data](#arsitektur-sistem--alur-data)
4. [Desain Database & ERD Resmi](#desain-database--erd-resmi)
5. [Tech Stack & Spesifikasi](#tech-stack--spesifikasi)
6. [Prasyarat Sistem (Prerequisites)](#prasyarat-sistem-prerequisites)
7. [Panduan Instalasi Langkah Demi Langkah (Getting Started)](#panduan-instalasi-langkah-demi-langkah)
   - [Langkah 1: Database MySQL](#1-persiapan-database-mysql)
   - [Langkah 2: Setup Backend (Laravel API)](#2-setup-backend-laravel-api)
   - [Langkah 3: Setup Frontend (Next.js)](#3-setup-frontend-nextjs)
8. [Referensi Konfigurasi Environment (`.env`)](#referensi-konfigurasi-environment)
9. [Akun Pengujian (Seeder Credentials)](#akun-pengujian-seeder-credentials)
10. [Dokumentasi Rute Web & REST API](#dokumentasi-rute-web--rest-api)
11. [Struktur Direktori Codebase](#struktur-direktori-codebase)
12. [Troubleshooting & Solusi Error](#troubleshooting--solusi-error)
13. [Tim Pengembang & Pembagian Modul](#tim-pengembang--pembagian-modul)
14. [Standar & Kepatuhan Regulasi](#standar--kepatuhan-regulasi)

---

## Tentang Proyek

**MahjongYuks** adalah sistem informasi berbasis web terintegrasi yang dirancang untuk mengelola operasional game house multi-venue MahjongYuks. Lokasi utama MahjongYuks berpusat dan berbagi tempat dengan **Alicia Bakery Sedayu City** (Sedayu City Kelapa Gading, Jakarta Utara) serta bekerja sama dengan lokasi venue mitra saat menyelenggarakan event.

Dalam operasional permainannya:
- **Toko Utama (Alicia Bakery Sedayu City)**: Menggunakan fasilitas **meja otomatis**.
- **Event di Luar Toko Utama**: Menggunakan **set mahjong biasa / manual** untuk kegiatan komunitas dan turnamen di venue mitra.

Sistem ini dikembangkan sebagai **Capstone Design Project** program studi S1 Sistem Informasi Universitas Telkom Jakarta untuk menggantikan proses pencatatan manual dan mendigitalisasi alur operasional MahjongYuks:
- Manajemen informasi venue dan jadwal event
- Reservasi meja dan pemilihan kursi secara real-time antar pemain (maksimal 4 pemain per meja)
- Simulasi pembayaran booking dan monitoring/verifikasi pembayaran oleh admin
- Konfirmasi check-in kehadiran pemain di venue dengan pencatatan timestamp otomatis
- Pengelolaan sesi permainan oleh admin (mode *Casual* untuk bermain santai tanpa pencatatan poin, dan mode *Competitive* dengan pencatatan poin)
- Pencatatan skor hasil permainan dan akumulasi poin pada leaderboard pemain

---

## Fitur Utama Sistem

Sistem mencakup 8 Requirement Fungsional (RF) sesuai dokumen spesifikasi Capstone:

| Kode RF | Modul | Deskripsi Fungsional |
|---|---|---|
| **RF-01** | **Manajemen Pengguna & Autentikasi** | Registrasi dan login pengguna dengan hash password bcrypt, token autentikasi Laravel Sanctum, dan pembatasan hak akses berbasis peran (*Role-Based Access Control* antara Admin dan Player). Pemain dapat mengelola profil pribadinya. |
| **RF-02** | **Informasi Venue & Event** | Admin mengelola data venue (nama, lokasi, kapasitas) dan event. Pemain dapat melihat katalog event dan venue yang tersedia beserta status ketersediaan meja. |
| **RF-03** | **Reservasi Meja & Kursi (Seat Booking)** | Pemain memilih jadwal, meja, dan kursi. Validasi kapasitas meja dibatasi **maksimal 4 pemain per meja** pada backend dan frontend. Pemain dapat melihat riwayat booking miliknya. |
| **RF-04** | **Simulasi Pembayaran** | Mekanisme pembayaran simulasi untuk setiap booking dengan pencatatan status (*pending*, *paid*, *failed*), serta dashboard verifikasi dan monitoring pembayaran untuk admin. |
| **RF-05** | **Check-in Kehadiran** | Pemain melakukan konfirmasi kehadiran di venue dengan pencatatan waktu (*timestamp*) otomatis yang tersimpan dalam riwayat booking. |
| **RF-06** | **Pengelolaan Sesi Permainan** | Admin membuat sesi permainan pada meja yang telah terisi pemain, memulai sesi (*ongoing*), dan menutup sesi (*closed*). Setiap sesi terhubung ke meja, jadwal, dan pemain yang hadir. |
| **RF-07** | **Pencatatan Hasil Permainan & Skor** | Admin menginput skor/poin untuk tiap pemain dalam sesi permainan (khusus mode *Competitive*). Riwayat hasil tersimpan dalam Game History. |
| **RF-08** | **Leaderboard & Game History** | Pemain dapat melihat riwayat permainan pribadi (*Game History*) dan peringkat pemain (*Leaderboard*) berdasarkan akumulasi poin dari skor permainan. |

---

## Arsitektur Sistem & Alur Data

Sistem menerapkan arsitektur **Monolithic Codebase Terpisah** (*Decoupled Frontend & Backend*) dengan komunikasi standar **RESTful API**:

```
 ┌──────────────────────────────────────────────────────────────┐
 │                      Klien (Web Browser)                     │
 │              Smartphone, Tablet, Desktop Laptop              │
 └──────────────────────────────┬───────────────────────────────┘
                                │ HTTP / HTTPS
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             FRONTEND: Next.js 16 (TypeScript)                │
 │   • App Router (/app)       • React Hooks & Context State    │
 │   • Centralized ApiClient   • Styling Vanilla CSS / Tailwind │
 └──────────────────────────────┬───────────────────────────────┘
                                │ JSON REST API (Bearer Token)
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │             BACKEND: Laravel 11 MVC (PHP 8.2+)               │
 │   • routes/api.php          • Controllers & FormRequests     │
 │   • Sanctum Token Guard     • Eloquent ORM Models            │
 └──────────────────────────────┬───────────────────────────────┘
                                │ MySQL Driver (Port 3306)
                                ▼
 ┌──────────────────────────────────────────────────────────────┐
 │                 DATABASE: MySQL 8.x / MariaDB                │
 │           10 Tabel Relasional Sesuai ERD Resmi Capstone      │
 └──────────────────────────────────────────────────────────────┘
```

---

## Desain Database & ERD Resmi

Skema database didasarkan pada **Class Diagram resmi (Visual Paradigm)** proyek Capstone:

<p align="center">
  <img src="docs/assets/erd.png" alt="ERD Resmi MahjongYuks" width="750" />
</p>

### Kamus Entitas & Relasi Data

```
User (Parent)
 ├── Player (Subtype, 1-to-1 dengan User)
 └── Admin  (Subtype, 1-to-1 dengan User)

Venue ─── (1:N) ─── Meja (Kapasitas maks: 4 pemain)
Event (Standalone / Dikaitkan ke Meja & Venue)

Player ─────── (1:N) ─── Pemesanan ─── (N:1) ─── Meja
Pemesanan ──── (1:1) ─── Pembayaran
Pemesanan ──── (1:N) ─── Detail_Pemesanan (Peserta per booking & status kehadiran)
Pemesanan ──── (1:1) ─── Sesi_Bermain
Sesi_Bermain ─ (1:N) ─── Skor_Pemain (Skor & peringkat pemain per sesi)
```

> **Aturan Bisnis & Basis Data**:
> 1. **Kapasitas Meja**: Maksimal **4 pemain per meja** — validasi wajib di backend (`pemesanans.jumlah_pemain`) dan frontend.
> 2. **Jadwal Permainan**: Informasi jadwal melekat pada entitas `pemesanans` (`tanggal_main`, `waktu_mulai`, `waktu_selesai`).
> 3. **Subtype User**: Pembeda hak akses utama menggunakan kolom `role` (`player` / `admin`) pada tabel `users`.
> 4. **Leaderboard**: Diambil dari akumulasi nilai `skor_pemains` berdasarkan `player_id`.
> 5. **Simulasi Pembayaran**: Pembayaran bersifat simulasi (tidak menggunakan payment gateway riil).

---

## Tech Stack & Spesifikasi

### Frontend (`frontend/`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library UI**: React 19, TypeScript
- **Styling**: CSS & Tailwind
- **State Management**: React Context (`AuthContext.tsx`) + LocalStorage Session
- **HTTP Client**: Centralized Fetch API Client (`src/lib/api.ts`)

### Backend (`mahjongyuks/`)
- **Framework**: [Laravel 11](https://laravel.com/)
- **Pola Desain**: MVC (Model-View-Controller)
- **Standar Bahasa**: PHP 8.2+ (Mengikuti standar PSR-12)
- **Otentikasi**: Token-based menggunakan **Laravel Sanctum**
- **Enkripsi Sandi**: bcrypt
- **Database Engine**: MySQL 8.x (Storage Engine: InnoDB, Collation: `utf8mb4_unicode_ci`)

---

## Prasyarat Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan perangkat Anda telah terpasang:

| Perangkat Lunak | Versi Minimal | Fungsi Utama |
|---|---|---|
| **PHP** | `>= 8.2` | Runtime backend Laravel (Ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `curl`) |
| **Composer** | `>= 2.x` | Dependency manager pustaka PHP |
| **Node.js** | `>= 18.x` | Runtime frontend Next.js |
| **npm** | `>= 9.x` | Package manager JavaScript/TypeScript |
| **MySQL Server** | `>= 8.0` / MariaDB | Database relasional (bisa via XAMPP, Laragon, Docker, atau Standalone) |
| **Git** | `>= 2.x` | Version control system |

---

## Panduan Instalasi Langkah Demi Langkah

### 1. Persiapan Database MySQL
1. Buka control panel **XAMPP** atau **Laragon**, lalu nyalakan service **MySQL** (port default `3306`).
2. Buat database baru bernama `mahjongyuks`:
   - **Via Terminal**:
     ```bash
     mysql -u root -e "CREATE DATABASE IF NOT EXISTS mahjongyuks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
     ```
   - **Via phpMyAdmin**: Buka `http://localhost/phpmyadmin`, buat database `mahjongyuks`.

---

### 2. Setup Backend (Laravel API)

Buka terminal di root repository `Capstone-05/`:

```bash
# 1. Pindah ke direktori backend
cd mahjongyuks

# 2. Pasang dependensi PHP via Composer
composer install

# 3. Salin file environment konfigurasi
cp .env.example .env

# 4. Generate application key
php artisan key:generate
```

#### Pengaturan Database di `.env`:
Buka file `mahjongyuks/.env`, pastikan konfigurasi berikut sesuai:
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mahjongyuks
DB_USERNAME=root
DB_PASSWORD=
```
*(Sesuaikan `DB_PASSWORD` jika MySQL Anda memiliki kata sandi)*.

#### Eksekusi Migrasi & Data Seeder:
Jalankan perintah ini untuk membangun 10 tabel ERD dan mengisi data awal (pengguna, venue Alicia Bakery Sedayu City, meja, event, dan pemain):
```bash
php artisan migrate:fresh --seed
```

#### Jalankan Server API Backend:
```bash
php artisan serve
```
> Server REST API aktif di: **`http://localhost:8000`** *(Biarkan terminal ini tetap menyala)*.

---

### 3. Setup Frontend (Next.js)

Buka **jendela terminal baru** (tanpa menutup terminal backend):

```bash
# 1. Pindah ke direktori frontend
cd frontend

# 2. Pasang dependensi Node.js
npm install

# 3. Buat file environment konfigurasi frontend
cp .env.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
```

Pastikan file `frontend/.env.local` berisi:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### Jalankan Server Pengembangan:
```bash
npm run dev
```
> Website MahjongYuks dapat diakses di: **`http://localhost:3000`**.

---

## Referensi Konfigurasi Environment

### Backend (`mahjongyuks/.env`)
| Variabel | Tipe Data | Nilai Default | Keterangan |
|---|---|---|---|
| `APP_NAME` | String | `MahjongYuks` | Nama aplikasi di Laravel |
| `APP_ENV` | String | `local` | Lingkungan runtime (`local`/`production`) |
| `APP_URL` | URL | `http://localhost:8000` | Base URL server backend |
| `DB_CONNECTION` | String | `mysql` | Driver database |
| `DB_PORT` | Integer | `3306` | Port listening MySQL server |
| `DB_DATABASE` | String | `mahjongyuks` | Nama skema database |
| `DB_USERNAME` | String | `root` | Username akun MySQL |
| `DB_PASSWORD` | String | `""` (kosong) | Password akun MySQL |

### Frontend (`frontend/.env.local`)
| Variabel | Tipe Data | Nilai Default | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL | `http://localhost:8000/api` | Target endpoint REST API backend |

---

## Akun Pengujian (Seeder Credentials)

Database seeder menyediakan kredensial awal untuk pengujian fitur:

### 1. Akun Pemain (Player)
- **Halaman Masuk**: `http://localhost:3000/login`
- **Email**: `kevin.sanjaya@mahjongyuks.id`
- **Kata Sandi**: `password123`
- **Role**: `player`
- **Fitur Tersedia**: Reservasi meja & kursi, check-in kehadiran, riwayat booking, game history, leaderboard.

### 2. Akun Admin / Operasional
- **Halaman Masuk**: `http://localhost:3000/admin/login`
- **Email Admin**: `admin@mahjongyuks.id` *(atau `admin.sedayu@mahjongyuks.id`)*
- **Kata Sandi**: `password123`
- **Role**: `admin`
- **Fitur Tersedia**: Verifikasi pembayaran simulasi, manajemen venue & event, monitoring meja, kontrol sesi bermain, input skor pemain.

---

## Dokumentasi Rute Web & REST API

### 1. Halaman Web Antarmuka (`http://localhost:3000`)
| Path URL | Halaman | Hak Akses | Keterangan |
|---|---|---|---|
| `/` | **Landing Page** | Publik | Informasi MahjongYuks, venue utama Alicia Bakery Sedayu City & venue mitra, jadwal event, dan papan leaderboard. |
| `/login` | **Login Pemain** | Publik | Form masuk pemain menggunakan email dan password. |
| `/register` | **Registrasi Pemain** | Publik | Pendaftaran akun pemain baru. |
| `/dashboard` | **Dashboard Pemain** | Pemain (`player`) | Reservasi meja & kursi, check-in kehadiran, riwayat pemesanan, dan game history. |
| `/admin/login` | **Login Admin** | Staf Admin | Pintu masuk khusus pengelola operasional MahjongYuks. |
| `/admin/dashboard` | **Dashboard Admin** | Admin (`admin`) | Verifikasi pembayaran, manajemen venue/event/meja, pembuatan & penutupan sesi permainan, input skor. |

### 2. Rute REST API Laravel (`http://localhost:8000/api`)

#### Autentikasi Pengguna (`/api/auth`)
| Method | Endpoint | Proteksi | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Mendaftarkan pemain baru & mengembalikan token sesi |
| `POST` | `/api/auth/login` | Publik | Autentikasi kredensial pengguna, mengembalikan Bearer Token |
| `POST` | `/api/auth/logout` | `auth:sanctum` | Revoke token aktif dan menutup sesi |
| `GET` | `/api/auth/me` | `auth:sanctum` | Mengambil data profil pengguna yang sedang login |

#### Format Respons Standar JSON
```json
// Respons Sukses (HTTP 200/201)
{
  "success": true,
  "message": "Operasi berhasil diselesaikan",
  "data": { ... }
}

// Respons Error (HTTP 400/401/422/500)
{
  "success": false,
  "message": "Validasi gagal / Kredensial tidak valid",
  "errors": { ... }
}
```

---

## Struktur Direktori Codebase

```
Capstone-05/
├── README.md               # Dokumentasi resmi proyek (Tech Docs & Setup Guide)
├── AGENTS.md               # Sumber kebenaran arsitektur & requirement proyek
├── docs/
│   └── assets/
│       ├── erd.png         # Class Diagram ERD resmi
│       └── logo.png        # Logo resmi MahjongYuks
├── frontend/               # [Next.js Frontend]
│   ├── public/             # Aset statis & gambar
│   │   ├── assets/         # Logo resmi mahjongyuks_logo.png
│   │   └── landing/        # Aset gambar landing page
│   ├── src/
│   │   ├── app/            # Halaman Next.js App Router
│   │   │   ├── page.tsx    # Landing page publik
│   │   │   ├── login/      # Halaman login pemain
│   │   │   ├── register/   # Halaman registrasi anggota
│   │   │   ├── dashboard/  # Dashboard pemain
│   │   │   └── admin/      # Portal operasional admin
│   │   ├── context/        # React AuthContext (Session state management)
│   │   └── lib/            # Centralized API Client (ApiClient)
│   ├── package.json
│   └── tsconfig.json
└── mahjongyuks/            # [Laravel 11 REST API Backend]
    ├── app/
    │   ├── Http/Controllers/Api/ # Controller autentikasi & entitas API
    │   └── Models/               # Model Eloquent (User, Player, Venue, Meja, dll)
    ├── database/
    │   ├── migrations/           # 10 skema migrasi tabel ERD resmi
    │   └── seeders/              # DatabaseSeeder akun pengujian, venue, & meja
    ├── routes/
    │   └── api.php               # Definisi route REST API
    ├── composer.json
    └── artisan
```

---

## Troubleshooting & Solusi Error

### 1. `SQLSTATE[HY000] [2002] Connection refused`
- **Penyebab**: Service database MySQL belum aktif di sistem lokal Anda.
- **Solusi**: Nyalakan service MySQL pada panel XAMPP atau Laragon. Jika menggunakan port selain `3306`, sesuaikan `DB_PORT` di file `mahjongyuks/.env`.

### 2. `Table 'mahjongyuks.users' doesn't exist`
- **Penyebab**: Tabel database belum dimigrasikan dari file skema Laravel.
- **Solusi**: Jalankan perintah migrasi dan seeder:
  ```bash
  cd mahjongyuks
  php artisan migrate:fresh --seed
  ```

### 3. Port `3000` atau `8000` Sudah Terpakai (*Address already in use*)
- **Solusi (Linux/macOS)**:
  ```bash
  fuser -k 3000/tcp
  fuser -k 8000/tcp
  ```
- **Solusi (Windows)**: Hentikan proses Node.js atau PHP yang sedang berjalan melalui Task Manager.

---

## Tim Pengembang & Pembagian Modul

Proyek Capstone Design — S1 Sistem Informasi, Fakultas Rekayasa Industri, Universitas Telkom Jakarta:

| NIM | Nama Mahasiswa | Tanggung Jawab Modul / PIC | Sprint Agile |
|---|---|---|---|
| **102042300070** | **Denis Hendri Wawo** | Auth & Pemesanan Kursi | Sprint 1 & Sprint 3 |
| **102042300039** | **Lujeng LuthFiyah** | Manajemen Informasi Event & Venue | Sprint 2 |
| **102042300005** | **Zabila Nanda Irawan** | Simulasi Pembayaran & Verifikasi Admin | Sprint 4 |
| **102042300204** | **Sarah Dinda Siregar** | Leaderboard & Game History | Sprint 6 |

---

## Standar & Kepatuhan Regulasi

Pengembangan sistem informasi MahjongYuks mengacu pada standar teknis dan hukum yang berlaku:
- **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**: Perlindungan data pribadi pengguna (nama, email, no. telepon, riwayat reservasi) dengan kontrol hak akses berbasis peran.
- **PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE)**: Perekaman transaksi reservasi, timestamp check-in kehadiran, dan pencatatan hasil permainan secara akuntabel.
- **ISO/IEC 27001 (CIA Triad)**: Penegakan kerahasiaan (*Confidentiality* via bcrypt), keutuhan data (*Integrity* via validasi di frontend dan backend), serta keandalan layanan (*Availability*).
- **Prinsip Operasional Komunitas**: MahjongYuks dikelola sebagai ruang permainan strategi dan hiburan komunitas tanpa unsur perjudian.

---

<p align="center">
  <sub>© 2025 MahjongYuks Indonesia • Telkom University Jakarta Capstone Project • All Rights Reserved.</sub>
</p>
