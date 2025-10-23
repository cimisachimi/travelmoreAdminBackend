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
            ["question" => "Berapa harga per-pax (3D2N Classic)?", "answer" => "1 pax: Rp 6.375.000, 2 pax: Rp 4.100.000, 3 pax: Rp 3.450.000, 4 pax: Rp 3.000.000, 5 pax: Rp 2.700.000, 6-10 pax: Rp 2.300.000, 11-15 pax: Rp 2.000.000, 16-20 pax: Rp 1.750.000"]
        ];
        $pkg1_trip_info = [
            ["label" => "Durasi", "value" => "3 Hari 2 Malam", "icon" => "🕒"],
            ["label" => "Catatan", "value" => "Harga disesuaikan untuk < 2 pax, hotel Villa/Resort, atau add-ons.", "icon" => "ℹ️"]
        ];

        // Pisahkan data terjemahan dan non-terjemahan
        $pkg1_data = [
            'duration' => 3,
            'price_regular' => 6375000,
            'price_exclusive' => 2300000,
            'rating' => 4.8,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
            // --- FIX: Encode array ke JSON ---
            'itinerary' => json_encode($pkg1_itinerary),
            'cost' => json_encode($pkg1_cost),
            'faqs' => json_encode($pkg1_faqs),
            'trip_info' => json_encode($pkg1_trip_info),
            // --- AKHIR FIX ---
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
        // Buat package lalu tambahkan terjemahan
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
            ["question" => "Berapa harga per-pax (2D1N Compact)?", "answer" => "1 pax: Rp 4.060.000, 2 pax: Rp 2.800.000, 3 pax: Rp 2.300.000, 4 pax: Rp 2.100.000, 5 pax: Rp 1.900.000, 6-10 pax: Rp 1.600.000, 11-15 pax: Rp 1.400.000, 16-20 pax: Rp 1.250.000"]
        ];
         $pkg2_trip_info = [["label" => "Durasi", "value" => "2 Hari 1 Malam", "icon" => "🕒"]];

        $pkg2_data = [
            'duration' => 2,
            'price_regular' => 4060000,
            'price_exclusive' => 1600000,
            'rating' => 4.7,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
            // --- FIX: Encode array ke JSON ---
            'itinerary' => json_encode($pkg2_itinerary),
            'cost' => json_encode($pkg2_cost),
            'faqs' => json_encode($pkg2_faqs),
            'trip_info' => json_encode($pkg2_trip_info),
             // --- AKHIR FIX ---
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
            ["day" => 1, "title" => "Puthuk Sethumbu", "description" => "Penjemputan pagi hari untuk sunrise di Puthuk Sethumbu."],
            ["day" => 1, "title" => "Gereja Ayam & Borobudur", "description" => "Mengunjungi Gereja Ayam dan Candi Borobudur."],
            ["day" => 1, "title" => "Prambanan & Ratu Boko", "description" => "Mengunjungi Candi Prambanan dan sunset di Candi Ratu Boko. Pengantaran kembali."]
        ];
        $pkg3_cost = [
            "included" => ["transport", "guide", "tiket masuk", "makan", "dokumentasi standar"],
            "excluded" => ["akomodasi", "tiket pesawat", "tip guide/driver", "keperluan pribadi"]
        ];
        $pkg3_faqs = [
            ["question" => "Berapa harga per-pax (1 Day)?", "answer" => "1 pax: Rp 1.690.000, 2 pax: Rp 1.200.000, 3 pax: Rp 1.000.000, 4 pax: Rp 900.000, 5 pax: Rp 800.000, 6-10 pax: Rp 700.000, 11-15 pax: Rp 600.000, 16-20 pax: Rp 550.000"]
        ];
         $pkg3_trip_info = [["label" => "Durasi", "value" => "1 Hari (Full Day)", "icon" => "🕒"]];

        $pkg3_data = [
            'duration' => 1,
            'price_regular' => 1690000,
            'price_exclusive' => 700000,
            'rating' => 4.5,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
             // --- FIX: Encode array ke JSON ---
            'itinerary' => json_encode($pkg3_itinerary),
            'cost' => json_encode($pkg3_cost),
            'faqs' => json_encode($pkg3_faqs),
            'trip_info' => json_encode($pkg3_trip_info),
             // --- AKHIR FIX ---
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
        $pkg4_itinerary = [
            ["day" => 1, "title" => "Borobudur & Prambanan", "description" => "Puthuk Setumbu (Sunrise), Gereja Ayam, Candi Borobudur, Candi Prambanan."],
            ["day" => 1, "title" => "Heha Sky View", "description" => "Menikmati sunset dan malam di Heha Sky View."],
            ["day" => 2, "title" => "City Tour & Scenic View", "description" => "Kraton Yogyakarta, Taman Sari, Obelix Sea View."],
            ["day" => 3, "title" => "Lava Tour Merapi", "description" => "Jeep Lava Tour Merapi, pengantaran ke bandara/stasiun."]
        ];
        $pkg4_cost = [
            "included" => ["Transport selama tour", "Driver & BBM", "Tour guide lokal", "Tiket masuk destinasi wisata", "Akomodasi hotel 2 malam", "Makan 3x/hari", "Air mineral", "Dokumentasi standar"],
            "excluded" => ["Pengeluaran pribadi (oleh-oleh, laundry)", "Upgrade hotel (villa/resort)", "Dokumentasi profesional (photographer, drone)", "Tiket transport dari/ke Yogyakarta"]
        ];
        $pkg4_faqs = [
            ["question" => "Berapa harga per-pax (3D2N Scenic)?", "answer" => "1 pax: Rp 4.030.000, 2 pax: Rp 2.700.000, 3 pax: Rp 2.200.000, 4 pax: Rp 1.950.000, 5 pax: Rp 1.750.000, 6-10 pax: Rp 1.550.000, 11-15 pax: Rp 1.350.000, 16-20 pax: Rp 1.200.000"],
            ["question" => "Apa saja add-ons yang tersedia?", "answer" => "Photographer: Rp 500.000/day, Drone Footage: Rp 800.000/day, Videographer: Rp 700.000/day, Upgrade Hotel (4 stars): +Rp 250.000/pax, Private Dinner (Heha): +Rp 200.000/pax"]
        ];
        $pkg4_trip_info = [
            ["label" => "Durasi", "value" => "3 Hari 2 Malam", "icon" => "🕒"],
            ["label" => "Booking", "value" => "Minimal 2 pax, H-3", "icon" => "✔️"],
            ["label" => "Validitas", "value" => "Hingga Desember 2025", "icon" => "CAL"] // Ganti emoji kalender jika perlu
        ];

        $pkg4_data = [
            'duration' => 3,
            'price_regular' => 4030000,
            'price_exclusive' => 1550000,
            'rating' => 4.9,
            'map_url' => 'https://maps.app.goo.gl/y531t2D7gS3sY2aK9',
             // --- FIX: Encode array ke JSON ---
            'itinerary' => json_encode($pkg4_itinerary),
            'cost' => json_encode($pkg4_cost),
            'faqs' => json_encode($pkg4_faqs),
            'trip_info' => json_encode($pkg4_trip_info),
             // --- AKHIR FIX ---
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