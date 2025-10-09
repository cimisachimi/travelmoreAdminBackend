<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CarRentalSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate the table first to avoid duplicates if you re-seed
        DB::table('car_rentals')->truncate();
        
        DB::table('car_rentals')->insert([
            [
                'name' => 'Toyota Avanza',
                'brand' => 'Toyota',
                'description' => 'The most popular 7-seater MPV in Indonesia, perfect for families. (Manual/Automatic)',
                'price_per_day' => 25.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Daihatsu Xenia',
                'brand' => 'Daihatsu',
                'description' => 'A fuel-efficient and reliable family car, twin to the Avanza.',
                'price_per_day' => 25.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Toyota Kijang Innova Reborn',
                'brand' => 'Toyota',
                'description' => 'A more spacious and comfortable premium MPV for a better travel experience.',
                'price_per_day' => 40.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mitsubishi Xpander',
                'brand' => 'Mitsubishi',
                'description' => 'A stylish and modern 7-seater with a comfortable ride.',
                'price_per_day' => 35.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}