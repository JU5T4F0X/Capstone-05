<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel sesi_bermains (ERD: Sesi Bermain)
     * Dibuat oleh admin setelah booking confirmed.
     */
    public function up(): void
    {
        Schema::create('sesi_bermains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pemesanan_id')->nullable()->constrained('pemesanans')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->string('nama_sesi')->nullable();
            $table->date('tanggal_permainan');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai')->nullable();
            $table->enum('status', ['pending', 'ongoing', 'closed'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sesi_bermains');
    }
};
