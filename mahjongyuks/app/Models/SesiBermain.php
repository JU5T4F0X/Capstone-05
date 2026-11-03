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
        'event_id',
        'nama_sesi',
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

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function skorPemains(): HasMany
    {
        return $this->hasMany(SkorPemain::class, 'sesi_id');
    }

    public function gameTables(): HasMany
    {
        return $this->hasMany(GameTable::class, 'sesi_id');
    }

    public function winRecords(): HasMany
    {
        return $this->hasMany(WinRecord::class, 'sesi_id');
    }

    /**
     * Cek apakah sesi masih aktif dan belum melewati batas waktu selesai.
     */
    public function isCurrentlyPlayable(): bool
    {
        if ($this->status === 'closed') {
            return false;
        }

        // Cek apakah tanggal dan waktu selesai sudah terlewat
        if ($this->tanggal_permainan && $this->waktu_selesai) {
            $endDateTime = \Carbon\Carbon::parse($this->tanggal_permainan->format('Y-m-d') . ' ' . $this->waktu_selesai);
            if (now()->greaterThanOrEqualTo($endDateTime)) {
                return false;
            }
        }

        return true;
    }
}
