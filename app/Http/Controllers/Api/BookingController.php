<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CarRental;
use App\Models\TripPlanner;
use App\Models\Order; // ✅ ADD THIS
use App\Models\CarRentalAvailability; // ✅ ADD THIS
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // ✅ ADD THIS
use Illuminate\Support\Facades\Log; // ✅ ADD THIS
use Illuminate\Support\Str;
use Carbon\Carbon; // ✅ ADD THIS

class BookingController extends Controller
{
    /**
     * Store a newly created car rental booking in storage.
     */
    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        // ✅ FIXED VALIDATION
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'total_price' => 'required|numeric|min:0',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $user = Auth::user();

        // --- START AVAILABILITY CHECK ---
        if ($carRental->status !== 'available') {
             return response()->json(['message' => 'This car is not available for booking.'], 422);
        }
        $requestedDays = $startDate->diffInDays($endDate) + 1;
        $availableDays = CarRentalAvailability::where('car_rental_id', $carRental->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('status', 'available')
            ->count();
        if ($availableDays < $requestedDays) {
            return response()->json(['message' => 'The selected dates are not available for this car.'], 422);
        }
        // --- END AVAILABILITY CHECK ---

        // --- START DATABASE TRANSACTION ---
        try {
            DB::beginTransaction();

            // 1. Create the Booking
            $booking = new Booking([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $validated['total_price'],
                
                // ✅ Fills all date columns correctly
                'booking_date' => $startDate, // For legacy/single-day use
                'start_date' => $startDate,   // For multi-day car rentals
                'end_date' => $endDate,     // For multi-day car rentals
                
                'details' => [
                    'from_controller' => 'storeCarRentalBooking'
                ],
            ]);

            // Save booking linked to the car
            $carRental->bookings()->save($booking);

            // 2. Create the Order
            $order = new Order([
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'orderable_id' => $carRental->id,
                'orderable_type' => CarRental::class,
                'total_amount' => $validated['total_price'],
                'status' => 'pending',
                'order_number' => 'ORD-' . Str::uuid(),
            ]);
            $order->save();

            // 3. UPDATE AVAILABILITY
            CarRentalAvailability::where('car_rental_id', $carRental->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->update(['status' => 'booked']);
            
            DB::commit();

            return response()->json([
                'message' => 'Booking created successfully. Please proceed to payment.',
                'booking' => $booking->load('bookable'), // 'bookable' is correct
                'order' => $order,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Car rental booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred. Please try again.'], 500);
        }
        // --- END DATABASE TRANSACTION ---
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

    /**
     * Store a booking for a Trip Planner.
     */
    public function storeTripPlannerBooking(Request $request)
    {
        $validated = $request->validate([
            'trip_planner_id' => 'required|exists:trip_planners,id',
            // You can add date validation here if needed
        ]);

        $user = Auth::user();
        $tripPlanner = TripPlanner::findOrFail($validated['trip_planner_id']);
        
        $tripDate = $tripPlanner->departure_date ?? now(); // Get trip date or use today

        // --- START DATABASE TRANSACTION ---
        try {
            DB::beginTransaction();

            // 1. Create the Booking
            $booking = new Booking([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $tripPlanner->price,
                
                // Set all dates to the single trip date
                'booking_date' => $tripDate,
                'start_date' => $tripDate,
                'end_date' => $tripDate,
            ]);
            
            // Save booking linked to the trip planner
            $tripPlanner->bookings()->save($booking);

            // 2. Create the Order
            $order = new Order([
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'orderable_id' => $tripPlanner->id,
                'orderable_type' => TripPlanner::class,
                'total_amount' => $tripPlanner->price,
                'status' => 'pending',
                'order_number' => 'ORD-' . Str::uuid(),
            ]);
            $order->save();

            DB::commit();

            return response()->json([
                'message' => 'Booking created successfully. Please proceed to payment.',
                'booking' => $booking->load('bookable'),
                'order' => $order,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Trip planner booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred. Please try again.'], 500);
        }
        // --- END DATABASE TRANSACTION ---
    }
}