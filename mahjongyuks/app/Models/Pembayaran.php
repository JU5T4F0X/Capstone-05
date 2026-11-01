<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pembayaran extends Model
{
    use HasFactory;

    protected $table = 'pembayarans';

    protected $fillable = [
        'pemesanan_id',
        'tanggal_pembayaran',
        'jumlah',
        'metode_pembayaran',
        'bukti_pembayaran',
        'status',
        'order_id',
        'snap_token',
        'status_midtrans',
        'payment_type',
        'paid_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pembayaran' => 'date',
            'jumlah' => 'decimal:2',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function pemesanan(): BelongsTo
    {
        return $this->belongsTo(Pemesanan::class);
    }

    /**
     * Terapkan status dari Midtrans (webhook atau sinkronisasi).
     * Aman dipanggil berulang: status "paid" tidak pernah turun.
     */
    public function terapkanStatusGateway(string $trxStatus, ?string $fraud = null, ?string $paymentType = null): void
    {
        if ($this->status === 'paid') {
            return;
        }

        $this->status_midtrans = $trxStatus;
        if ($paymentType) {
            $this->payment_type = $paymentType;
        }

        $lunas = $trxStatus === 'settlement'
            || ($trxStatus === 'capture' && ($fraud === null || $fraud === 'accept'));

        if ($lunas) {
            $this->status = 'paid';
            $this->paid_at = now();
            $this->tanggal_pembayaran = now()->toDateString();
            $this->save();
            $this->pemesanan?->update(['status_pemesanan' => 'confirmed']);
            return;
        }

        if (in_array($trxStatus, ['deny', 'cancel', 'expire', 'failure'], true)) {
            // "expired" disimpan sebagai failed; bedanya ada di status_midtrans = expire
            $this->status = 'failed';
            $this->save();
            $this->pemesanan?->update(['status_pemesanan' => 'cancelled']);
            return;
        }

        $this->save(); // pending / challenge: tetap menunggu
    }
}