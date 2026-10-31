<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tanggal_daftar',
        'tingkat_kemahiran',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_daftar' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pemesanans(): HasMany
    {
        return $this->hasMany(Pemesanan::class);
    }

    public function detailPemesanans(): HasMany
    {
        return $this->hasMany(DetailPemesanan::class);
    }

    public function skorPemains(): HasMany
    {
        return $this->hasMany(SkorPemain::class);
    }

    public function eventPendaftarans(): HasMany
    {
        return $this->hasMany(EventPendaftaran::class, 'player_id');
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_pendaftarans', 'player_id', 'event_id')
            ->withPivot(['status_pendaftaran', 'tanggal_daftar', 'catatan'])
            ->withTimestamps();
    }
}
