<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TablePlayer extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_table_id',
        'player_id',
        'seat_wind',
    ];

    public function gameTable(): BelongsTo
    {
        return $this->belongsTo(GameTable::class, 'game_table_id');
    }

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'player_id');
    }
}
