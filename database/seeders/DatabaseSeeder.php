<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash; // Import Hash

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Panggil seeder individual
        $this->call([
            UserSeeder::class,
            CarRentalSeeder::class,
            HolidayPackageSeeder::class,
            // Tambahkan seeder lain di sini jika perlu
        ]);
    }
}

// BUAT FILE INI JIKA ANDA BELUM MEMILIKINYA
// (Atau tambahkan ke DatabaseSeeder.php jika Anda lebih suka)
// file: database/seeders/UserSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Buat Admin User
        User::updateOrCreate(
            ['email' => 'admin@travelmore.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'), // Ganti 'password' dengan password yang kuat
                'role' => 'admin',
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]
        );

        // Buat User Biasa (Opsional)
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'password' => Hash::make('password'),
                'role' => 'user',
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]
        );
    }
}