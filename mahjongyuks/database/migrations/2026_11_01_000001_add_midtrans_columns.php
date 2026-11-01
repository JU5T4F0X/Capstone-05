<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pemesanans', function (Blueprint $table) {
            $table->string('kode_booking', 30)->nullable()->unique();
            $table->unsignedTinyInteger('durasi_jam')->nullable();
        });

        Schema::table('detail_pemesanans', function (Blueprint $table) {
            $table->string('posisi_kursi', 10)->nullable();
        });

        Schema::table('pembayarans', function (Blueprint $table) {
            $table->string('order_id', 64)->nullable()->unique();
            $table->text('snap_token')->nullable();
            $table->string('status_midtrans', 30)->nullable();
            $table->string('payment_type', 40)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pembayarans', function (Blueprint $table) {
            $table->dropUnique(['order_id']);
            $table->dropColumn(['order_id', 'snap_token', 'status_midtrans', 'payment_type', 'paid_at', 'expires_at']);
        });

        Schema::table('detail_pemesanans', function (Blueprint $table) {
            $table->dropColumn('posisi_kursi');
        });

        Schema::table('pemesanans', function (Blueprint $table) {
            $table->dropUnique(['kode_booking']);
            $table->dropColumn(['kode_booking', 'durasi_jam']);
        });
    }
};