<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel pemesanans (ERD: Pemesanan / Booking)
     * Info jadwal (tanggal_main, waktu_mulai, waktu_selesai) embedded di sini,
     * tidak ada tabel schedules terpisah sesuai ERD resmi.
     * jumlah_pemain WAJIB divalidasi <= kapasitas meja (maks 4).
     */
    public function up(): void
    {
        Schema::create('pemesanans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->foreignId('meja_id')->constrained('mejas')->cascadeOnDelete();
            $table->date('tanggal_pemesanan');
            $table->date('tanggal_main');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->unsignedTinyInteger('jumlah_pemain')->default(1); // 1-4, validasi di backend
            $table->enum('jenis_pemesanan', ['Casual', 'Competitive'])->default('Casual');
            $table->enum('status_pemesanan', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pemesanans');
    }
};
