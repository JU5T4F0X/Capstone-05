<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GameRound extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_table_id',
        'round_number',
        'status', // berjalan, selesai, tidak_selesai
    ];

    public function gameTable(): BelongsTo
    {
        return $this->belongsTo(GameTable::class, 'game_table_id');
    }

    public function winRecords(): HasMany
    {
        return $this->hasMany(WinRecord::class, 'game_round_id');
    }

    public function activeWinRecord(): HasOne
    {
        return $this->hasOne(WinRecord::class, 'game_round_id')->whereNull('voided_at');
    }
}
