<?php

namespace Tests\Unit;

use App\Services\HkMahjongCalculator;
use Tests\TestCase;

class HkMahjongCalculatorTest extends TestCase
{
    /**
     * Test validasi tangan di bawah 3 Fan ditolak (Chicken Hand / Kurang Fan).
     */
    public function test_rejects_hands_under_3_fan(): void
    {
        // 0 Fan Chicken Hand (Discard)
        $result = HkMahjongCalculator::calculate(['chicken_hand'], 'discard');
        $this->assertFalse($result['is_valid']);
        $this->assertEquals(0, $result['fan']);
        $this->assertEquals(0, $result['points_awarded']);
        $this->assertStringContainsString('3 Fan', $result['error']);

        // 1 Fan All Sequences (Discard)
        $result2 = HkMahjongCalculator::calculate(['all_sequences'], 'discard');
        $this->assertFalse($result2['is_valid']);
        $this->assertEquals(1, $result2['fan']);
        $this->assertEquals(0, $result2['points_awarded']);

        // 2 Fan (All Sequences 1 + Dragon 1, Discard)
        $result3 = HkMahjongCalculator::calculate(['all_sequences', 'dragon_triplet'], 'discard');
        $this->assertFalse($result3['is_valid']);
        $this->assertEquals(2, $result3['fan']);
        $this->assertEquals(0, $result3['points_awarded']);
    }

    /**
     * Test perhitungan poin untuk setiap level Fan (3 s.d. 10 Fan Limit) pada mode Discard.
     */
    public function test_points_calculation_for_all_fan_levels_discard(): void
    {
        // 3 Fan: All Triplets -> 8 Poin
        $res3 = HkMahjongCalculator::calculate(['all_triplets'], 'discard');
        $this->assertTrue($res3['is_valid']);
        $this->assertEquals(3, $res3['fan']);
        $this->assertEquals(8, $res3['points_awarded']);

        // 4 Fan: Seven Pairs -> 16 Poin
        $res4 = HkMahjongCalculator::calculate(['seven_pairs'], 'discard');
        $this->assertTrue($res4['is_valid']);
        $this->assertEquals(4, $res4['fan']);
        $this->assertEquals(16, $res4['points_awarded']);

        // 5 Fan: Small Three Dragons -> 24 Poin
        $res5 = HkMahjongCalculator::calculate(['small_three_dragons'], 'discard');
        $this->assertTrue($res5['is_valid']);
        $this->assertEquals(5, $res5['fan']);
        $this->assertEquals(24, $res5['points_awarded']);

        // 6 Fan: Small Three Dragons (5) + Dragon Triplet (1) -> 32 Poin
        $res6 = HkMahjongCalculator::calculate(['small_three_dragons', 'dragon_triplet'], 'discard');
        $this->assertTrue($res6['is_valid']);
        $this->assertEquals(6, $res6['fan']);
        $this->assertEquals(32, $res6['points_awarded']);

        // 7 Fan: Full Flush -> 48 Poin
        $res7 = HkMahjongCalculator::calculate(['full_flush'], 'discard');
        $this->assertTrue($res7['is_valid']);
        $this->assertEquals(7, $res7['fan']);
        $this->assertEquals(48, $res7['points_awarded']);

        // 8 Fan: Big Three Dragons -> 64 Poin
        $res8 = HkMahjongCalculator::calculate(['big_three_dragons'], 'discard');
        $this->assertTrue($res8['is_valid']);
        $this->assertEquals(8, $res8['fan']);
        $this->assertEquals(64, $res8['points_awarded']);

        // 9 Fan: Big Three Dragons (8) + Dragon Triplet (1) -> 96 Poin
        $res9 = HkMahjongCalculator::calculate(['big_three_dragons', 'dragon_triplet'], 'discard');
        $this->assertTrue($res9['is_valid']);
        $this->assertEquals(9, $res9['fan']);
        $this->assertEquals(96, $res9['points_awarded']);

        // 10 Fan Limit: 13 Orphans -> 128 Poin
        $res10 = HkMahjongCalculator::calculate(['thirteen_orphans'], 'discard');
        $this->assertTrue($res10['is_valid']);
        $this->assertEquals(10, $res10['fan']);
        $this->assertEquals(128, $res10['points_awarded']);
        $this->assertTrue($res10['is_limit']);
    }

    /**
     * Test Self-draw menambah +1 Fan dan langsung menghasilkan total poin tabel Half-Spicy.
     */
    public function test_self_draw_bonus_fan_and_total_points(): void
    {
        // All Triplets (3 Fan dasar) + Self Draw (+1 Fan) = 4 Fan -> 24 Poin total
        $res = HkMahjongCalculator::calculate(['all_triplets'], 'self_draw');
        $this->assertTrue($res['is_valid']);
        $this->assertEquals(4, $res['fan']);
        $this->assertEquals(24, $res['points_awarded']);

        // Full Flush (7 Fan dasar) + Self Draw (+1 Fan) = 8 Fan -> 96 Poin total
        $res2 = HkMahjongCalculator::calculate(['full_flush'], 'self_draw');
        $this->assertTrue($res2['is_valid']);
        $this->assertEquals(8, $res2['fan']);
        $this->assertEquals(96, $res2['points_awarded']);

        // Tangan Limit (13 Orphans = 10 Fan) + Self Draw: Fan tetap mentok di 10 Fan -> 192 Poin total
        $resLimit = HkMahjongCalculator::calculate(['thirteen_orphans'], 'self_draw');
        $this->assertTrue($resLimit['is_valid']);
        $this->assertEquals(10, $resLimit['fan']);
        $this->assertEquals(192, $resLimit['points_awarded']);
        $this->assertTrue($resLimit['is_limit']);
    }

    /**
     * Test batas maksimal limit (cap 10 Fan) dan tangan spesial tidak meluber.
     */
    public function test_fan_limit_cap_at_10(): void
    {
        // Full Flush 7 + Small Three Dragons 5 = 12 Fan -> Cap at 10 Fan -> 128 Poin Discard
        $res = HkMahjongCalculator::calculate(['full_flush', 'small_three_dragons'], 'discard');
        $this->assertTrue($res['is_valid']);
        $this->assertEquals(10, $res['fan']);
        $this->assertEquals(128, $res['points_awarded']);
        $this->assertTrue($res['is_limit']);
    }
}
