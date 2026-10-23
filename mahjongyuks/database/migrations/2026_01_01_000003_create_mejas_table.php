<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel mejas (ERD: Meja) — relasi ke venues
     * Kapasitas default 4 pemain sesuai aturan proyek.
     */
    public function up(): void
    {
        Schema::create('mejas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained('venues')->cascadeOnDelete();
            $table->string('nomor_meja');
            $table->unsignedTinyInteger('kapasitas')->default(4); // MAKS 4 pemain
            $table->string('status')->default('tersedia'); // tersedia, terisi_sebagian, penuh, tidak_aktif
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mejas');
    }
};
