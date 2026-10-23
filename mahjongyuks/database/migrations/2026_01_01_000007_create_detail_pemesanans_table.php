<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel detail_pemesanans (ERD: Detail Pemesanan)
     * Menyimpan daftar peserta/pemain dalam satu booking.
     * Ini menggantikan konsep 'seats' — setiap row = satu pemain dalam booking.
     * status_kehadiran diupdate saat pemain check-in (dicatat timestamp di updated_at).
     */
    public function up(): void
    {
        Schema::create('detail_pemesanans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pemesanan_id')->constrained('pemesanans')->cascadeOnDelete();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->enum('status_kehadiran', ['pending', 'hadir', 'tidak_hadir'])->default('pending');
            $table->timestamps(); // updated_at = timestamp check-in
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_pemesanans');
    }
};
