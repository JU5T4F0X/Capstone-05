<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Hong Kong Mahjong Rules & Scoring Configuration
    |--------------------------------------------------------------------------
    | Mengacu pada aturan resmi turnamen Hong Kong Old Style (HKOS):
    | - Minimal Fan untuk menang = 3 Fan
    | - Batas Maksimum (Limit / Cap) = 10 Fan
    | - Self-draw (Tarik Sendiri) menambah +1 Fan (kecuali tangan sudah Limit)
    | - 1 Fan menggandakan nilai dasar / skala poin progresif
    */

    'min_fan' => 3,
    'max_fan_limit' => 10,
    'self_draw_bonus_fan' => 1,
    'deduct_losers' => false, // Default false: poin hanya ditambahkan ke pemenang

    /*
    |--------------------------------------------------------------------------
    | Sistem Poin Olahraga / Sport Scoring (1 Fan = 1 Poin)
    |--------------------------------------------------------------------------
    | MahjongYuks beroperasi sebagai game house / olahraga otak non-judi.
    | Poin atlet murni mengikuti total Fan yang dicapai (1 Fan = 1 Poin Atlet).
    */
    'fan_points_table' => [
        3 => ['points' => 3, 'discard' => 3, 'self_draw_total' => 3, 'self_draw_each' => 1],
        4 => ['points' => 4, 'discard' => 4, 'self_draw_total' => 4, 'self_draw_each' => 1],
        5 => ['points' => 5, 'discard' => 5, 'self_draw_total' => 5, 'self_draw_each' => 1],
        6 => ['points' => 6, 'discard' => 6, 'self_draw_total' => 6, 'self_draw_each' => 1],
        7 => ['points' => 7, 'discard' => 7, 'self_draw_total' => 7, 'self_draw_each' => 1],
        8 => ['points' => 8, 'discard' => 8, 'self_draw_total' => 8, 'self_draw_each' => 1],
        9 => ['points' => 9, 'discard' => 9, 'self_draw_total' => 9, 'self_draw_each' => 1],
        10 => ['points' => 10, 'discard' => 10, 'self_draw_total' => 10, 'self_draw_each' => 1],
    ],

    /*
    |--------------------------------------------------------------------------
    | Daftar Pola Tangan Menang (Berdasarkan Panduan Resmi Turnamen)
    |--------------------------------------------------------------------------
    */
    'hands' => [
        // --- TANGAN BIASA (Dapat Dikombinasikan) ---
        'chicken_hand' => [
            'code' => 'chicken_hand',
            'name' => 'Chicken Hand',
            'name_id' => 'Tangan Biasa (Ayam)',
            'fan' => 0,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Campuran sekuens dan triplet tanpa kehormatan (0 Fan, tidak cukup untuk menang sendiri).',
        ],
        'all_sequences' => [
            'code' => 'all_sequences',
            'name' => 'All Sequences (4 Chows)',
            'name_id' => 'Runtutan Penuh (4 Chow)',
            'fan' => 1,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Seluruh 4 set berupa sekuens (Chow).',
        ],
        'dragon_triplet' => [
            'code' => 'dragon_triplet',
            'name' => 'Dragon Triplet',
            'name_id' => 'Pung Naga (Merah/Hijau/Putih)',
            'fan' => 1,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Triplet tile naga (per triplet bernilai 1 Fan).',
        ],
        'round_seat_wind' => [
            'code' => 'round_seat_wind',
            'name' => 'Round / Seat Wind',
            'name_id' => 'Pung Angin Ronde / Kursi',
            'fan' => 1,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Triplet angin ronde atau angin kursi (jika sama dihitung 2 Fan).',
        ],
        'all_triplets' => [
            'code' => 'all_triplets',
            'name' => 'All Triplets (4 Pongs)',
            'name_id' => 'Kembar Tiga Penuh (4 Pong)',
            'fan' => 3,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Semua 4 set berupa triplet / kembar tiga.',
        ],
        'mixed_flush' => [
            'code' => 'mixed_flush',
            'name' => 'Mixed / Semi Flush',
            'name_id' => 'Satu Corak + Kehormatan',
            'fan' => 3,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Tangan hanya terdiri dari satu jenis suit ditambah tile kehormatan (angin/naga).',
        ],
        'mixed_terminals' => [
            'code' => 'mixed_terminals',
            'name' => 'Mixed Terminals',
            'name_id' => 'Campuran Ujung & Kehormatan',
            'fan' => 4,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Tangan hanya berisi angka 1, 9, dan tile kehormatan.',
        ],
        'seven_pairs' => [
            'code' => 'seven_pairs',
            'name' => 'Seven Pairs',
            'name_id' => 'Tujuh Pasang (Seven Pairs)',
            'fan' => 4,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Tangan terdiri dari 7 pasangan tile identik.',
        ],
        'small_three_dragons' => [
            'code' => 'small_three_dragons',
            'name' => 'Small Three Dragons',
            'name_id' => 'Tiga Naga Kecil',
            'fan' => 5,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Dua triplet naga dan satu pasang naga ketiga.',
        ],
        'full_flush' => [
            'code' => 'full_flush',
            'name' => 'Full Colour / Full Flush',
            'name_id' => 'Satu Corak Murni (Full Flush)',
            'fan' => 7,
            'is_limit' => false,
            'category' => 'standard',
            'description' => 'Seluruh tile berasal dari satu suit murni tanpa kehormatan.',
        ],

        // --- TANGAN LIMIT / SPESIAL (Langsung Maksimal 10 Fan) ---
        'big_three_dragons' => [
            'code' => 'big_three_dragons',
            'name' => '3 Scholars / Big 3 Dragons',
            'name_id' => 'Tiga Cendekia (Big 3 Dragons)',
            'fan' => 8,
            'is_limit' => false,
            'category' => 'special',
            'description' => 'Ketiga triplet naga lengkap (Merah, Hijau, Putih).',
        ],
        'small_four_winds' => [
            'code' => 'small_four_winds',
            'name' => 'Small Four Winds',
            'name_id' => 'Empat Angin Kecil',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Tiga triplet angin dan satu pasang angin keempat.',
        ],
        'all_concealed_triplets' => [
            'code' => 'all_concealed_triplets',
            'name' => 'All Concealed Triplets',
            'name_id' => 'Empat Pong Tertutup (Ankan)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Semua triplet didapat sendiri tanpa mengambil buangan lawan.',
        ],
        'all_honours' => [
            'code' => 'all_honours',
            'name' => 'All Honours',
            'name_id' => 'Semua Huruf Kehormatan',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Tangan hanya berisi tile angin dan naga.',
        ],
        'all_terminals' => [
            'code' => 'all_terminals',
            'name' => 'All Terminals',
            'name_id' => 'Semua Angka Ujung (1 & 9)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Tangan hanya berisi angka 1 dan 9 dari ketiga suit.',
        ],
        'big_four_winds' => [
            'code' => 'big_four_winds',
            'name' => '4 Blessings / Big 4 Winds',
            'name_id' => 'Empat Berkah (Big 4 Winds)',
            'fan' => 10, // Di referensi 14 Fan, dibatasi oleh limit turnamen menjadi 10 Fan
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Keempat triplet angin lengkap (Timur, Selatan, Barat, Utara).',
        ],
        'thirteen_orphans' => [
            'code' => 'thirteen_orphans',
            'name' => '13 Orphans (Kokushi)',
            'name_id' => 'Tiga Belas Keajaiban (13 Orphans)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Satu dari setiap tile 1, 9, angin, dan naga plus 1 pasangan.',
        ],
        'all_kongs' => [
            'code' => 'all_kongs',
            'name' => 'All Quadruplets / 4 Kongs',
            'name_id' => 'Empat Kong (4 Kongs)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Semua 4 set berupa quadruplet (Kong).',
        ],
        'nine_gates' => [
            'code' => 'nine_gates',
            'name' => 'Nine Gates (Chuuren Pouto)',
            'name_id' => 'Sembilan Pintu (Nine Gates)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Pola 111 2345678 999 dari 1 suit ditambah tile ke-14 dari suit yang sama.',
        ],
    ],
];
