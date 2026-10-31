<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}

