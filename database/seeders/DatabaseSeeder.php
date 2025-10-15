<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class, // Add this line
            HolidayPackageSeeder::class,
            ActivitySeeder::class,
            CarRentalSeeder::class,
            // You can add other seeders here as well
        ]);
    }
}