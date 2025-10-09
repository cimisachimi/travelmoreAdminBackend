<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\HolidayPackage;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Get a random user's ID from the database
            'user_id' => User::inRandomOrder()->first()->id,
            // Get a random holiday package's ID
            'holiday_package_id' => HolidayPackage::inRandomOrder()->first()->id,
            'booking_date' => Carbon::now()->addDays($this->faker->numberBetween(10, 60)),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'canceled']),
        ];
    }
}