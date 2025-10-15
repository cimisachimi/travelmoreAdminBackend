<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarRental;
use App\Models\Order; // Import the Order model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    // ... other methods

    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date|after_or_equal:today',
            'pickup_location' => 'required|string|max:255',
        ]);

        $isUnavailable = $carRental->availabilities()
            ->where('date', $validated['booking_date'])
            ->whereIn('status', ['booked', 'maintenance'])
            ->exists();

        if ($isUnavailable) {
            return response()->json(['message' => 'This car is unavailable for the selected date.'], 409);
        }

        // Create the Order
        $order = Order::create([
            'user_id' => Auth::id(),
            'total_amount' => $carRental->price_per_day,
            'status' => 'pending', // The order itself is pending until paid
        ]);

        // Attach the Car Rental as an OrderItem
        $order->orderItems()->create([
            'orderable_id' => $carRental->id,
            'orderable_type' => CarRental::class,
            'price' => $carRental->price_per_day,
            'details' => [
                'booking_date' => $validated['booking_date'],
                'pickup_location' => $validated['pickup_location'],
            ]
        ]);

        // Mark the date as booked
        $carRental->availabilities()->updateOrCreate(
            ['date' => $validated['booking_date']],
            ['status' => 'booked']
        );

        return response()->json([
            'message' => 'Order created successfully! Please proceed to payment.',
            'order' => $order,
        ], 201);
    }
}