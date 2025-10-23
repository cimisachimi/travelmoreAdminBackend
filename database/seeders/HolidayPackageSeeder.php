<?php

namespace Database\Seeders;

use App\Models\HolidayPackage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HolidayPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         DB::statement('SET FOREIGN_KEY_CHECKS=0;');
         HolidayPackage::truncate();
         DB::table('holiday_package_translations')->truncate();
         DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $packagesData = [
            [
                // Data utama (non-terjemahan)
                'main' => [
                    'duration' => 5,
                    'price_regular' => 5000000,
                    'price_exclusive' => 4500000,
                    'price_child' => 2250000,
                    'rating' => 4.8,
                    'map_url' => 'https://maps.google.com/maps?q=bali', // Gunakan URL valid
                    // Berikan array PHP biasa, biarkan $casts di model bekerja
                    'itinerary' => [['day'=>1, 'title'=>'Arrival in Bali', 'description'=>'Meet and greet...']],
                    'cost' => ['included'=>['Accommodation', 'Transport'], 'excluded'=>['Flights', 'Personal Expenses']],
                    'faqs' => [['question'=>'Is visa needed?', 'answer'=>'Depends on your nationality...']],
                    'trip_info' => [['label'=>'Group Size', 'value'=>'Max 15', 'icon'=>'👥']],
                ],
                // Data terjemahan
                'translations' => [
                    'en' => [
                        'name' => 'Amazing Bali Adventure',
                        'description' => 'Explore the natural and cultural beauty of Bali island over 5 days.',
                        'location' => 'Bali, Indonesia',
                        'category' => 'Adventure Tour',
                    ],
                    'id' => [
                        'name' => 'Petualangan Bali Menakjubkan',
                        'description' => 'Jelajahi keindahan alam dan budaya pulau Bali selama 5 hari.',
                        'location' => 'Bali, Indonesia',
                        'category' => 'Tur Petualangan',
                    ],
                ]
            ],
            [
                 'main' => [
                    'duration' => 3,
                    'price_regular' => 3000000,
                    'price_exclusive' => 2800000,
                    'rating' => 4.5,
                    'map_url' => 'https://maps.google.com/maps?q=yogyakarta', // Gunakan URL valid
                    // Berikan array PHP biasa
                    'itinerary' => [['day'=>1, 'title'=>'Yogyakarta City Tour', 'description'=>'Visit Keraton...']],
                    'cost' => ['included'=>['Guide', 'Entrance Fees'], 'excluded'=>['Meals', 'Transport']],
                    'faqs' => [], // Array kosong
                    'trip_info' => [['label'=>'Guide Language', 'value'=>'English, Indonesian', 'icon'=>'🗣️']],
                ],
                'translations' => [
                    'en' => [
                        'name' => 'Yogyakarta Cultural Escape',
                        'description' => 'Discover the rich culture of Yogyakarta.',
                        'location' => 'Yogyakarta, Indonesia',
                        'category' => 'Cultural Tour',
                    ],
                    'id' => [
                        'name' => 'Liburan Budaya Yogyakarta',
                        'description' => 'Temukan kekayaan budaya Yogyakarta.',
                        'location' => 'Yogyakarta, Indonesia',
                        'category' => 'Tur Budaya',
                    ],
                ]
            ],
            // --- Tambahkan data paket lainnya di sini ---
        ];

        foreach ($packagesData as $data) {
            // 1. Buat record utama TANPA data terjemahan
            // Eloquent $casts akan menangani konversi JSON di sini
            $package = HolidayPackage::create($data['main']);

            // 2. Loop melalui terjemahan dan simpan satu per satu
            foreach ($data['translations'] as $locale => $translationData) {
                $package->translateOrNew($locale)->fill($translationData);
            }
            // 3. Simpan semua terjemahan yang ditambahkan
            $package->save();
        }
    }
}