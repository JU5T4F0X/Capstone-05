<?php

namespace App\Services;

class HkMahjongCalculator
{
    /**
     * Hitung total fan dan poin yang diberikan berdasarkan kode tangan dan cara menang.
     *
     * @param array $handCodes Daftar kode tangan (misal: ['all_triplets', 'dragon_triplet'])
     * @param string $winMethod 'self_draw' (Tarik Sendiri) atau 'discard' (Buang Lawan)
     * @return array
     */
    public static function calculate(array $handCodes, string $winMethod = 'discard'): array
    {
        $allHandsConfig = config('hk_hands.hands', []);
        $pointsTable = config('hk_hands.fan_points_table', []);
        $minFan = config('hk_hands.min_fan', 3);
        $maxFanLimit = config('hk_hands.max_fan_limit', 10);
        $selfDrawBonus = config('hk_hands.self_draw_bonus_fan', 1);

        if (empty($handCodes)) {
            return [
                'is_valid' => false,
                'error' => 'Pilih minimal satu pola tangan yang sah.',
                'raw_fan' => 0,
                'fan' => 0,
                'points_awarded' => 0,
                'win_method' => $winMethod,
                'is_limit' => false,
                'hands' => [],
            ];
        }

        $selectedHands = [];
        $rawFan = 0;
        $hasLimitHand = false;
        $bonusFan = 0;

        foreach ($handCodes as $code) {
            if (isset($allHandsConfig[$code])) {
                $hand = $allHandsConfig[$code];
                $selectedHands[] = $hand;

                if (!empty($hand['is_limit'])) {
                    $hasLimitHand = true;
                } else {
                    $rawFan += (int) $hand['fan'];
                }
            }
        }

        // Jika terdapat tangan limit (10 Fan), tangan limit tidak dijumlahkan dengan pola lain
        if ($hasLimitHand) {
            $rawFan = $maxFanLimit;
            $finalFan = $maxFanLimit;
            $bonusFan = 0;
        } else {
            // Self-draw menambah +1 Fan jika belum limit
            $isSelfDraw = ($winMethod === 'self_draw');
            $bonusFan = $isSelfDraw ? $selfDrawBonus : 0;
            $calculatedFan = $rawFan + $bonusFan;

            // Batasi maksimum ke limit (10 Fan)
            $finalFan = min($calculatedFan, $maxFanLimit);
        }

        // Validasi minimum 3 fan
        $isValid = ($finalFan >= $minFan);
        $error = null;

        if (!$isValid) {
            $error = "Total {$finalFan} Fan belum memenuhi syarat minimum {$minFan} Fan untuk menang (Hu).";
        }

        // Poin atlet murni mengikuti nilai Fan yang diraih (1 Fan = 1 Poin Atlet)
        $pointsAwarded = $isValid ? (int) $finalFan : 0;

        return [
            'is_valid' => $isValid,
            'error' => $error,
            'raw_fan' => $rawFan,
            'fan' => $finalFan,
            'points_awarded' => $pointsAwarded,
            'win_method' => $winMethod,
            'is_limit' => $hasLimitHand || ($finalFan >= $maxFanLimit),
            'hands' => $selectedHands,
            'points_breakdown' => [
                'fan' => (int) $finalFan,
                'points' => (int) $pointsAwarded,
                'bonus_fan' => $bonusFan,
            ],
        ];
    }

    /**
     * Dapatkan seluruh daftar tangan untuk API dan UI.
     */
    public static function getHandsList(): array
    {
        return array_values(config('hk_hands.hands', []));
    }

    /**
     * Dapatkan tabel konversi fan ke poin.
     */
    public static function getPointsTable(): array
    {
        return config('hk_hands.fan_points_table', []);
    }
}
