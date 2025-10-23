<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CarRental;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CarRentalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Kosongkan tabel terkait terlebih dahulu
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('car_rentals')->truncate();
        DB::table('images')->where('imageable_type', 'App\Models\CarRental')->delete();

        if (Schema::hasTable('car_rental_translations')) {
            DB::table('car_rental_translations')->truncate();
        }

        // --- TAMBAHKAN BARIS INI ---
        // Kosongkan tabel availabilities juga, karena Observer akan mengisinya
        if (Schema::hasTable('car_rental_availabilities')) {
            DB::table('car_rental_availabilities')->truncate();
        }
        // --- AKHIR TAMBAHAN ---

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $cars = [
            [
                'car_model' => 'Avanza FWD',
                'brand' => 'Toyota',
                'car_type' => 'MPV',
                'transmission' => 'Manual',
                'fuel_type' => 'Bensin',
                'capacity' => 6,
                'trunk_size' => 2,
                'description' => 'Tahun: 2023. Sudah termasuk Mobil + Driver + BBM (Full Day).',
                'features' => ['AC', 'Audio', 'Driver', 'BBM'],
                'price_per_day' => 650000,
                'availability' => true,
                'status' => 'available',
            ],
            [
                'car_model' => 'Innova (Premium)',
                'brand' => 'Toyota',
                'car_type' => 'MPV Premium',
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'capacity' => 7,
                'trunk_size' => 3,
                'description' => 'Tahun: 2023. Sudah termasuk Mobil + Driver + BBM (Full Day).',
                'features' => ['AC', 'Premium Audio', 'Driver', 'BBM', 'Reclining Seats'],
                'price_per_day' => 900000,
                'availability' => true,
                'status' => 'available',
            ],
            [
                'car_model' => 'Elf Long',
                'brand' => 'Isuzu',
                'car_type' => 'Minibus',
                'transmission' => 'Manual',
                'fuel_type' => 'Diesel',
                'capacity' => 19,
                'trunk_size' => 5,
                'description' => 'Tahun: 2022. Sudah termasuk Mobil + Driver + BBM (Full Day).',
                'features' => ['AC', 'TV', 'Karaoke', 'Driver', 'BBM'],
                'price_per_day' => 1200000,
                'availability' => true,
                'status' => 'available',
            ],
            [
                'car_model' => 'Hiace Commuter',
                'brand' => 'Toyota',
                'car_type' => 'Minibus',
                'transmission' => 'Manual',
                'fuel_type' => 'Diesel',
                'capacity' => 14,
                'trunk_size' => 4,
                'description' => 'Tahun: 2022. Sudah termasuk Mobil + Driver + BBM (Full Day).',
                'features' => ['AC', 'TV', 'Driver', 'BBM'],
                'price_per_day' => 1300000,
                'availability' => true,
                'status' => 'available',
            ],
            [
                'car_model' => 'Hiace Premio (Premium)',
                'brand' => 'Toyota',
                'car_type' => 'Minibus Premium',
                'transmission' => 'Manual',
                'fuel_type' => 'Diesel',
                'capacity' => 11,
                'trunk_size' => 4,
                'description' => 'Tahun: 2023. Sudah termasuk Mobil + Driver + BBM (Full Day).',
                'features' => ['AC', 'Premium Interior', 'TV', 'Driver', 'BBM'],
                'price_per_day' => 1500000,
                'availability' => true,
                'status' => 'available',
            ],
        ];

        foreach ($cars as $carData) {
            // Langsung create ke model CarRental
            CarRental::create($carData); // Observer akan dipanggil di sini untuk mengisi availability
        }
    }
}