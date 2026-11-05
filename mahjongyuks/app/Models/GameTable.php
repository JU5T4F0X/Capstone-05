<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GameTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'sesi_id',
        'nomor_meja',
        'meja_id',
        'status',
    ];

    public function sesiBermain(): BelongsTo
    {
        return $this->belongsTo(SesiBermain::class, 'sesi_id');
    }

    public function meja(): BelongsTo
    {
        return $this->belongsTo(Meja::class, 'meja_id');
    }

    public function tablePlayers(): HasMany
    {
        return $this->hasMany(TablePlayer::class, 'game_table_id');
    }

    public function rounds(): HasMany
    {
        return $this->hasMany(GameRound::class, 'game_table_id')->orderBy('round_number', 'asc');
    }

    public function currentRound(): HasOne
    {
        return $this->hasOne(GameRound::class, 'game_table_id')
            ->where('status', 'berjalan')
            ->latestOfMany('round_number');
    }

    public function winRecords(): HasMany
    {
        return $this->hasMany(WinRecord::class, 'game_table_id');
    }
}
