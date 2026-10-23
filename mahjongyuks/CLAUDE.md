# MahjongYuks — Backend Guidelines

> **WAJIB**: Baca dulu `../AGENTS.md` (root project) sebelum menulis kode apapun.
> File itu adalah sumber kebenaran utama untuk arsitektur, requirement, dan konvensi proyek ini.

---

## Konteks

Folder ini adalah **backend Laravel (PHP)** untuk proyek MahjongYuks.
Frontend berada di `../frontend/` (Next.js TypeScript).
Backend ini berfungsi **hanya sebagai REST API** — tidak ada Blade view untuk halaman web.

---

## Setup

```bash
composer install
cp .env.example .env
# Edit .env: isi DB_CONNECTION=mysql, DB_DATABASE, DB_USERNAME, DB_PASSWORD
php artisan key:generate
php artisan migrate --seed
php artisan serve
# Berjalan di http://localhost:8000
```

Pastikan PHP >= 8.2 dan Composer tersedia:
```bash
php -v
composer -V
```

---

## Aturan Backend — Wajib Diikuti

### 1. Struktur Folder
```
app/
├── Http/
│   ├── Controllers/Api/    # API Controllers (hanya logika HTTP)
│   ├── Requests/           # FormRequest untuk validasi input
│   └── Resources/          # API Resource transformers (format JSON response)
├── Models/               # Eloquent Models
└── Services/             # Business logic (dipanggil dari controller)

routes/
└── api.php               # Semua route API (prefix /api)
```

### 2. Response Format Standar
Selalu kembalikan response dalam format berikut:

Success:
```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": { ... }
}
```
Error:
```json
{
  "success": false,
  "message": "Pesan error",
  "errors": { ... }
}
```

### 3. Autentikasi
- Gunakan **Laravel Sanctum** untuk token-based auth
- Semua route yang butuh auth: middleware `auth:sanctum`
- Role check: middleware kustom atau Gate/Policy
- Header: `Authorization: Bearer {token}`

### 4. Validasi
- **WAJIB** gunakan `FormRequest` untuk semua validasi input
- Jangan validasi manual di controller

### 5. Database
- Selalu gunakan **migration** untuk perubahan schema
- Gunakan **Eloquent ORM** — jangan raw query SQL kecuali sangat perlu
- Semua model harus punya `$fillable` terdefinisi
- Seed data dengan **Seeder** + **Factory**

### 6. Coding Standard
- Ikuti **PSR-12**
- Controller hanya berisi logika HTTP
- Logika bisnis di `app/Services/`

---

## CORS

Frontend (localhost:3000) sudah dikonfigurasi di `config/cors.php`.
Jika ada error CORS, periksa file tersebut.

---

## Konvensi Endpoint

```
GET    /api/{resource}          → index
POST   /api/{resource}          → store
GET    /api/{resource}/{id}     → show
PUT    /api/{resource}/{id}     → update
DELETE /api/{resource}/{id}     → destroy
```

Auth routes:
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```
