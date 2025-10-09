<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        // Truncate the table first
        DB::table('activities')->truncate();

        DB::table('activities')->insert([
            [
                'name' => 'Borobudur Sunrise Tour',
                'description' => 'Witness a breathtaking sunrise over the world\'s largest Buddhist temple.',
                'location' => 'Magelang, Central Java (near Yogyakarta)',
                'price' => 35.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Prambanan Temple Exploration',
                'description' => 'Explore the magnificent ancient Hindu temple complex, a UNESCO World Heritage site.',
                'location' => 'Yogyakarta',
                'price' => 25.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Jomblang Cave "Heaven\'s Light"',
                'description' => 'Descend into a vertical cave to see a spectacular ray of light shining down.',
                'location' => 'Gunung Kidul, Yogyakarta',
                'price' => 70.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Merapi Volcano Jeep Tour',
                'description' => 'An off-road adventure on the slopes of an active volcano, visiting villages affected by the last eruption.',
                'location' => 'Sleman, Yogyakarta',
                'price' => 30.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}