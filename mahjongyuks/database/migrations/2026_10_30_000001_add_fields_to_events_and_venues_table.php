<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan relasi venue_id serta atribut pendukung ke tabel events dan venues.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'venue_id')) {
                $table->foreignId('venue_id')->nullable()->after('id')->constrained('venues')->nullOnDelete();
            }
            if (!Schema::hasColumn('events', 'biaya')) {
                $table->string('biaya')->nullable()->after('status');
            }
            if (!Schema::hasColumn('events', 'kuota')) {
                $table->string('kuota')->nullable()->after('biaya');
            }
            if (!Schema::hasColumn('events', 'foto')) {
                $table->string('foto')->nullable()->after('kuota');
            }
        });

        Schema::table('venues', function (Blueprint $table) {
            if (!Schema::hasColumn('venues', 'foto')) {
                $table->string('foto')->nullable()->after('deskripsi');
            }
            if (!Schema::hasColumn('venues', 'fasilitas')) {
                $table->text('fasilitas')->nullable()->after('foto');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'venue_id')) {
                $table->dropForeign(['venue_id']);
                $table->dropColumn('venue_id');
            }
            if (Schema::hasColumn('events', 'biaya')) {
                $table->dropColumn('biaya');
            }
            if (Schema::hasColumn('events', 'kuota')) {
                $table->dropColumn('kuota');
            }
            if (Schema::hasColumn('events', 'foto')) {
                $table->dropColumn('foto');
            }
        });

        Schema::table('venues', function (Blueprint $table) {
            if (Schema::hasColumn('venues', 'foto')) {
                $table->dropColumn('foto');
            }
            if (Schema::hasColumn('venues', 'fasilitas')) {
                $table->dropColumn('fasilitas');
            }
        });
    }
};

