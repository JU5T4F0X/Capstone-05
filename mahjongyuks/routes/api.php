<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MejaController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PemesananController;
use App\Http\Controllers\Api\VenueController;
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
    });
});

// Public / Semi-public Information Endpoints
Route::get('/venues', [VenueController::class, 'index']);
Route::get('/venues/{id}', [VenueController::class, 'show']);
Route::get('/mejas', [MejaController::class, 'index']);
Route::get('/mejas/{id}', [MejaController::class, 'show']);

// Protected Endpoints (Customer & Admin)
Route::middleware('auth:sanctum')->group(function () {
    // Sprint 3: Pemesanan Meja & Kursi
    Route::get('/pemesanans', [PemesananController::class, 'index']);
    Route::post('/pemesanans', [PemesananController::class, 'store']);
    Route::get('/pemesanans/{id}', [PemesananController::class, 'show']);
    Route::put('/pemesanans/{id}/cancel', [PemesananController::class, 'cancel']);

    // Sprint 4: Pembayaran & Simulasi
    Route::get('/pembayarans', [PembayaranController::class, 'index']);
    Route::post('/pembayarans/{pemesananId}/simulasi', [PembayaranController::class, 'simulasiBayar']);
    Route::put('/pembayarans/{id}/verifikasi', [PembayaranController::class, 'verifikasi']);
});
