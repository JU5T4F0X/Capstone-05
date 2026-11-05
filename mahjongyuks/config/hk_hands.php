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
    | Tabel Konversi Poin Resmi Hong Kong Mahjong Style (Half-Spicy / 半辣)
    |--------------------------------------------------------------------------
    | Mengikuti standar internasional Hong Kong Old Style (HKOS):
    | - Poin Discard (Buang Lawan): 8, 16, 24, 32, 48, 64, 96, 128 (Cap 10 Fan)
    | - Poin Zi Mo (Tarik Sendiri): 1.5x total payout (4, 8, 12, 16, 24, 32, 48, 64 per lawan)
    */
    'fan_points_table' => [
        3 => ['points' => 8, 'discard' => 8, 'self_draw_total' => 12, 'self_draw_each' => 4],
        4 => ['points' => 16, 'discard' => 16, 'self_draw_total' => 24, 'self_draw_each' => 8],
        5 => ['points' => 24, 'discard' => 24, 'self_draw_total' => 36, 'self_draw_each' => 12],
        6 => ['points' => 32, 'discard' => 32, 'self_draw_total' => 48, 'self_draw_each' => 16],
        7 => ['points' => 48, 'discard' => 48, 'self_draw_total' => 72, 'self_draw_each' => 24],
        8 => ['points' => 64, 'discard' => 64, 'self_draw_total' => 96, 'self_draw_each' => 32],
        9 => ['points' => 96, 'discard' => 96, 'self_draw_total' => 144, 'self_draw_each' => 48],
        10 => ['points' => 128, 'discard' => 128, 'self_draw_total' => 192, 'self_draw_each' => 64],
        11 => ['points' => 192, 'discard' => 192, 'self_draw_total' => 288, 'self_draw_each' => 96],
        12 => ['points' => 256, 'discard' => 256, 'self_draw_total' => 384, 'self_draw_each' => 128],
        13 => ['points' => 384, 'discard' => 384, 'self_draw_total' => 576, 'self_draw_each' => 192],
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
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Keempat triplet angin lengkap (Timur, Selatan, Barat, Utara).',
        ],
        'four_winds' => [
            'code' => 'four_winds',
            'name' => 'Great Four Winds',
            'name_id' => 'Empat Angin Besar (Big 4 Winds)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Seluruh 4 triplet angin lengkap (Timur, Selatan, Barat, Utara).',
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
        'four_kongs' => [
            'code' => 'four_kongs',
            'name' => 'Four Kongs (18 Luohan)',
            'name_id' => 'Empat Kong (Four Kongs)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Membuat 4 set quadruplet (Kong) dalam satu tangan.',
        ],
        'all_green' => [
            'code' => 'all_green',
            'name' => 'All Green (Ryuuiisou)',
            'name_id' => 'Serba Hijau (All Green)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Hanya menggunakan tile bambu 2, 3, 4, 6, 8 dan naga hijau.',
        ],
        'heavenly_hand' => [
            'code' => 'heavenly_hand',
            'name' => 'Heavenly Hand (Tian Hu)',
            'name_id' => 'Kemenangan Surgawi (Tian Hu)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Dealer menang seketika pada 14 tile awal pembagian tanpa draw tambahan.',
        ],
        'earthly_hand' => [
            'code' => 'earthly_hand',
            'name' => 'Earthly Hand (Di Hu)',
            'name_id' => 'Kemenangan Bumi (Di Hu)',
            'fan' => 10,
            'is_limit' => true,
            'category' => 'special',
            'description' => 'Non-dealer menang seketika pada buangan pertama dealer.',
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
