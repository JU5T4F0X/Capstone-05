
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
        Schema::table('players', function (Blueprint $table) {
            if (! Schema::hasColumn('players', 'tingkat_kemahiran')) {
                $table->enum('tingkat_kemahiran', ['beginner', 'intermediate', 'advance'])
                    ->default('intermediate')
                    ->after('tanggal_daftar');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            if (Schema::hasColumn('players', 'tingkat_kemahiran')) {
                $table->dropColumn('tingkat_kemahiran');
            }
        });
    }
};

