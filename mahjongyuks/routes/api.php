<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\MejaController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PemesananController;
use App\Http\Controllers\Api\SkorLeaderboardController;
use App\Http\Controllers\Api\HkScoreController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — MahjongYuks
|--------------------------------------------------------------------------
| Mengacu pada AGENTS.md Bagian 9 (Konvensi API Laravel REST API)
*/

// =========================================================================
// 1. PUBLIC ENDPOINTS (Tanpa Otentikasi)
// =========================================================================

// Public Auth Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Modul Event (Publik: Melihat daftar & detail event)
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);

// Modul Venue (Publik: Melihat daftar venue & meja)
Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{id}', [VenueController::class, 'show']);

// Modul Jadwal & Meja (Publik: Melihat ketersediaan meja)
Route::get('/jadwal', [JadwalController::class, 'index']);
Route::get('/mejas', [MejaController::class, 'index']);
Route::get('/mejas/{id}', [MejaController::class, 'show']);

// Webhook Midtrans (Publik, diverifikasi via signature HMAC)
Route::post('/payments/notification', [PembayaranController::class, 'notification']);

// Leaderboard & Informasi Publik
Route::get('/leaderboard', [HkScoreController::class, 'leaderboard']);
Route::get('/players', [SkorLeaderboardController::class, 'playersList']);
Route::get('/sesi-bermain', [HkScoreController::class, 'sessions']);

// HK Mahjong Config & Publik View
Route::prefix('hk')->group(function () {
    Route::get('/config', [HkScoreController::class, 'config']);
    Route::get('/sessions', [HkScoreController::class, 'sessions']);
    Route::get('/sessions/{id}/tables', [HkScoreController::class, 'getTables']);
    Route::get('/sessions/{id}/history', [HkScoreController::class, 'sessionHistory']);
    Route::get('/leaderboard', [HkScoreController::class, 'leaderboard']);
});


// =========================================================================
// 2. AUTHENTICATED SHARED ENDPOINTS (Wajib Login auth:sanctum)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {
    // Profil Pengguna & Logout
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::match(['put', 'post'], '/auth/profile', [AuthController::class, 'updateProfile']);
    Route::match(['put', 'post'], '/auth/me', [AuthController::class, 'updateProfile']);
    Route::match(['put', 'post'], '/user/profile', [AuthController::class, 'updateProfile']);

    // Pemesanan (Pemain melihat milik sendiri, Admin dapat melihat seluruhnya)
    Route::get('/pemesanans', [PemesananController::class, 'index']);
    Route::get('/pemesanans/{id}', [PemesananController::class, 'show']);
    Route::get('/pemesanans/{id}/status', [PemesananController::class, 'status']);
    Route::match(['put', 'post'], '/pemesanans/{id}/cancel', [PemesananController::class, 'cancel']);
    Route::post('/pembayarans/{id}/simulasi', [PembayaranController::class, 'simulasiBayar']);
});


// =========================================================================
// 3. PLAYER ONLY ENDPOINTS (Wajib auth:sanctum + role:player)
// =========================================================================
Route::middleware(['auth:sanctum', 'role:player'])->group(function () {
    // Pendaftaran Event
    Route::post('/events/{id}/daftar', [EventController::class, 'daftar']);
    Route::post('/events/{id}/batal', [EventController::class, 'batalDaftar']);
    Route::get('/user/event-registrations', [EventController::class, 'myRegistrations']);

    // Pemesanan Kursi Meja Permainan
    Route::post('/pemesanans', [PemesananController::class, 'store']);

    // Game History Pribadi Atlet
    Route::get('/user/game-history', [SkorLeaderboardController::class, 'myGameHistory']);
});


// =========================================================================
// 4. ADMIN ONLY ENDPOINTS (Wajib auth:sanctum + role:admin)
// =========================================================================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Manajemen Event (Admin CRUD)
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::post('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::get('/events/{id}/peserta', [EventController::class, 'peserta']);

    // Manajemen Venue (Admin CRUD)
    Route::post('/venues', [VenueController::class, 'store']);
    Route::put('/venues/{id}', [VenueController::class, 'update']);
    Route::post('/venues/{id}', [VenueController::class, 'update']);
    Route::delete('/venues/{id}', [VenueController::class, 'destroy']);

    // Manajemen Pembayaran (Verifikasi & Monitoring Admin)
    Route::get('/pembayarans', [PembayaranController::class, 'index']);
    Route::post('/pembayarans/{id}/verifikasi', [PembayaranController::class, 'verifikasi']);
    Route::get('/admin/financial-stats', [PembayaranController::class, 'financialStats']);

    // HK Mahjong Desk Wasit & Manajemen Sesi/Skor
    Route::prefix('hk')->group(function () {
        Route::post('/sessions/{id}/start', [HkScoreController::class, 'startSession']);
        Route::post('/sessions/{id}/close', [HkScoreController::class, 'closeSession']);
        Route::post('/tables/{id}/players', [HkScoreController::class, 'addPlayerToTable']);
        Route::delete('/tables/{id}/players/{playerId}', [HkScoreController::class, 'removePlayerFromTable']);
        Route::post('/record-win', [HkScoreController::class, 'recordWin']);
        Route::post('/win-records/{id}/void', [HkScoreController::class, 'voidWin']);
        Route::post('/leaderboard/reset', [HkScoreController::class, 'resetScores']);
    });

    // Reset Leaderboard & Legacy Skor
    Route::post('/leaderboard/reset', [HkScoreController::class, 'resetScores']);
    Route::post('/skor-pemain', [SkorLeaderboardController::class, 'recordScore']);
});