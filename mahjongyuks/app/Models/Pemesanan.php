<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pemesanan extends Model
{
    use HasFactory;

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
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pemesanan' => 'date',
            'tanggal_main' => 'date',
            'jumlah_pemain' => 'integer',
        ];
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function meja(): BelongsTo
    {
        return $this->belongsTo(Meja::class);
    }

    public function pembayaran(): HasOne
    {
        return $this->hasOne(Pembayaran::class);
    }

    public function detailPemesanans(): HasMany
    {
        return $this->hasMany(DetailPemesanan::class);
    }

    public function sesiBermain(): HasOne
    {
        return $this->hasOne(SesiBermain::class);
    }
}
