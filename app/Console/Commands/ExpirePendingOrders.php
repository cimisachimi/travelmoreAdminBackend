<?php
// app/Console/Commands/ExpirePendingOrders.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\CarRental;
use App\Models\CarRentalAvailability;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpirePendingOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:expire-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find pending/processing orders past their payment deadline and expire them.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Log::info('Running ExpirePendingOrders job...');
        $now = Carbon::now();

        // Find orders past deadline, but NOT 'partially_paid' or 'paid'.
        $expiredOrders = Order::with('booking.bookable')
            ->whereIn('status', ['pending', 'processing'])
            ->where('payment_deadline', '<=', $now)
            ->get();

        if ($expiredOrders->isEmpty()) {
            Log::info('ExpirePendingOrders job: No expired orders found.');
            $this->info('No expired orders found.');
            return;
        }

        $this->info('Found ' . $expiredOrders->count() . ' expired orders. Processing...');
        Log::info('ExpirePendingOrders job: Found ' . $expiredOrders->count() . ' expired orders.');

        foreach ($expiredOrders as $order) {
            try {
                DB::transaction(function () use ($order) {
                    $order->status = 'expired';
                    $order->save();

                    if ($order->booking) {
                        $order->booking->status = 'cancelled';
                        $order->booking->payment_status = 'unpaid';
                        $order->booking->save();

                        // Check if it's a CarRental and release availability
                        if ($order->booking->bookable instanceof CarRental) {
                            $this->releaseCarRentalAvailability(
                                $order->booking->bookable,
                                $order->booking->start_date,
                                $order->booking->end_date
                            );
                        }
                        // Add 'elseif' for other types (e.g., HolidayPackage) if needed
                    }
                    
                    Log::info('Expired Order ID: ' . $order->id . ' by system job.');
                });
            } catch (\Exception $e) {
                Log::error('Failed to expire Order ID: ' . $order->id, ['error' => $e->getMessage()]);
            }
        }

        $this->info('ExpirePendingOrders job: Finished processing.');
        Log::info('ExpirePendingOrders job: Finished processing.');
    }

    /**
     * Helper function to release availability.
     */
    protected function releaseCarRentalAvailability(CarRental $carRental, $startDate, $endDate)
    {
        if ($startDate && $endDate) {
            try {
                $affectedRows = CarRentalAvailability::where('car_rental_id', $carRental->id)
                    ->whereBetween('date', [Carbon::parse($startDate), Carbon::parse($endDate)])
                    ->where('status', 'booked')
                    ->update(['status', 'available']);
                
                Log::info('Job released availability for CarRental ID: ' . $carRental->id . '. Rows: ' . $affectedRows);
            } catch (\Exception $e) {
                Log::error('Job failed to release availability for CarRental ID: ' . $carRental->id, ['error' => $e->getMessage()]);
            }
        }
    }
}