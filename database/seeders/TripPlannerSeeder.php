<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class TripPlannerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('trip_planners')->insert([
            [
                'type' => 'personal',
                'trip_type' => 'domestic',
                'full_name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'phone' => '081234567890',
                'company_name' => null,
                'brand_name' => null,
                'province' => 'Bali',
                'city' => 'Ubud',
                'address' => '123 Monkey Forest St',
                'postal_code' => '80571',
                'country' => 'Indonesia',
                'pax_adults' => 2,
                'pax_teens' => 0,
                'pax_kids' => 0,
                'pax_seniors' => 0,
                'departure_date' => Carbon::now()->addMonths(2),
                'duration' => '7 Days',
                'travel_type' => 'Leisure',
                'budget_pack' => 'Comfort',
                'addons' => json_encode(['Private Guide', 'Travel Insurance']),
                'travel_style' => json_encode(['Relaxed', 'Cultural']),
                'travel_personality' => json_encode(['Explorer']),
                'food_preference' => json_encode(['Local Cuisine']),
                'consent' => true,
                'is_frequent_traveler' => 'Yes, several times a year',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type' => 'company',
                'trip_type' => 'foreign',
                'full_name' => 'Jane Smith',
                'email' => 'jane.smith@corporate.com',
                'phone' => '08111222333',
                'company_name' => 'Tech Corp',
                'brand_name' => 'Tech Corp Inc.',
                'province' => null,
                'city' => 'Singapore',
                'address' => null,
                'postal_code' => null,
                'country' => 'Singapore',
                'pax_adults' => 15,
                'pax_teens' => 0,
                'pax_kids' => 0,
                'pax_seniors' => 0,
                'departure_date' => Carbon::now()->addMonths(4),
                'duration' => '3 Days',
                'travel_type' => 'Business/MICE',
                'budget_pack' => 'Exclusive',
                'addons' => json_encode(['Airport Transfer', 'MICE Equipment']),
                'travel_style' => json_encode(['Fast-Paced']),
                'travel_personality' => json_encode(['Social']),
                'food_preference' => json_encode(['Fine Dining']),
                'consent' => true,
                'is_frequent_traveler' => 'Yes, for business',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Add more entries if you wish
        ]);
    }
}