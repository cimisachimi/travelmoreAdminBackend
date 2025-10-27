<?php
// app/Http/Controllers/Api/BookingController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CarRental;
use App\Models\TripPlanner;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CarRentalAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\HolidayPackage;

class BookingController extends Controller
{
    /**
     * Store a newly created car rental booking in storage.
     */
    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        // Validation remains the same
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'total_price' => 'required|numeric|min:0',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $user = Auth::user();

        // Availability check remains the same
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

            $totalPrice = $validated['total_price'];
            $downPayment = $totalPrice * 0.5; // ✅ Calculate 50% DP
            $paymentDeadline = Carbon::now()->addHours(2); // ✅ Set 2-hour deadline

            // 1. Create the Order with DP and Deadline
            $order = new Order([
                'user_id' => $user->id,
                'order_number' => 'ORD-CAR-' . strtoupper(Str::random(6)) . time(),
                'total_amount' => $totalPrice,
                'status' => 'pending', // Initial status
                'payment_deadline' => $paymentDeadline, // ✅ Store deadline
                'down_payment_amount' => $downPayment, // ✅ Store 50% DP amount
            ]);
            $order->save();

            // 2. Create the OrderItem (remains the same)
            $orderItem = new OrderItem([
                'order_id' => $order->id,
                'orderable_id' => $carRental->id,
                'orderable_type' => CarRental::class,
                'quantity' => 1,
                'price' => $totalPrice,
            ]);
            $orderItem->save();

            // 3. Create the Booking (remains the same)
            $booking = new Booking([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'booking_date' => $startDate,
                'details' => ['from_controller' => 'storeCarRentalBooking'],
            ]);
            $carRental->bookings()->save($booking);

            // 4. Link the Order to the Booking
            $order->booking_id = $booking->id;
            $order->save();

            // 5. UPDATE AVAILABILITY (remains the same)
            CarRentalAvailability::where('car_rental_id', $carRental->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->update(['status' => 'booked']);

            DB::commit();

            return response()->json([
                'message' => 'Booking created successfully. You have 2 hours to complete the payment.',
                'payment_deadline' => $paymentDeadline->toIso8601String(), // Send deadline to frontend
                'order' => $order->load('orderItems.orderable', 'booking.bookable'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Car rental booking failed: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json(['message' => 'An error occurred during booking. Please try again.'], 500);
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
        $booking->load('bookable', 'order.transaction');
        return response()->json($booking);
    }

    /**
     * Update the specified booking in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        // Add Admin authorization check here if needed
        if ($booking->user_id !== Auth::id() /* && !Auth::user()->isAdmin() */) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled',
            // 'payment_status' => 'sometimes|in:unpaid,paid,partial', // Usually handled by payment gateway
        ]);

        $booking->update($validated);
        return response()->json($booking);
    }

    /**
     * Store a booking for a Trip Planner.
     *
     * [--- UPDATED FUNCTION ---]
     */
    public function storeTripPlannerBooking(Request $request)
    {
        $user = Auth::user();
        
        // 1. Find the planner associated with this user.
        $tripPlanner = TripPlanner::where('user_id', $user->id)->firstOrFail();

        $tripDate = $tripPlanner->departure_date ?? now()->toDateString();
        $totalPrice = $tripPlanner->price; // Get price from the planner
        
        // 2. Set payment details
        $downPayment = $totalPrice * 0.5; // 50% DP
        $paymentDeadline = Carbon::now()->addHours(2); // 2-hour deadline

        // --- START DATABASE TRANSACTION ---
        try {
            DB::beginTransaction();

            // 3. Create the Order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-PLAN-' . strtoupper(Str::random(6)) . time(),
                'total_amount' => $totalPrice,
                'status' => 'pending', // Initial status
                'payment_deadline' => $paymentDeadline, // Store deadline
                'down_payment_amount' => $downPayment, // Store 50% DP amount
            ]);

            // 4. Create the Booking
            $booking = $tripPlanner->bookings()->create([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'booking_date' => $tripDate,
                'start_date' => $tripDate,
                'end_date' => null, // Planners might not have an end date
                'details' => [
                    'full_name' => $tripPlanner->full_name,
                    'email' => $tripPlanner->email,
                    'trip_type' => $tripPlanner->trip_type,
                    'travel_type' => $tripPlanner->travel_type,
                ]
            ]);

            // 5. Link the Order to the Booking
            $order->booking_id = $booking->id;
            $order->save();

            // 6. [CRITICAL FIX] Create the OrderItem
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $tripPlanner->id,
                'orderable_type' => TripPlanner::class,
                'quantity' => 1,
                'price' => $totalPrice,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Booking created successfully. Please proceed to payment.',
                'booking' => $booking->load('bookable'),
                'order' => $order,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Trip planner booking failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'An error occurred while creating the booking.'], 500);
        }
        // --- END DATABASE TRANSACTION ---
    }

    /**
     * Store a booking for a Holiday Package.
     *
     * [--- THIS IS THE CORRECT, UPDATED VERSION ---]
     */
    public function storeHolidayPackageBooking(Request $request, $packageId)
    {
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'adults' => 'required|integer|min:1',
            'children' => 'sometimes|integer|min:0',
        ]);

        $user = Auth::user();
        $package = HolidayPackage::findOrFail($packageId);

        $adultsCount = $validated['adults'];
        $childrenCount = $validated['children'] ?? 0;
        $totalPax = $adultsCount + $childrenCount;

        // --- [CORRECT] Get Price Per Pax using the model method ---
        $pricePerPax = $package->getPricePerPax($totalPax);

        // --- [CORRECT] Check if a price was found ---
        if ($pricePerPax === null) {
            return response()->json([
                'message' => 'Pricing is not available for the selected number of participants.'
            ], 400);
        }

        $totalPrice = $pricePerPax * $totalPax;
        $downPayment = $totalPrice * 0.5; 
        $paymentDeadline = now()->addHours(2);

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-PKG-' . strtoupper(Str::random(6)) . time(),
                'total_amount' => $totalPrice,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);

            $booking = $package->bookings()->create([
                'user_id' => $user->id,
                'booking_date' => $validated['start_date'],
                'start_date' => $validated['start_date'],
                'end_date' => Carbon::parse($validated['start_date'])->addDays($package->duration - 1)->toDateString(),
                'status' => 'pending',
                'total_price' => $totalPrice,
                'payment_status' => 'unpaid',
                'details' => [
                    'adults' => $adultsCount,
                    'children' => $childrenCount,
                    'total_pax' => $totalPax,
                    'price_per_pax' => $pricePerPax, // Store the calculated price
                ]
            ]);

            $order->booking_id = $booking->id;
            $order->save();

            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $package->id,
                'orderable_type' => HolidayPackage::class,
                'quantity' => $totalPax, // Quantity is total participants
                'price' => $pricePerPax, // Store the calculated price per pax
            ]);

            DB::commit();

            return response()->json($order->load('orderItems.orderable', 'booking.bookable'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Holiday package booking failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create booking: ' . $e->getMessage()], 500);
        }
    }
}