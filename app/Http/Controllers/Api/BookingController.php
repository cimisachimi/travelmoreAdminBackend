<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CarRental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    /**
     * Store a newly created car rental booking in storage.
     * This method aligns with your Booking model.
     */
    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'total_price' => 'required|numeric',
        ]);

        $booking = $carRental->bookings()->create([
            'user_id' => Auth::id(),
            'booking_date' => $validated['start_date'], // Main date for the booking
            'status' => 'pending',
            'payment_status' => 'pending',
            'total_price' => $validated['total_price'],
            'details' => [ // Store extra info like the date range in the details field
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
            ->latest() // Show most recent bookings first
            ->get();

        return response()->json($bookings);
    }

    /**
     * Display a specific booking.
     */
    public function show(Booking $booking)
    {
        // Authorize that the user owns the booking
        if ($booking->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $booking->load('bookable');

        return response()->json($booking);
    }

    // --- Other booking methods for future use ---
    // public function bookHolidayPackage(Request $request) { ... }
    // public function bookActivity(Request $request) { ... }
}