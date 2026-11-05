<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WinRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_round_id',
        'game_table_id',
        'sesi_id',
        'winner_id',
        'win_method',
        'discarder_id',
        'hand_codes',
        'fan',
        'points_awarded',
        'season',
        'idempotency_key',
        'created_by',
        'voided_at',
        'void_reason',
        'voided_by',
        'active_flag',
    ];

    protected $casts = [
        'hand_codes' => 'array',
        'voided_at' => 'datetime',
        'fan' => 'integer',
        'points_awarded' => 'integer',
    ];

    public function gameRound(): BelongsTo
    {
        return $this->belongsTo(GameRound::class, 'game_round_id');
    }

    public function gameTable(): BelongsTo
    {
        return $this->belongsTo(GameTable::class, 'game_table_id');
    }

    public function sesiBermain(): BelongsTo
    {
        return $this->belongsTo(SesiBermain::class, 'sesi_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'winner_id');
    }

    public function discarder(): BelongsTo
    {
        return $this->belongsTo(Player::class, 'discarder_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function voider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function isVoided(): bool
    {
        return !is_null($this->voided_at);
    }
}
