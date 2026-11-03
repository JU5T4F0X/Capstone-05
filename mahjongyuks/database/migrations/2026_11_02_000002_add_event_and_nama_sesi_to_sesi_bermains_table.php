<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Perbarui tabel sesi_bermains
        Schema::table('sesi_bermains', function (Blueprint $table) {
            if (!Schema::hasColumn('sesi_bermains', 'event_id')) {
                $table->foreignId('event_id')->nullable()->after('pemesanan_id')->constrained('events')->nullOnDelete();
            }
            if (!Schema::hasColumn('sesi_bermains', 'nama_sesi')) {
                $table->string('nama_sesi')->nullable()->after('event_id');
            }
        });

        // Jadikan pemesanan_id nullable jika sesi berdiri sendiri untuk turnamen/event
        try {
            DB::statement('ALTER TABLE sesi_bermains MODIFY pemesanan_id BIGINT UNSIGNED NULL');
        } catch (\Throwable $e) {
            // Abaikan jika sudah nullable
        }

        // 2. Perbarui tabel skor_pemains
        Schema::table('skor_pemains', function (Blueprint $table) {
            if (!Schema::hasColumn('skor_pemains', 'catatan_wasit')) {
                $table->string('catatan_wasit')->nullable()->after('peringkat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('skor_pemains', function (Blueprint $table) {
            if (Schema::hasColumn('skor_pemains', 'catatan_wasit')) {
                $table->dropColumn('catatan_wasit');
            }
        });

        Schema::table('sesi_bermains', function (Blueprint $table) {
            if (Schema::hasColumn('sesi_bermains', 'nama_sesi')) {
                $table->dropColumn('nama_sesi');
            }
            if (Schema::hasColumn('sesi_bermains', 'event_id')) {
                $table->dropForeign(['event_id']);
                $table->dropColumn('event_id');
            }
        });
    }
};
