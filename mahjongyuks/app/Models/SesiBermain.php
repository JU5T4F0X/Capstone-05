<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SesiBermain extends Model
{
    use HasFactory;

    protected $table = 'sesi_bermains';

    protected $fillable = [
        'pemesanan_id',
        'tanggal_permainan',
        'waktu_mulai',
        'waktu_selesai',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_permainan' => 'date',
        ];
    }

    public function pemesanan(): BelongsTo
    {
        return $this->belongsTo(Pemesanan::class);
    }

    public function skorPemains(): HasMany
    {
        return $this->hasMany(SkorPemain::class, 'sesi_id');
    }
}
