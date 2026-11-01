<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'nama_event',
        'deskripsi',
        'tanggal_event',
        'waktu_mulai',
        'waktu_selesai',
        'status',
        'jenis_event',
        'biaya',
        'kuota',
        'foto',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_event' => 'date',
        ];
    }

    /**
     * Relasi ke Venue penyelenggara event
     */
    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class, 'venue_id');
    }

    /**
     * Relasi ke seluruh pendaftaran event ini
     */
    public function pendaftarans(): HasMany
    {
        return $this->hasMany(EventPendaftaran::class, 'event_id');
    }

    /**
     * Relasi ke Player yang terdaftar pada event ini
     */
    public function players(): BelongsToMany
    {
        return $this->belongsToMany(Player::class, 'event_pendaftarans', 'event_id', 'player_id')
            ->withPivot(['status_pendaftaran', 'tanggal_daftar', 'catatan'])
            ->withTimestamps();
    }
}
