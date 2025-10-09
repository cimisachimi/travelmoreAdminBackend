<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ... any other seeders you have

        $this->call([
            HolidayPackageSeeder::class,
            TripPlannerSeeder::class,
            TransactionSeeder::class, // Add this line
        ]);
    }
}