<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventPendaftaran extends Model
{
    use HasFactory;

    protected $table = 'event_pendaftarans';

    protected $fillable = [
        'event_id',
        'player_id',
        'tanggal_daftar',
        'status_pendaftaran',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_daftar' => 'datetime',
        ];
    }

    /**
     * Relasi ke Event yang didaftarkan
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    /**
     * Relasi ke Player yang mendaftar
     */
    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'player_id');
    }
}

