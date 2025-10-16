<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CarRental; // Make sure CarRental is imported
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    /**
     * Store a newly created car rental booking in storage.
     */
    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'total_price' => 'required|numeric',
        ]);

        // ✅ FIXED: Using the polymorphic relationship `bookings()`
        // This automatically sets bookable_id and the correctly formatted bookable_type.
        $booking = $carRental->bookings()->create([
            'user_id' => Auth::id(),
            'booking_date' => $validated['start_date'],
            'status' => 'pending',
            'payment_status' => 'pending',
            'total_price' => $validated['total_price'],
            'details' => [
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
            ],
        ]);

        return response()->json($booking, 201);
    }

    /**
     * Display a listing of the user's bookings.
     */
    public function index()
    {
        $bookings = Booking::with('bookable')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json($bookings);
    }

    /**
     * Display a specific booking.
     */
    public function show(Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $booking->load('bookable');
        return response()->json($booking);
    }

    /**
     * Update the specified booking in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled',
            'payment_status' => 'sometimes|in:unpaid,paid,partial',
        ]);

        $booking->update($validated);
        return response()->json($booking);
    }
}