<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SkorPemain extends Model
{
    use HasFactory;

    protected $table = 'skor_pemains';

    protected $fillable = [
        'sesi_id',
        'player_id',
        'skor',
        'peringkat',
    ];

    protected function casts(): array
    {
        return [
            'skor' => 'decimal:1',
            'peringkat' => 'integer',
        ];
    }

    public function sesiBermain(): BelongsTo
    {
        return $this->belongsTo(SesiBermain::class, 'sesi_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }
}
