<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            // Clear previous data
            DB::table('activity_translations')->truncate();
            DB::table('activities')->truncate();
            DB::table('images')->where('imageable_type', Activity::class)->delete();

            // --- Activity 1: Snorkeling Adventure ---
            $act1 = Activity::create([
                'price' => 350000,
                'status' => 'active',
                'duration' => '3 Hours',
                // ✅ ADD ADDONS JSON DATA
                'addons' => [
                    ['name' => 'GoPro Rental', 'price' => 150000],
                    ['name' => 'Photographer', 'price' => 500000],
                    ['name' => 'Extra Towel', 'price' => 25000]
                ]
            ]);

            $act1->translations()->create([
                'locale' => 'en',
                'name' => 'Snorkeling Adventure',
                'description' => 'Explore the vibrant coral reefs and marine life in a guided snorkeling tour.',
                'location' => 'Blue Lagoon, Bali',
                'category' => 'Water Sport',
            ]);

            $act1->translations()->create([
                'locale' => 'id',
                'name' => 'Petualangan Snorkeling',
                'description' => 'Jelajahi terumbu karang yang indah dan kehidupan laut dalam tur snorkeling berpemandu.',
                'location' => 'Blue Lagoon, Bali',
                'category' => 'Olahraga Air',
            ]);

            // --- Activity 2: Ubud Cycling Tour ---
            $act2 = Activity::create([
                'price' => 450000,
                'status' => 'active',
                'duration' => 'Half Day',
                // ✅ ADD ADDONS JSON DATA
                'addons' => [
                    ['name' => 'Private Guide', 'price' => 300000],
                    ['name' => 'Drone Footage', 'price' => 750000]
                ]
            ]);

            $act2->translations()->create([
                'locale' => 'en',
                'name' => 'Ubud Cycling Tour',
                'description' => 'Cycle through scenic rice paddies, traditional villages, and enjoy the nature of Ubud.',
                'location' => 'Ubud, Bali',
                'category' => 'Tour',
            ]);

            $act2->translations()->create([
                'locale' => 'id',
                'name' => 'Tur Sepeda Ubud',
                'description' => 'Bersepeda melintasi sawah yang indah, desa-desa tradisional, dan nikmati alam Ubud.',
                'location' => 'Ubud, Bali',
                'category' => 'Tur',
            ]);

        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }
}
