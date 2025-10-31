<?php
// app/Http/Controllers/Api/BookingController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CarRental;
use App\Models\TripPlanner;
use App\Models\Activity;
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
use App\Models\DiscountCode; // ✅ ADD THIS
use Illuminate\Validation\ValidationException; // ✅ ADD THIS


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
            'discount_code' => 'nullable|string|exists:discount_codes,code'
        ]);

        $user = Auth::user();
        $package = HolidayPackage::findOrFail($packageId);

        $adultsCount = $validated['adults'];
        $childrenCount = $validated['children'] ?? 0;
        $totalPax = $adultsCount + $childrenCount;

        $pricePerPax = $package->getPricePerPax($totalPax);

        if ($pricePerPax === null) {
            return response()->json([
                'message' => 'Pricing is not available for the selected number of participants.'
            ], 400);
        }

        $subtotal = $pricePerPax * $totalPax; // This is the original price
        $discountAmount = 0;
        $discountCodeId = null;

        // [FIX] Initialize $discountCode to null
        $discountCode = null;

        // --- START DISCOUNT LOGIC ---
        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();

            if (!$discountCode || !$discountCode->isValid()) {
                // This will stop execution and send a 422 response
                throw ValidationException::withMessages([
                    'discount_code' => 'This discount code is invalid or has expired.',
                ]);
            }

            $discountAmount = $discountCode->calculateDiscount($subtotal);
            $discountCodeId = $discountCode->id;
        }
        // --- END DISCOUNT LOGIC ---

        $totalPrice = $subtotal - $discountAmount; // This is the final, discounted price

        // [FIX from previous step] Calculate Down Payment based on original $subtotal
        $downPayment = $subtotal * 0.5; // DP is 50% of the *original* price

        $paymentDeadline = now()->addHours(2);

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-PKG-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalPrice,
                'discount_code_id' => $discountCodeId,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment, // This is 50% of subtotal
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
                    'price_per_pax' => $pricePerPax,
                    'original_subtotal' => $subtotal,
                    'discount_applied' => $discountAmount
                ]
            ]);

            $order->booking_id = $booking->id;
            $order->save();

            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $package->id,
                'orderable_type' => HolidayPackage::class,
                'quantity' => $totalPax,
                'price' => $pricePerPax,
            ]);

            // This check is now safe because $discountCode is guaranteed to be either null or an object
            if ($discountCode) {
                $discountCode->increment('uses');
            }

            DB::commit();

            return response()->json($order->load('orderItems.orderable', 'booking.bookable'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Holiday package booking failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create booking: ' . $e->getMessage()], 500);
        }
    }
    public function bookActivity(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'adults' => 'required|integer|min:1',
            'children' => 'required|integer|min:0',
        ]);

        $user = Auth::user();
        $totalPax = $validated['adults'] + $validated['children'];

        // Get price directly from the activity model
        $pricePerPax = $activity->price_per_pax;

        if ($totalPax <= 0) {
            return response()->json(['message' => 'Total participants must be at least 1.'], 400);
        }

        if ($pricePerPax <= 0) {
            return response()->json(['message' => 'This activity cannot be booked as its price is not set.'], 400);
        }

        // Calculate total price
        $totalPrice = $pricePerPax * $totalPax;

        // Create the Order
        $order = new Order([
            'user_id' => $user->id,
            'booking_id' => 'TM-' . Str::upper(Str::random(8)),
            'total_price' => $totalPrice,
            'status' => 'pending', // Default status
            'payment_status' => 'pending',
            'booking_details' => json_encode([
                'start_date' => $validated['start_date'],
                'adults' => $validated['adults'],
                'children' => $validated['children'],
            ]),
        ]);

        $order->save();

        // Create the Order Item
        $orderItem = new OrderItem([
            'order_id' => $order->id,
            'orderable_id' => $activity->id,
            'orderable_type' => Activity::class,
            'name' => $activity->translateOrDefault(app()->getLocale())->name ?? $activity->getTranslation('en', true)->name,
            'quantity' => $totalPax,
            'price' => $pricePerPax,
            'subtotal' => $totalPrice,
        ]);

        $order->items()->save($orderItem);

        // Return the created order (or just a success response)
        return response()->json($order->load('items'), 201);
    }
    public function storeActivityBooking(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'quantity' => 'required|integer|min:1',
            // Add other activity-specific fields like 'participants' if needed
        ]);

        if ($activity->status !== 'active') {
            return response()->json(['message' => 'This activity is not available.'], 400);
        }

        $user = Auth::user();
        $totalPrice = $activity->price * $validated['quantity'];
        $downPayment = $totalPrice * 0.5; // 50% DP
        $paymentDeadline = Carbon::now()->addHours(2);

        try {
            DB::beginTransaction();

            // 1. Create Order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-ACT-' . strtoupper(Str::random(6)) . time(),
                'total_amount' => $totalPrice,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);

            // 2. Create OrderItem
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $activity->id,
                'orderable_type' => Activity::class,
                'quantity' => $validated['quantity'],
                'price' => $activity->price,
            ]);

            // 3. Create Booking
            $booking = $activity->bookings()->create([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'booking_date' => $validated['booking_date'],
                'start_date' => $validated['booking_date'], // Use booking_date for start_date
                'details' => [
                    'quantity' => $validated['quantity'],
                    // Store other details if any
                ],
            ]);

            // 4. Link Order to Booking
            $order->booking_id = $booking->id;
            $order->save();

            DB::commit();

            return response()->json([
                'message' => 'Activity booked successfully. Please complete payment.',
                'payment_deadline' => $paymentDeadline->toIso8601String(),
                'order' => $order->load('orderItems.orderable', 'booking.bookable'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Activity booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'Booking failed.'], 500);
        }
}}
