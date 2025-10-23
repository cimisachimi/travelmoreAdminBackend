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
use Carbon\Carbon; // ✅ Make sure Carbon is imported
use App\Models\HolidayPackage; // ✅ PASTIKAN DI-IMPORT
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
                'order_number' => 'ORD-' . strtoupper(Str::random(10)),
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
            // ✅ This is correct: mark as 'booked' immediately to reserve.
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
     */
    public function storeTripPlannerBooking(Request $request)
    {
        $validated = $request->validate([
            'trip_planner_id' => 'required|exists:trip_planners,id',
            // Maybe add date validation if Trip Planners have specific dates
        ]);

        $user = Auth::user();
        $tripPlanner = TripPlanner::findOrFail($validated['trip_planner_id']);

        $tripDate = $tripPlanner->departure_date ?? now()->toDateString();

        // --- START DATABASE TRANSACTION ---
        try {
            DB::beginTransaction();

            // 1. Create the Booking
            $booking = new Booking([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $tripPlanner->price,
                'booking_date' => $tripDate,
                'start_date' => $tripDate,
                'end_date' => $tripDate,
            ]);

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
            return response()->json(['message' => 'An error occurred while creating the booking.'], 500);
        }
        // --- END DATABASE TRANSACTION ---
    }

    public function storeHolidayPackageBooking(Request $request, $packageId)
    {
        // 1. Validasi Input
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'adults' => 'required|integer|min:1',
            'children' => 'required|integer|min:0',
        ]);

        $user = Auth::user();
        $package = HolidayPackage::findOrFail($packageId);

        // 2. Kalkulasi Harga
        // Ambil harga dari Accessor model untuk konsistensi
        $adultPrice = $package->exclusivePrice * $validated['adults'];
        $childPrice = $package->childPrice * $validated['children'];
        $totalPrice = $adultPrice + $childPrice;

        // 3. Mulai Transaksi Database
        DB::beginTransaction();
        try {
            // 3a. Buat Booking
            $booking = $package->bookings()->create([
                'user_id' => $user->id,
                'start_date' => $validated['start_date'],
                // Paket liburan mungkin tidak punya end_date, bisa null
                'end_date' => null, 
                'status' => 'pending',
                'price' => $totalPrice,
            ]);

            // 3b. Buat Order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-PKG-' . strtoupper(Str::random(6)) . time(),
                'total_amount' => $totalPrice,
                'status' => 'pending',
                'booking_id' => $booking->id, // Tautkan ke booking
            ]);

            // 3c. Buat Order Item
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $package->id,
                'orderable_type' => HolidayPackage::class,
                'name' => $package->name,
                'quantity' => 1, // 1 paket
                'price' => $totalPrice,
                'options' => [ // Simpan detail jumlah orang
                    'start_date' => $validated['start_date'],
                    'adults' => $validated['adults'],
                    'children' => $validated['children'],
                    'duration_days' => $package->duration,
                ]
            ]);

            // 4. Commit Transaksi
            DB::commit();

            // 5. Kembalikan data Order (frontend akan pindah ke halaman pembayaran)
            return response()->json($order, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat booking: ' . $e->getMessage()], 500);
        }
    }
}