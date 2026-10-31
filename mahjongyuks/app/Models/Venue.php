<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_venue',
        'alamat',
        'kota_kecamatan',
        'telepon',
        'email',
        'jam_buka',
        'jam_tutup',
        'latitude',
        'longitude',
        'maps_url',
        'deskripsi',
        'status',
        'foto',
        'fasilitas',
    ];

    /**
     * Relasi ke seluruh Meja di Venue ini
     */
    public function mejas(): HasMany
    {
        return $this->hasMany(Meja::class);
    }

    /**
     * Relasi ke seluruh Event yang diselenggarakan di Venue ini
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'venue_id');
    }
}
