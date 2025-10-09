<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Booking;
use Illuminate\Support\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $user1 = User::find(1);
        $user2 = User::find(2);
        // We need to create bookings first to link them
        if (Booking::count() < 2) {
             Booking::factory()->count(2)->create();
        }
        $booking1 = Booking::first();
        $booking2 = Booking::skip(1)->first();

        // Ensure users exist before trying to use them
        if (!$user1 || !$user2 || !$booking1 || !$booking2) {
            echo "Please seed users and bookings first.\n";
            return;
        }

        DB::table('transactions')->insert([
            [
                'user_id' => $user1->id,
                'booking_id' => $booking1->id,
                'status' => 'success',
                'gross_amount' => 1250.00,
                'payment_type' => 'credit_card',
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'user_id' => $user2->id,
                'booking_id' => $booking2->id,
                'status' => 'pending',
                'gross_amount' => 2800.50,
                'payment_type' => 'bank_transfer',
                'created_at' => Carbon::now()->subDay(),
                'updated_at' => Carbon::now()->subDay(),
            ],
        ]);
    }
}