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
}