<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'holiday_package_id' => 'required|exists:holiday_packages,id',
            'booking_date' => 'required|date|after_or_equal:today',
        ]);

        $booking = Booking::create([
            'user_id' => auth()->id(),
            'holiday_package_id' => $validatedData['holiday_package_id'],
            'booking_date' => $validatedData['booking_date'],
        ]);

        return response()->json($booking, 201);
    }
       public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date|after_or_equal:today',
            'pickup_location' => 'required|string|max:255',
        ]);

        // Check if the car is already booked on that date
        $isBooked = $carRental->availabilities()
            ->where('date', $validated['booking_date'])
            ->where('status', 'booked')
            ->exists();

        if ($isBooked) {
            return response()->json(['message' => 'This car is already booked for the selected date.'], 409); // 409 Conflict
        }

        // Create the booking record
        $booking = Booking::create([
            'user_id' => Auth::id(),
            'bookable_id' => $carRental->id,
            'bookable_type' => CarRental::class,
            'booking_date' => $validated['booking_date'],
            'status' => 'pending', // Or 'confirmed' depending on your workflow
            'details' => [
                'pickup_location' => $validated['pickup_location'],
            ]
        ]);

        // Update the car's availability for that date
        $carRental->availabilities()->updateOrCreate(
            ['date' => $validated['booking_date']],
            ['status' => 'booked']
        );

        return response()->json([
            'message' => 'Booking successful!',
            'booking' => $booking,
        ], 201);
    }
}
