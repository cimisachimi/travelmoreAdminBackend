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
        DB::table('holiday_packages')->insert([
            [
                'name' => 'Bali Tropical Paradise',
                'description' => 'Experience the stunning beaches and vibrant culture of Bali.',
                'number_of_days' => 7,
                'price' => 1200.00,
                'accommodation_details' => '4-star resort with ocean views, daily breakfast included.',
                'itinerary' => json_encode([
                    ['day' => 1, 'activity' => 'Arrival in Denpasar, transfer to resort.'],
                    ['day' => 2, 'activity' => 'Surfing lessons at Kuta Beach.'],
                    ['day' => 3, 'activity' => 'Ubud Monkey Forest and rice terraces tour.'],
                ]),
                'min_age' => 18,
                'max_age' => 65,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Japanese Cultural Journey',
                'description' => 'Explore the ancient temples of Kyoto and the bustling city of Tokyo.',
                'number_of_days' => 10,
                'price' => 2500.50,
                'accommodation_details' => 'Mix of traditional Ryokans and modern city hotels.',
                'itinerary' => json_encode([
                    ['day' => 1, 'activity' => 'Arrive in Tokyo, explore Shinjuku.'],
                    ['day' => 2, 'activity' => 'Visit Senso-ji Temple and Tokyo Skytree.'],
                    ['day' => 3, 'activity' => 'Bullet train to Kyoto.'],
                    ['day' => 4, 'activity' => 'Kinkaku-ji and Fushimi Inari Shrine.'],
                ]),
                'min_age' => null,
                'max_age' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Italian Riviera Escape',
                'description' => 'Discover the charming coastal towns of Cinque Terre.',
                'number_of_days' => 5,
                'price' => 950.75,
                'accommodation_details' => 'Boutique hotel in Monterosso al Mare.',
                'itinerary' => json_encode([
                    ['day' => 1, 'activity' => 'Arrival in La Spezia, check-in.'],
                    ['day' => 2, 'activity' => 'Hike from Monterosso to Vernazza.'],
                    ['day' => 3, 'activity' => 'Boat tour of the five towns.'],
                ]),
                'min_age' => 16,
                'max_age' => 70,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Family Adventure in Costa Rica',
                'description' => 'Ziplining, wildlife, and rainforest exploration for the whole family.',
                'number_of_days' => 8,
                'price' => 1800.00,
                'accommodation_details' => 'Eco-lodges and family-friendly resorts.',
                'itinerary' => json_encode([
                    ['day' => 1, 'activity' => 'Arrive in San José.'],
                    ['day' => 2, 'activity' => 'Arenal Volcano hike.'],
                    ['day' => 3, 'activity' => 'Ziplining through the Monteverde Cloud Forest.'],
                ]),
                'min_age' => 8,
                'max_age' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}