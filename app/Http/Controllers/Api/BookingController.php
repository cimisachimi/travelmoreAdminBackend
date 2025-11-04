<?php

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
use App\Models\DiscountCode;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Store a newly created car rental booking in storage.
     *
     * ✅ THIS FUNCTION HAS BEEN FIXED
     */
    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            // ✅ FIX: Removed 'total_price' from validation. We calculate it on the server.
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $user = Auth::user();

        // Availability check
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

        try {
            DB::beginTransaction();

            // ✅ FIX: Calculate price securely on the server
            $pricePerDay = $carRental->price_per_day;
            $totalPrice = $pricePerDay * $requestedDays; // This is the subtotal
            $downPayment = $totalPrice * 0.5; // Calculate 50% DP
            $paymentDeadline = Carbon::now()->addHours(2);

            // 1. Create the Order
            $order = new Order([
                'user_id' => $user->id,
                'order_number' => 'ORD-CAR-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $totalPrice, // ✅ FIX: Added subtotal
                'discount_amount' => 0, // ✅ FIX: Added discount_amount
                'total_amount' => $totalPrice,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);
            $order->save();

            // 2. Create the OrderItem
            $orderItem = new OrderItem([
                'order_id' => $order->id,
                'orderable_id' => $carRental->id,
                'orderable_type' => CarRental::class,
                'name' => $carRental->brand . ' ' . $carRental->car_model, // ✅ FIX: Added item name
                'quantity' => $requestedDays, // ✅ FIX: Use calculated days
                'price' => $pricePerDay, // ✅ FIX: Use price per day
            ]);
            $orderItem->save();

            // 3. Create the Booking
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

            // 5. UPDATE AVAILABILITY
            CarRentalAvailability::where('car_rental_id', $carRental->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->update(['status' => 'booked']);

            DB::commit();

            return response()->json([
                'message' => 'Booking created successfully. You have 2 hours to complete the payment.',
                'payment_deadline' => $paymentDeadline->toIso8601String(),
                'order' => $order->load('orderItems.orderable', 'booking.bookable'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Car rental booking failed: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json(['message' => 'An error occurred during booking. Please try again.'], 500);
        }
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
        if ($booking->user_id !== Auth::id() /* && !Auth::user()->isAdmin() */) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled',
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
            'discount_code' => 'nullable|string|exists:discount_codes,code'
        ]);

        $user = Auth::user();
        $tripPlanner = TripPlanner::where('user_id', $user->id)->firstOrFail();
        $tripDate = $tripPlanner->departure_date ?? now()->toDateString();
        $subtotal = $tripPlanner->price;

        $discountAmount = 0;
        $discountCodeId = null;
        $discountCode = null;

        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();
            if (!$discountCode || !$discountCode->isValid()) {
                throw ValidationException::withMessages([
                    'discount_code' => 'This discount code is invalid or has expired.',
                ]);
            }
            $discountAmount = $discountCode->calculateDiscount($subtotal);
            $discountCodeId = $discountCode->id;
        }

        $totalPrice = $subtotal - $discountAmount;
        $downPayment = $subtotal * 0.5; // DP is 50% of the *original* price
        $paymentDeadline = Carbon::now()->addHours(2);

        try {
            DB::beginTransaction();

            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-PLAN-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalPrice,
                'discount_code_id' => $discountCodeId,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);

            $booking = $tripPlanner->bookings()->create([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'booking_date' => $tripDate,
                'start_date' => $tripDate,
                'end_date' => null,
                'details' => [
                    'full_name' => $tripPlanner->full_name,
                    'email' => $tripPlanner->email,
                    'trip_type' => $tripPlanner->trip_type,
                    'travel_type' => $tripPlanner->travel_type,
                    'original_subtotal' => $subtotal,
                    'discount_applied' => $discountAmount
                ]
            ]);

            $order->booking_id = $booking->id;
            $order->save();

            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $tripPlanner->id,
                'orderable_type' => TripPlanner::class,
                'name' => 'Custom Trip Plan', // ✅ FIX: Added a descriptive name
                'quantity' => 1,
                'price' => $subtotal,
            ]);

            if ($discountCode) {
                $discountCode->increment('uses');
            }

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
    }

    /**
     * Store a booking for a Holiday Package.
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

        $subtotal = $pricePerPax * $totalPax;
        $discountAmount = 0;
        $discountCodeId = null;
        $discountCode = null;

        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();

            if (!$discountCode || !$discountCode->isValid()) {
                throw ValidationException::withMessages([
                    'discount_code' => 'This discount code is invalid or has expired.',
                ]);
            }

            $discountAmount = $discountCode->calculateDiscount($subtotal);
            $discountCodeId = $discountCode->id;
        }

        $totalPrice = $subtotal - $discountAmount;
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
                'name' => $package->name, // ✅ FIX: Added item name
                'quantity' => $totalPax,
                'price' => $pricePerPax,
            ]);

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

    // ✅ FIX: REMOVED the duplicate `bookActivity` function that was here.

    /**
     * Store a booking for an Activity.
     *
     * ✅ THIS IS THE CORRECT, FINAL VERSION
     */
    public function storeActivityBooking(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($activity->status !== 'active') {
            return response()->json(['message' => 'This activity is not available.'], 400);
        }

        $user = Auth::user();
        $totalPax = $validated['quantity'];
        $pricePerPax = $activity->price; // Use the 'price' attribute

        $subtotal = $pricePerPax * $totalPax;
        $totalPrice = $subtotal; // No discounts for activities... yet
        $downPayment = $totalPrice * 0.5; // 50% DP
        $paymentDeadline = Carbon::now()->addHours(2);

        try {
            DB::beginTransaction();

            // 1. Create Order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-ACT-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $subtotal, // ✅ FIX: Added subtotal
                'discount_amount' => 0, // ✅ FIX: Added discount_amount
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
                'name' => $activity->name, // ✅ FIX: Added item name
                'quantity' => $validated['quantity'],
                'price' => $pricePerPax,
            ]);

            // 3. Create Booking
            $booking = $activity->bookings()->create([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'booking_date' => $validated['booking_date'],
                'start_date' => $validated['booking_date'],
                'details' => [
                    'quantity' => $validated['quantity'],
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
    }
}
