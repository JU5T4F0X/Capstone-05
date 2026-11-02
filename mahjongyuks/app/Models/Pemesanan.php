<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pemesanan extends Model
{
    use HasFactory;

    protected $table = 'pemesanans';

    protected $fillable = [
        'player_id',
        'meja_id',
        'tanggal_pemesanan',
        'tanggal_main',
        'waktu_mulai',
        'waktu_selesai',
        'jumlah_pemain',
        'jenis_pemesanan',
        'status_pemesanan',
        'kode_booking',
        'durasi_jam',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pemesanan' => 'date',
            'tanggal_main' => 'date',
        ];
    }

    public function meja(): BelongsTo
    {
        return $this->belongsTo(Meja::class);
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function pembayaran(): HasOne
    {
        return $this->hasOne(Pembayaran::class);
    }

    public function detailPemesanans(): HasMany
    {
        return $this->hasMany(DetailPemesanan::class);
    }

    /**
     * Pemesanan yang sedang menempati kursi: sudah dikonfirmasi, atau masih
     * menunggu bayar dan belum kedaluwarsa.
     */
    public function scopeMenempati(Builder $query): Builder
    {
        return $query->where(function ($w) {
            $w->where('status_pemesanan', 'confirmed')
                ->orWhere(function ($p) {
                    $p->where('status_pemesanan', 'pending')
                        ->whereHas('pembayaran', fn ($b) => $b->where('expires_at', '>', now()));
                });
        });
    }

    /**
     * Jam bertabrakan (format H:i:s).
     */
    public function scopeBentrok(Builder $query, string $mulai, string $selesai): Builder
    {
        return $query->where('waktu_mulai', '<', $selesai)
            ->where('waktu_selesai', '>', $mulai);
    }
}