<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CarRental;
use App\Models\CarRentalTranslation;

class CarRentalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cars = [
            [
                'car_model' => 'Avanza',
                'brand' => 'Toyota',
                'car_type' => 'MPV',
                'transmission' => 'Automatic',
                'fuel_type' => 'Gasoline',
                'capacity' => 7,
                'trunk_size' => 3,
                'price_per_day' => 500000.00,
                'features' => ['Air Conditioning', 'AM/FM Stereo Radio', 'Cruise Control'],
                'description' => 'A reliable and spacious MPV for family trips.',
                'translations' => [
                    'id' => 'MPV yang andal dan lapang untuk perjalanan keluarga.'
                ]
            ],
            [
                'car_model' => 'Xpander',
                'brand' => 'Mitsubishi',
                'car_type' => 'MPV',
                'transmission' => 'Automatic',
                'fuel_type' => 'Gasoline',
                'capacity' => 7,
                'trunk_size' => 3,
                'price_per_day' => 550000.00,
                'features' => ['Air Conditioning', 'AM/FM Stereo Radio', 'GPS'],
                'description' => 'A modern and comfortable MPV with great features.',
                'translations' => [
                    'id' => 'MPV modern dan nyaman dengan fitur-fitur hebat.'
                ]
            ],
        ];

        foreach ($cars as $carData) {
            $car = CarRental::create([
                'car_model' => $carData['car_model'],
                'brand' => $carData['brand'],
                'car_type' => $carData['car_type'],
                'transmission' => $carData['transmission'],
                'fuel_type' => $carData['fuel_type'],
                'capacity' => $carData['capacity'],
                'trunk_size' => $carData['trunk_size'],
                'price_per_day' => $carData['price_per_day'],
                'features' => $carData['features'],
                'description' => $carData['description']
            ]);

            foreach ($carData['translations'] as $locale => $description) {
                CarRentalTranslation::create([
                    'car_rental_id' => $car->id,
                    'locale' => $locale,
                    'description' => $description,
                ]);
            }
        }
    }
}