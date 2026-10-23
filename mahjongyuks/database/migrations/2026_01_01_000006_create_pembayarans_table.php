<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabel pembayarans (ERD: Pembayaran) — simulasi pembayaran (bukan payment gateway)
     */
    public function up(): void
    {
        Schema::create('pembayarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pemesanan_id')->constrained('pemesanans')->cascadeOnDelete();
            $table->date('tanggal_pembayaran')->nullable();
            $table->decimal('jumlah', 12, 2)->default(0);
            $table->string('metode_pembayaran')->nullable(); // transfer, tunai, dll.
            $table->string('bukti_pembayaran')->nullable(); // path file/URL bukti
            $table->enum('status', ['pending', 'paid', 'failed'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembayarans');
    }
};
