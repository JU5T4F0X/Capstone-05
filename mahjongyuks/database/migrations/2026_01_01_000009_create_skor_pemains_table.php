<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel skor_pemains (ERD: Skor Pemain)
     * Diisi oleh admin setelah sesi selesai (mode Competitive).
     * Digunakan untuk Leaderboard dan Game History.
     */
    public function up(): void
    {
        Schema::create('skor_pemains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sesi_id')->constrained('sesi_bermains')->cascadeOnDelete();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->decimal('skor', 10, 2)->default(0);
            $table->unsignedInteger('peringkat')->nullable(); // 1 = juara
            $table->string('catatan_wasit')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skor_pemains');
    }
};
