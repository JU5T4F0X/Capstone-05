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
        'deskripsi',
        'status',
    ];

    public function mejas(): HasMany
    {
        return $this->hasMany(Meja::class);
    }
}
