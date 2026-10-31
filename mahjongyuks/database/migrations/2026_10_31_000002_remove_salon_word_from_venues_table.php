<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Membersihkan penyebutan kata 'Salon' dari data tabel venues.
     */
    public function up(): void
    {
        DB::table('venues')
            ->where('id', 1)
            ->update([
                'deskripsi' => 'MahjongYuks di Game House Sedayu City Kelapa Gading. Pusat seluruh kegiatan bermain, pembinaan atlet, turnamen sirkuit resmi, dan pelayanan kepada pengunjung.',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('venues')
            ->where('id', 1)
            ->update([
                'deskripsi' => 'Salon Riichi Mahjong resmi MahjongYuks di Game House Sedayu City Kelapa Gading. Pusat seluruh kegiatan bermain, pembinaan atlet, turnamen sirkuit resmi, dan pelayanan kepada pengunjung.',
                'updated_at' => now(),
            ]);
    }
};

