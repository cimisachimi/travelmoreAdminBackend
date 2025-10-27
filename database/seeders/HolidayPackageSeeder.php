<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HolidayPackage;
use Illuminate\Support\Facades\DB;

class HolidayPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Kosongkan tabel terkait
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('holiday_packages')->truncate();
        DB::table('holiday_package_translations')->truncate();
        // Hapus juga gambar terkait jika ada
        DB::table('images')->where('imageable_type', 'App\Models\HolidayPackage')->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // --- PAKET 1: YOGYAKARTA 3D2N (Classic) ---
        // (Data dari "Harga Paket 3D 1N" - Asumsi 3D2N)
        $pkg1_itinerary = [
            ["day" => 1, "title" => "Puthuk Sethumbu & Borobudur Area", "description" => "Penjemputan, Puthuk Sethumbu, Gereja Ayam Borobudur, Candi Borobudur."],
            ["day" => 1, "title" => "Prambanan & Ratu Boko", "description" => "Candi Prambanan, Candi Ratu Boko (Sunset)."],
            ["day" => 2, "title" => "City Tour & Pantai", "description" => "Kraton Yogyakarta, Tamansari, Workshop Batik, Gumuk Pasir, Pantai Parangtritis (Sunset)."],
            ["day" => 3, "title" => "Merapi Sunrise", "description" => "Sunrise Lava Tour Merapi, pengantaran ke bandara/stasiun."]
        ];
        $pkg1_cost = [
            "included" => ["transport", "guide", "tiket masuk", "makan", "akomodasi (2 malam)", "dokumentasi standar"],
            "excluded" => ["tiket pesawat", "tip guide/driver", "keperluan pribadi"]
        ];
        $pkg1_faqs = [
            ["question" => "Apakah harga bisa disesuaikan?", "answer" => "Ya, harga disesuaikan kembali bila peserta < 2 pax (private), upgrade hotel ke Villa/Resort, atau ada permintaan add-ons."]
        ];
        $pkg1_trip_info = [
            ["label" => "Durasi", "value" => "3 Hari 2 Malam", "icon" => "🕒"],
            ["label" => "Catatan", "value" => "Harga disesuaikan untuk < 2 pax, hotel Villa/Resort, atau add-ons.", "icon" => "ℹ️"]
        ];
        $pkg1_price_tiers = [
            ["min_pax" => 1, "max_pax" => 1, "price" => 6375000],
            ["min_pax" => 2, "max_pax" => 2, "price" => 4100000],
            ["min_pax" => 3, "max_pax" => 3, "price" => 3450000],
            ["min_pax" => 4, "max_pax" => 4, "price" => 3000000],
            ["min_pax" => 5, "max_pax" => 5, "price" => 2700000],
            ["min_pax" => 6, "max_pax" => 10, "price" => 2300000],
            ["min_pax" => 11, "max_pax" => 15, "price" => 2000000],
            ["min_pax" => 16, "max_pax" => 20, "price" => 1750000],
        ];

        $pkg1_data = [
            'duration' => 3,
            'rating' => 4.8,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
            'price_tiers' => $pkg1_price_tiers, // [UPDATED]
            'itinerary' => $pkg1_itinerary,     // [FIX] Pass as array
            'cost' => $pkg1_cost,                // [FIX] Pass as array
            'faqs' => $pkg1_faqs,                // [FIX] Pass as array
            'trip_info' => $pkg1_trip_info,      // [FIX] Pass as array
        ];
        $pkg1_translations = [
            'en' => [
                'name' => 'Yogyakarta Classic Tour 3D2N',
                'description' => 'A 3-day, 2-night tour exploring the main temples (Borobudur, Prambanan) and cultural city center.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Cultural Tour'
            ],
            'id' => [
                'name' => 'Tur Klasik Yogyakarta 3 Hari 2 Malam',
                'description' => 'Tur 3 hari 2 malam menjelajahi candi-candi utama (Borobudur, Prambanan) dan pusat kota budaya.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Tur Budaya'
            ]
        ];
        $package1 = HolidayPackage::create($pkg1_data);
        foreach ($pkg1_translations as $locale => $data) {
            $package1->translateOrNew($locale)->fill($data);
        }
        $package1->save();


        // --- PAKET 2: YOGYAKARTA 2D1N (Compact) ---
        $pkg2_itinerary = [
            ["day" => 1, "title" => "Puthuk Sethumbu & Borobudur Area", "description" => "Penjemputan, Puthuk Sethumbu, Gereja Ayam Borobudur, Candi Borobudur."],
            ["day" => 1, "title" => "Prambanan", "description" => "Mengunjungi Candi Prambanan."],
            ["day" => 2, "title" => "City Tour & Pantai", "description" => "Kraton Yogyakarta, Tamansari, Workshop Batik, Gumuk Pasir, Pantai Parangtritis (Sunset), pengantaran kembali."]
        ];
        $pkg2_cost = [
            "included" => ["transport", "guide", "tiket masuk", "makan", "akomodasi (1 malam)", "dokumentasi standar"],
            "excluded" => ["tiket pesawat", "tip guide/driver", "keperluan pribadi"]
        ];
        $pkg2_faqs = [
             ["question" => "Apakah harga bisa disesuaikan?", "answer" => "Ya, harga disesuaikan kembali bila peserta < 2 pax (private) atau upgrade hotel."]
        ];
        $pkg2_trip_info = [["label" => "Durasi", "value" => "2 Hari 1 Malam", "icon" => "🕒"]];
        $pkg2_price_tiers = [
            ["min_pax" => 1, "max_pax" => 1, "price" => 4060000],
            ["min_pax" => 2, "max_pax" => 2, "price" => 2800000],
            ["min_pax" => 3, "max_pax" => 3, "price" => 2300000],
            ["min_pax" => 4, "max_pax" => 4, "price" => 2100000],
            ["min_pax" => 5, "max_pax" => 5, "price" => 1900000],
            ["min_pax" => 6, "max_pax" => 10, "price" => 1600000],
            ["min_pax" => 11, "max_pax" => 15, "price" => 1400000],
            ["min_pax" => 16, "max_pax" => 20, "price" => 1250000],
        ];

        $pkg2_data = [
            'duration' => 2,
            'rating' => 4.7,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
            'price_tiers' => $pkg2_price_tiers, // [UPDATED]
            'itinerary' => $pkg2_itinerary,     // [FIX] Pass as array
            'cost' => $pkg2_cost,                // [FIX] Pass as array
            'faqs' => $pkg2_faqs,                // [FIX] Pass as array
            'trip_info' => $pkg2_trip_info,      // [FIX] Pass as array
        ];
        $pkg2_translations = [
            'en' => [
                'name' => 'Yogyakarta Compact Tour 2D1N',
                'description' => 'A compact 2-day, 1-night tour covering Borobudur, Prambanan, and the city center.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Short Trip'
            ],
            'id' => [
                'name' => 'Tur Ringkas Yogyakarta 2 Hari 1 Malam',
                'description' => 'Tur ringkas 2 hari 1 malam mencakup Borobudur, Prambanan, dan pusat kota.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Perjalanan Singkat'
            ]
        ];
        $package2 = HolidayPackage::create($pkg2_data);
        foreach ($pkg2_translations as $locale => $data) {
            $package2->translateOrNew($locale)->fill($data);
        }
        $package2->save();


        // --- PAKET 3: YOGYAKARTA 1 DAY (Temple Focus) ---
        $pkg3_itinerary = [
            ["day" => 1, "title" => "Sunrise, Borobudur & Prambanan", "description" => "Penjemputan pagi untuk sunrise di Puthuk Sethumbu, mengunjungi Gereja Ayam, Candi Borobudur, Candi Prambanan, dan sunset di Candi Ratu Boko. Pengantaran kembali."]
        ];
        $pkg3_cost = [
            "included" => ["transport", "guide", "tiket masuk", "makan", "dokumentasi standar"],
            "excluded" => ["akomodasi", "tiket pesawat", "tip guide/driver", "keperluan pribadi"]
        ];
        $pkg3_faqs = [
            ["question" => "Apakah paket ini termasuk akomodasi?", "answer" => "Tidak, paket 1 hari tidak termasuk akomodasi menginap."]
        ];
        $pkg3_trip_info = [["label" => "Durasi", "value" => "1 Hari (Full Day)", "icon" => "🕒"]];
        $pkg3_price_tiers = [
            ["min_pax" => 1, "max_pax" => 1, "price" => 1690000],
            ["min_pax" => 2, "max_pax" => 2, "price" => 1200000],
            ["min_pax" => 3, "max_pax" => 3, "price" => 1000000],
            ["min_pax" => 4, "max_pax" => 4, "price" => 900000],
            ["min_pax" => 5, "max_pax" => 5, "price" => 800000],
            ["min_pax" => 6, "max_pax" => 10, "price" => 700000],
            ["min_pax" => 11, "max_pax" => 15, "price" => 600000],
            ["min_pax" => 16, "max_pax" => 20, "price" => 550000],
        ];

        $pkg3_data = [
            'duration' => 1,
            'rating' => 4.5,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
            'price_tiers' => $pkg3_price_tiers, // [UPDATED]
            'itinerary' => $pkg3_itinerary,     // [FIX] Pass as array
            'cost' => $pkg3_cost,                // [FIX] Pass as array
            'faqs' => $pkg3_faqs,                // [FIX] Pass as array
            'trip_info' => $pkg3_trip_info,      // [FIX] Pass as array
        ];
         $pkg3_translations = [
            'en' => [
                'name' => 'Yogyakarta 1 Day Temple Tour',
                'description' => 'A full-day tour focusing on the magnificent temples of Borobudur and Prambanan.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'One Day Tour'
            ],
            'id' => [
                'name' => 'Tur Candi Yogyakarta 1 Hari',
                'description' => 'Tur sehari penuh fokus pada candi megah Borobudur dan Prambanan.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Tur Sehari'
            ]
        ];
        $package3 = HolidayPackage::create($pkg3_data);
        foreach ($pkg3_translations as $locale => $data) {
            $package3->translateOrNew($locale)->fill($data);
        }
        $package3->save();


        // --- PAKET 4: YOGYAKARTA 3D2N (Scenic Views) ---
        // (Data dari "Harga Paket 3D 2N")
        $pkg4_itinerary = [
            ["day" => 1, "title" => "Sunrise, Temples & Scenic Sunset", "description" => "Puthuk Setumbu (Sunrise View), Gereja Ayam Borobudur, Candi Borobudur, Candi Prambanan, dan Heha Sky View."],
            ["day" => 2, "title" => "City Culture & Coastal View", "description" => "Kraton Yogyakarta, Taman Sari, dan Obelix Sea View."],
            ["day" => 3, "title" => "Merapi Volcano Tour", "description" => "Jeep Lava Tour Merapi, kemudian pengantaran ke bandara/stasiun."]
        ];
        $pkg4_cost = [
            "included" => ["Transport selama tour", "Driver & BBM", "Tour guide lokal", "Tiket masuk destinasi wisata", "Akomodasi hotel 2 malam", "Makan 3x/hari", "Air mineral selama perjalanan", "Dokumentasi standar"],
            "excluded" => ["Pengeluaran pribadi (oleh-oleh, laundry, snack tambahan)", "Upgrade hotel (villa/resort)", "Dokumentasi profesional (photographer, drone, videographer)", "Tiket transport dari/ke Yogyakarta (kereta/pesawat)"]
        ];
        $pkg4_faqs = [
            ["question" => "Apa saja add-ons yang tersedia?", "answer" => "Photographer (Rp 500.000/day), Drone Footage (Rp 800.000/day), Videographer (Rp 700.000/day), Upgrade Hotel 4 stars (+Rp 250.000/pax), Private Dinner di Heha (+Rp 200.000/pax)."],
            ["question" => "Apa saja catatan penting?", "answer" => "Minimum booking 2 pax. Reservasi minimal H-3. Harga berlaku hingga Desember 2025."]
        ];
        $pkg4_trip_info = [
            ["label" => "Durasi", "value" => "3 Hari 2 Malam", "icon" => "🕒"],
            ["label" => "Booking", "value" => "Minimal 2 pax, H-3", "icon" => "✔️"],
            ["label" => "Validitas", "value" => "Hingga Des 2025", "icon" => "CAL"]
        ];
        $pkg4_price_tiers = [
            ["min_pax" => 1, "max_pax" => 1, "price" => 4030000],
            ["min_pax" => 2, "max_pax" => 2, "price" => 2700000],
            ["min_pax" => 3, "max_pax" => 3, "price" => 2200000],
            ["min_pax" => 4, "max_pax" => 4, "price" => 1950000],
            ["min_pax" => 5, "max_pax" => 5, "price" => 1750000],
            ["min_pax" => 6, "max_pax" => 10, "price" => 1550000],
            ["min_pax" => 11, "max_pax" => 15, "price" => 1350000],
            ["min_pax" => 16, "max_pax" => 20, "price" => 1200000],
        ];

        $pkg4_data = [
            'duration' => 3,
            'rating' => 4.9,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
            'price_tiers' => $pkg4_price_tiers, // [UPDATED]
            'itinerary' => $pkg4_itinerary,     // [FIX] Pass as array
            'cost' => $pkg4_cost,                // [FIX] Pass as array
            'faqs' => $pkg4_faqs,                // [FIX] Pass as array
            'trip_info' => $pkg4_trip_info,      // [FIX] Pass as array
        ];
         $pkg4_translations = [
            'en' => [
                'name' => 'Yogyakarta Scenic Tour 3D2N',
                'description' => 'A 3-day, 2-night tour focusing on sunrise views, scenic spots like Heha & Obelix, and cultural sites.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Scenic Tour'
            ],
            'id' => [
                'name' => 'Tur Pemandangan Yogyakarta 3 Hari 2 Malam',
                'description' => 'Tur 3 hari 2 malam fokus pada pemandangan matahari terbit, titik pemandangan seperti Heha & Obelix, dan situs budaya.',
                'location' => 'Yogyakarta, Indonesia',
                'category' => 'Tur Pemandangan'
            ]
        ];
        $package4 = HolidayPackage::create($pkg4_data);
         foreach ($pkg4_translations as $locale => $data) {
            $package4->translateOrNew($locale)->fill($data);
        }
        $package4->save();

    }
}