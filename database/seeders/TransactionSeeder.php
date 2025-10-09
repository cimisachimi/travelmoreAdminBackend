<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Order; // <-- ADD THIS LINE
use App\Models\Transaction; // <-- ADD THIS LINE
use App\Models\HolidayPackage; // <-- ADD THIS LINE
use Illuminate\Support\Str;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user1 = User::find(1);
        $user2 = User::find(2);
        $package1 = HolidayPackage::find(1);
        $package2 = HolidayPackage::find(2);

        if (!$user1 || !$user2 || !$package1 || !$package2) {
            echo "Please ensure users and holiday packages are seeded first.\n";
            return;
        }

        // --- Create a sample Order 1 ---
        $order1 = Order::create([
            'user_id' => $user1->id,
            'order_number' => 'ORD-'.strtoupper(Str::random(8)),
            'total_amount' => $package1->price,
            'status' => 'paid',
        ]);

        // Create the transaction for Order 1
        Transaction::create([
            'user_id' => $user1->id,
            'order_id' => $order1->id,
            'status' => 'success',
            'gross_amount' => $order1->total_amount,
            'payment_type' => 'credit_card',
        ]);

        // --- Create a sample Order 2 ---
        $order2 = Order::create([
            'user_id' => $user2->id,
            'order_number' => 'ORD-'.strtoupper(Str::random(8)),
            'total_amount' => $package2->price,
            'status' => 'pending',
        ]);
        
        // Create the transaction for Order 2
        Transaction::create([
            'user_id' => $user2->id,
            'order_id' => $order2->id,
            'status' => 'pending',
            'gross_amount' => $order2->total_amount,
            'payment_type' => 'bank_transfer',
        ]);
    }
}