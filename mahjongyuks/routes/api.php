<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\MejaController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PemesananController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — MahjongYuks
|--------------------------------------------------------------------------
| Mengacu pada AGENTS.md Bagian 9 (Konvensi API Laravel REST API)
*/

// Public Auth Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::match(['put', 'post'], '/profile', [AuthController::class, 'updateProfile']);
        Route::match(['put', 'post'], '/me', [AuthController::class, 'updateProfile']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::match(['put', 'post'], '/user/profile', [AuthController::class, 'updateProfile']);
});

// Modul Event (User & Admin CRUD)
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::post('/events', [EventController::class, 'store']);
Route::put('/events/{id}', [EventController::class, 'update']);
Route::post('/events/{id}', [EventController::class, 'update']);
Route::delete('/events/{id}', [EventController::class, 'destroy']);

// Pendaftaran Event & Riwayat (Wajib Login auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/events/{id}/daftar', [EventController::class, 'daftar']);
    Route::post('/events/{id}/batal', [EventController::class, 'batalDaftar']);
    Route::get('/events/{id}/peserta', [EventController::class, 'peserta']);
    Route::get('/user/event-registrations', [EventController::class, 'myRegistrations']);
});

// Modul Venue (User & Admin CRUD)
Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{id}', [VenueController::class, 'show']);
Route::post('/venues', [VenueController::class, 'store']);
Route::put('/venues/{id}', [VenueController::class, 'update']);
Route::post('/venues/{id}', [VenueController::class, 'update']);
Route::delete('/venues/{id}', [VenueController::class, 'destroy']);

// Modul Jadwal
Route::get('/jadwal', [JadwalController::class, 'index']);

/*
|--------------------------------------------------------------------------
| BARU: Meja, Pemesanan, Pembayaran (Midtrans)
|--------------------------------------------------------------------------
*/

// Daftar meja + kursi terisi (publik, hanya baca)
Route::get('/mejas', [MejaController::class, 'index']);
Route::get('/mejas/{id}', [MejaController::class, 'show']);

// Webhook Midtrans: publik karena yang memanggil server Midtrans.
// Keamanannya ada di verifikasi signature di dalam controller.
Route::post('/payments/notification', [PembayaranController::class, 'notification']);

// Pemesanan & pembayaran (wajib login)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/pemesanans', [PemesananController::class, 'index']);
    Route::post('/pemesanans', [PemesananController::class, 'store']);
    Route::get('/pemesanans/{id}', [PemesananController::class, 'show']);
    Route::get('/pemesanans/{id}/status', [PemesananController::class, 'status']);
    Route::match(['put', 'post'], '/pemesanans/{id}/cancel', [PemesananController::class, 'cancel']);

    Route::get('/pembayarans', [PembayaranController::class, 'index']);
    Route::post('/pembayarans/{id}/verifikasi', [PembayaranController::class, 'verifikasi']);
});