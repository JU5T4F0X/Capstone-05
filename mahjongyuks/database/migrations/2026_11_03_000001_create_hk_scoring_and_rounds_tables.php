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
        // 1. Tabel Meja dalam Sesi Turnamen / Permainan
        Schema::create('game_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sesi_id')->constrained('sesi_bermains')->cascadeOnDelete();
            $table->string('nomor_meja'); // misal: "Meja 1", "Meja A1"
            $table->foreignId('meja_id')->nullable()->constrained('mejas')->nullOnDelete();
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->timestamps();
        });

        // 2. Tabel Penugasan Pemain ke Meja (Maks 4 Pemain per Meja)
        Schema::create('table_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_table_id')->constrained('game_tables')->cascadeOnDelete();
            $table->foreignId('player_id')->constrained('players')->cascadeOnDelete();
            $table->string('seat_wind')->nullable(); // East, South, West, North
            $table->timestamps();

            $table->unique(['game_table_id', 'player_id'], 'uq_table_player');
        });

        // 3. Tabel Ronde Permainan per Meja (Berjalan Independen & Paralel)
        Schema::create('game_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_table_id')->constrained('game_tables')->cascadeOnDelete();
            $table->unsignedInteger('round_number');
            $table->enum('status', ['berjalan', 'selesai', 'tidak_selesai'])->default('berjalan');
            $table->timestamps();

            $table->unique(['game_table_id', 'round_number'], 'uq_table_round');
        });

        // 4. Tabel Catatan Kemenangan (Hong Kong Style Win Records)
        Schema::create('win_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_round_id')->constrained('game_rounds')->cascadeOnDelete();
            $table->foreignId('game_table_id')->constrained('game_tables')->cascadeOnDelete();
            $table->foreignId('sesi_id')->constrained('sesi_bermains')->cascadeOnDelete();
            $table->foreignId('winner_id')->constrained('players')->cascadeOnDelete();
            $table->enum('win_method', ['self_draw', 'discard']);
            $table->foreignId('discarder_id')->nullable()->constrained('players')->nullOnDelete();
            $table->json('hand_codes'); // array kode tangan
            $table->unsignedInteger('fan');
            $table->integer('points_awarded');
            $table->string('season')->default('Season 2025/2026');
            $table->string('idempotency_key', 64)->unique();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Kolom Void / Koreksi
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();

            // Unique constraint untuk record aktif: 1 pemenang aktif per ronde
            // Di MySQL, kolom nullable mengizinkan multiple NULLs, sehingga jika voided diisi NULL,
            // baris aktif bernilai 1 dan ditolak jika ganda.
            $table->unsignedTinyInteger('active_flag')->nullable()->default(1);
            $table->unique(['game_round_id', 'active_flag'], 'uq_round_active_winner');

            $table->timestamps();
            $table->index(['winner_id', 'season', 'voided_at']);
        });

        // 5. Tabel Audit Logs untuk Akuntabilitas Wasit & Admin
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // record_win, void_win, reset_season, close_session
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('win_records');
        Schema::dropIfExists('game_rounds');
        Schema::dropIfExists('table_players');
        Schema::dropIfExists('game_tables');
    }
};
