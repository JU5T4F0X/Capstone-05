<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_pendaftarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignId('player_id')->constrained('players')->onDelete('cascade');
            $table->dateTime('tanggal_daftar')->useCurrent();
            $table->enum('status_pendaftaran', ['terdaftar', 'hadir', 'batal'])->default('terdaftar');
            $table->text('catatan')->nullable();
            $table->timestamps();

            // Mencegah satu player mendaftar ganda pada event yang sama
            $table->unique(['event_id', 'player_id'], 'event_player_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_pendaftarans');
    }
};

