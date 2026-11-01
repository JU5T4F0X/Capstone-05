<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\SkorLeaderboardController;
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

// Modul Leaderboard & Atlet (RF-08)
Route::get('/leaderboard', [SkorLeaderboardController::class, 'leaderboard']);
Route::get('/players', [SkorLeaderboardController::class, 'playersList']);
Route::get('/sesi-bermain', [SkorLeaderboardController::class, 'sessions']);

// Modul Skor & Sesi Wasit (RF-06 & RF-07)
Route::post('/skor-pemain', [SkorLeaderboardController::class, 'recordScore']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/game-history', [SkorLeaderboardController::class, 'myGameHistory']);
});
