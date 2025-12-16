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
use Carbon\CarbonPeriod;
use App\Models\HolidayPackage;
use App\Models\DiscountCode;
use Illuminate\Validation\ValidationException;
use App\Models\Setting;
use App\Models\OpenTrip;

class BookingController extends Controller
{
    /**
     * 💰 CHECK PRICE & DISCOUNT ENDPOINT
     * Call this from the frontend "Apply Code" button to preview totals.
     */
    public function checkPrice(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:car_rental,activity,holiday_package,open_trip,trip_planner',
            'id'   => 'required|integer',
            'discount_code' => 'nullable|string|exists:discount_codes,code',

            // Contextual inputs based on type
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'quantity'   => 'nullable|integer|min:1', // Activity Pax
            'adults'     => 'nullable|integer|min:1', // Package/Trip Pax
            'children'   => 'nullable|integer|min:0', // Package/Trip Pax
            'selected_addons' => 'nullable|array'
        ]);

        try {
            $subtotal = 0;
            $itemName = '';

            // 1. Calculate Subtotal based on Type
            switch ($validated['type']) {
                case 'car_rental':
                    $car = CarRental::findOrFail($validated['id']);
                    $start = Carbon::parse($validated['start_date']);
                    $end = Carbon::parse($validated['end_date']);
                    $days = $start->diffInDays($end) + 1;
                    $subtotal = $car->price_per_day * $days;
                    $itemName = "{$car->brand} {$car->car_model} ({$days} Days)";
                    break;

                case 'activity':
                    $activity = Activity::findOrFail($validated['id']);
                    $qty = $validated['quantity'] ?? 1;
                    $subtotal = $activity->price * $qty;
                    $itemName = "{$activity->name} ({$qty} Pax)";

                    // Activity Add-ons
                    if (!empty($validated['selected_addons'])) {
                        $availableAddons = collect($activity->addons ?? []);
                        foreach ($validated['selected_addons'] as $addonName) {
                            $addon = $availableAddons->firstWhere('name', $addonName);
                            if ($addon) $subtotal += ($addon['price'] ?? 0);
                        }
                    }
                    break;

                case 'holiday_package':
                    $pkg = HolidayPackage::findOrFail($validated['id']);
                    $pax = ($validated['adults'] ?? 1) + ($validated['children'] ?? 0);
                    // Use model helper for tiered pricing if available, else base price
                    $pricePerPax = method_exists($pkg, 'getPricePerPax') ? $pkg->getPricePerPax($pax) : $pkg->price;
                    if (!$pricePerPax) throw new \Exception("Pricing unavailable for this pax count");

                    $subtotal = $pricePerPax * $pax;
                    $itemName = "{$pkg->name} ({$pax} Pax)";

                    // Package Add-ons
                    if (!empty($validated['selected_addons'])) {
                        $availableAddons = collect($pkg->addons ?? []);
                        foreach ($validated['selected_addons'] as $addonName) {
                            $addon = $availableAddons->firstWhere('name', $addonName);
                            if ($addon) $subtotal += ($addon['price'] ?? 0);
                        }
                    }
                    break;

                case 'open_trip':
                    $trip = OpenTrip::findOrFail($validated['id']);
                    $pax = ($validated['adults'] ?? 1) + ($validated['children'] ?? 0);
                    $subtotal = $trip->starting_from_price * $pax;
                    $itemName = "{$trip->name} ({$pax} Pax)";

                    // Open Trip Add-ons
                    if (!empty($validated['selected_addons'])) {
                        $availableAddons = collect($trip->addons ?? []);
                        foreach ($validated['selected_addons'] as $addonName) {
                            $addon = $availableAddons->firstWhere('name', $addonName);
                            if ($addon) $subtotal += ($addon['price'] ?? 0);
                        }
                    }
                    break;

                case 'trip_planner':
                    $setting = Setting::where('key', 'trip_planner_price')->first();
                    $subtotal = $setting ? (float)$setting->value : 0;
                    $itemName = "Trip Planning Service";
                    break;
            }

            // 2. Calculate Discount
            $discountAmount = 0;
            $codeDetails = null;

            if (!empty($validated['discount_code'])) {
                $code = DiscountCode::where('code', $validated['discount_code'])->first();
                if ($code && $code->isValid()) {
                    $discountAmount = $code->calculateDiscount($subtotal);
                    $codeDetails = [
                        'code' => $code->code,
                        'type' => $code->type,
                        'value' => $code->value
                    ];
                } else {
                    return response()->json(['message' => 'Invalid or expired discount code'], 422);
                }
            }

            return response()->json([
                'product' => $itemName,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => max(0, $subtotal - $discountAmount),
                'applied_code' => $codeDetails
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Calculation error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created CAR RENTAL booking.
     */
    public function storeCarRentalBooking(Request $request, CarRental $carRental)
    {
        $validated = $request->validate([
            'start_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'phone_number'    => 'required|string|max:20',
            'pickup_location' => 'required|string|max:255',
            'pickup_time'     => 'required|date_format:H:i',
            'discount_code'   => 'nullable|string|exists:discount_codes,code', // ✅ Added
            // Add-ons for cars if you implement them later
            'selected_addons' => 'nullable|array',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $user = Auth::user();

        if ($carRental->status !== 'available') {
            return response()->json(['message' => 'This car is not available for booking.'], 422);
        }

        // Check Conflicts
        $conflictingDates = CarRentalAvailability::where('car_rental_id', $carRental->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', ['booked', 'maintenance'])
            ->exists();

        if ($conflictingDates) {
            return response()->json(['message' => 'The selected dates are not available for this car.'], 422);
        }

        $requestedDays = $startDate->diffInDays($endDate) + 1;

        try {
            DB::beginTransaction();

            $pricePerDay = $carRental->price_per_day;
            $baseSubtotal = $pricePerDay * $requestedDays;

            // ✅ Calculate Add-ons (If car has add-ons)
            $addonsTotal = 0;
            $selectedAddonsDetails = [];
            if (!empty($validated['selected_addons']) && !empty($carRental->addons)) {
                $availableAddons = collect($carRental->addons);
                foreach ($validated['selected_addons'] as $addonName) {
                    $addon = $availableAddons->firstWhere('name', $addonName);
                    if ($addon) {
                        $price = (float)($addon['price'] ?? 0);
                        $addonsTotal += $price;
                        $selectedAddonsDetails[] = ['name' => $addonName, 'price' => $price];
                    }
                }
            }

            $grossSubtotal = $baseSubtotal + $addonsTotal;

            // ✅ Apply Discount
            $discountAmount = 0;
            $discountCodeId = null;
            $discountCode = null;

            if (!empty($validated['discount_code'])) {
                $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();
                if ($discountCode && $discountCode->isValid()) {
                    $discountAmount = $discountCode->calculateDiscount($grossSubtotal);
                    $discountCodeId = $discountCode->id;
                }
            }

            $totalPrice = max(0, $grossSubtotal - $discountAmount);
            $downPayment = $totalPrice * 0.5;
            $paymentDeadline = Carbon::now()->addHours(2);

            // Create Order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-CAR-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $grossSubtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalPrice,
                'discount_code_id' => $discountCodeId,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);

            // Create Order Items
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $carRental->id,
                'orderable_type' => CarRental::class,
                'name' => $carRental->brand . ' ' . $carRental->car_model,
                'quantity' => $requestedDays,
                'price' => $baseSubtotal, // Price for car rental only
            ]);

            foreach ($selectedAddonsDetails as $addon) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'orderable_id' => $carRental->id,
                    'orderable_type' => CarRental::class,
                    'name' => 'Add-on: ' . $addon['name'],
                    'quantity' => 1,
                    'price' => $addon['price'],
                ]);
            }

            // Create Booking
            $booking = new Booking([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'booking_date' => $startDate,
                'details' => [
                    'service_name'  => $carRental->brand . ' ' . $carRental->car_model,
                    'car_model'     => $carRental->car_model,
                    'brand'         => $carRental->brand,
                    'price_per_day' => $carRental->price_per_day,
                    'total_days'    => $requestedDays,
                    'phone_number'    => $validated['phone_number'],
                    'pickup_location' => $validated['pickup_location'],
                    'pickup_time'     => $validated['pickup_time'],
                    'selected_addons' => $selectedAddonsDetails,
                    'discount_applied' => $discountAmount
                ]
            ]);
            $carRental->bookings()->save($booking);

            $order->booking_id = $booking->id;
            $order->save();

            // Increment Discount Usage
            if ($discountCode) {
                $discountCode->increment('uses');
            }

            // Update Availability
            $period = CarbonPeriod::create($startDate, $endDate);
            foreach ($period as $date) {
                CarRentalAvailability::updateOrCreate(
                    ['car_rental_id' => $carRental->id, 'date' => $date->toDateString()],
                    ['status' => 'booked', 'price' => $carRental->price_per_day]
                );
            }

            DB::commit();

            return response()->json([
                'message' => 'Booking created successfully.',
                'payment_deadline' => $paymentDeadline->toIso8601String(),
                'order' => $order->load('orderItems.orderable', 'booking.bookable'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Car rental booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred during booking.'], 500);
        }
    }

    /**
     * Store ACTIVITY Booking
     */
    public function storeActivityBooking(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'activity_time' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'participant_nationality' => 'required|string|max:100',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone_number' => 'required|string|max:20',
            'pickup_location' => 'required|string|max:255',
            'special_request' => 'nullable|string',
            'selected_addons' => 'nullable|array',
            'selected_addons.*' => 'string',
            'discount_code' => 'nullable|string|exists:discount_codes,code', // ✅ Added
        ]);

        if ($activity->status !== 'active') {
            return response()->json(['message' => 'Activity not available.'], 400);
        }

        $user = Auth::user();
        $totalPax = $validated['quantity'];
        $pricePerPax = $activity->price;
        $baseSubtotal = $pricePerPax * $totalPax;

        // ✅ Calculate Add-ons
        $addonsTotal = 0;
        $selectedAddonsDetails = [];

        if (!empty($validated['selected_addons']) && !empty($activity->addons)) {
            $availableAddons = collect($activity->addons);
            foreach ($validated['selected_addons'] as $addonName) {
                $addon = $availableAddons->firstWhere('name', $addonName);
                if ($addon) {
                    $price = (float) ($addon['price'] ?? 0);
                    $addonsTotal += $price;
                    $selectedAddonsDetails[] = ['name' => $addonName, 'price' => $price];
                }
            }
        }

        $grossSubtotal = $baseSubtotal + $addonsTotal;

        // ✅ Apply Discount
        $discountAmount = 0;
        $discountCodeId = null;
        $discountCode = null;

        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();
            if ($discountCode && $discountCode->isValid()) {
                $discountAmount = $discountCode->calculateDiscount($grossSubtotal);
                $discountCodeId = $discountCode->id;
            }
        }

        $totalPrice = max(0, $grossSubtotal - $discountAmount);
        $downPayment = $totalPrice * 0.5;
        $paymentDeadline = Carbon::now()->addHours(2);

        try {
            DB::beginTransaction();

            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-ACT-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $grossSubtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalPrice,
                'discount_code_id' => $discountCodeId,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);

            // Item 1: Main Activity
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $activity->id,
                'orderable_type' => Activity::class,
                'name' => $activity->name,
                'quantity' => $validated['quantity'],
                'price' => $baseSubtotal, // Price of activity only
            ]);

             // Item 2+: Add-ons
             foreach ($selectedAddonsDetails as $addon) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'orderable_id' => $activity->id,
                    'orderable_type' => Activity::class,
                    'name' => 'Add-on: ' . $addon['name'],
                    'quantity' => 1,
                    'price' => $addon['price'],
                ]);
            }

            $booking = $activity->bookings()->create([
                'user_id' => $user->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'total_price' => $totalPrice,
                'booking_date' => $validated['booking_date'],
                'start_date' => $validated['booking_date'],
                'details' => [
                    'full_name' => $validated['full_name'],
                    'email' => $validated['email'],
                    'phone_number' => $validated['phone_number'],
                    'participant_nationality' => $validated['participant_nationality'],
                    'quantity' => $validated['quantity'],
                    'activity_time' => $validated['activity_time'],
                    'pickup_location' => $validated['pickup_location'],
                    'special_request' => $validated['special_request'] ?? null,
                    'service_name' => $activity->name,
                    'price_per_person' => $pricePerPax,
                    'base_subtotal' => $baseSubtotal,
                    'addons_total' => $addonsTotal,
                    'selected_addons' => $selectedAddonsDetails,
                    'discount_applied' => $discountAmount
                ],
            ]);

            $order->booking_id = $booking->id;
            $order->save();

            if ($discountCode) {
                $discountCode->increment('uses');
            }

            DB::commit();
            return response()->json([
                'message' => 'Activity booked successfully.',
                'payment_deadline' => $paymentDeadline->toIso8601String(),
                'order' => $order->load('orderItems.orderable', 'booking.bookable'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Activity booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'Booking failed.'], 500);
        }
    }

    /**
     * Store HOLIDAY PACKAGE Booking
     */
    public function storeHolidayPackageBooking(Request $request, $packageId)
    {
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'adults' => 'required|integer|min:1',
            'children' => 'sometimes|integer|min:0',
            'discount_code' => 'nullable|string|exists:discount_codes,code',
            'participant_nationality' => 'required|string|max:100',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone_number' => 'required|string|max:20',
            'pickup_location' => 'required|string|max:255',
            'flight_number' => 'nullable|string|max:50',
            'special_request' => 'nullable|string',
            'selected_addons' => 'nullable|array',
            'selected_addons.*' => 'string',
        ]);

        $user = Auth::user();
        $package = HolidayPackage::findOrFail($packageId);

        $adultsCount = $validated['adults'];
        $childrenCount = $validated['children'] ?? 0;
        $totalPax = $adultsCount + $childrenCount;

        $pricePerPax = $package->getPricePerPax($totalPax);
        if ($pricePerPax === null) {
            return response()->json(['message' => 'Pricing unavailable for this number of pax.'], 400);
        }
        $baseSubtotal = $pricePerPax * $totalPax;

        $addonsTotal = 0;
        $selectedAddonsDetails = [];

        if (!empty($validated['selected_addons']) && !empty($package->addons)) {
            $availableAddons = collect($package->addons);
            foreach ($validated['selected_addons'] as $addonName) {
                $addon = $availableAddons->firstWhere('name', $addonName);
                if ($addon) {
                    $price = (float) ($addon['price'] ?? 0);
                    $addonsTotal += $price;
                    $selectedAddonsDetails[] = ['name' => $addonName, 'price' => $price];
                }
            }
        }

        $grossSubtotal = $baseSubtotal + $addonsTotal;

        $discountAmount = 0;
        $discountCodeId = null;
        $discountCode = null;

        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();
            if (!$discountCode || !$discountCode->isValid()) {
                throw ValidationException::withMessages(['discount_code' => 'Invalid discount code.']);
            }
            $discountAmount = $discountCode->calculateDiscount($grossSubtotal);
            $discountCodeId = $discountCode->id;
        }

        $totalPrice = max(0, $grossSubtotal - $discountAmount);
        $downPayment = $totalPrice * 0.5;
        $paymentDeadline = now()->addHours(2);

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-PKG-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $grossSubtotal,
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
                    'full_name' => $validated['full_name'],
                    'email' => $validated['email'],
                    'phone_number' => $validated['phone_number'],
                    'participant_nationality' => $validated['participant_nationality'],
                    'adults' => $adultsCount,
                    'children' => $childrenCount,
                    'total_pax' => $totalPax,
                    'pickup_location' => $validated['pickup_location'],
                    'flight_number' => $validated['flight_number'] ?? null,
                    'special_request' => $validated['special_request'] ?? null,
                    'service_name' => $package->name,
                    'price_per_pax' => $pricePerPax,
                    'base_subtotal' => $baseSubtotal,
                    'addons_total' => $addonsTotal,
                    'selected_addons' => $selectedAddonsDetails,
                    'discount_applied' => $discountAmount
                ]
            ]);

            $order->booking_id = $booking->id;
            $order->save();

            // Order Items
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $package->id,
                'orderable_type' => HolidayPackage::class,
                'name' => $package->name . " ($totalPax Pax)",
                'quantity' => 1,
                'price' => $baseSubtotal,
            ]);

            foreach ($selectedAddonsDetails as $addon) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'orderable_id' => $package->id,
                    'orderable_type' => HolidayPackage::class,
                    'name' => 'Add-on: ' . $addon['name'],
                    'quantity' => 1,
                    'price' => $addon['price'],
                ]);
            }

            if ($discountCode) {
                $discountCode->increment('uses');
            }

            DB::commit();
            return response()->json($order->load('orderItems.orderable', 'booking.bookable'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Holiday package booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create booking. ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store OPEN TRIP Booking
     */
    public function storeOpenTripBooking(Request $request, $openTripId)
    {
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'adults' => 'required|integer|min:1',
            'children' => 'sometimes|integer|min:0',
            'discount_code' => 'nullable|string|exists:discount_codes,code',
            'participant_nationality' => 'required|string|max:100',
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone_number' => 'required|string|max:20',
            'pickup_location' => 'required|string|max:255',
            'special_request' => 'nullable|string',
            'selected_addons' => 'nullable|array',
            'selected_addons.*' => 'string',
        ]);

        $user = Auth::user();
        $trip = OpenTrip::findOrFail($openTripId);

        $adultsCount = $validated['adults'];
        $childrenCount = $validated['children'] ?? 0;
        $totalPax = $adultsCount + $childrenCount;

        $pricePerPax = $trip->starting_from_price;
        if (!$pricePerPax || $pricePerPax <= 0) {
             return response()->json(['message' => 'Price info missing.'], 400);
        }
        $baseSubtotal = $pricePerPax * $totalPax;

        $addonsTotal = 0;
        $selectedAddonsDetails = [];

        if (!empty($validated['selected_addons']) && !empty($trip->addons)) {
            $availableAddons = collect($trip->addons);
            foreach ($validated['selected_addons'] as $addonName) {
                $addon = $availableAddons->firstWhere('name', $addonName);
                if ($addon) {
                    $price = (float) ($addon['price'] ?? 0);
                    $addonsTotal += $price;
                    $selectedAddonsDetails[] = ['name' => $addonName, 'price' => $price];
                }
            }
        }

        $grossSubtotal = $baseSubtotal + $addonsTotal;

        $discountAmount = 0;
        $discountCodeId = null;
        $discountCode = null;

        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();
            if (!$discountCode || !$discountCode->isValid()) {
                throw ValidationException::withMessages(['discount_code' => 'Invalid discount code.']);
            }
            $discountAmount = $discountCode->calculateDiscount($grossSubtotal);
            $discountCodeId = $discountCode->id;
        }

        $totalPrice = max(0, $grossSubtotal - $discountAmount);
        $downPayment = $totalPrice * 0.5;
        $paymentDeadline = now()->addHours(2);

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => 'ORD-OT-' . strtoupper(Str::random(6)) . time(),
                'subtotal' => $grossSubtotal,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalPrice,
                'discount_code_id' => $discountCodeId,
                'status' => 'pending',
                'payment_deadline' => $paymentDeadline,
                'down_payment_amount' => $downPayment,
            ]);

            $booking = $trip->bookings()->create([
                'user_id' => $user->id,
                'booking_date' => $validated['start_date'],
                'start_date' => $validated['start_date'],
                'end_date' => Carbon::parse($validated['start_date'])->addDays($trip->duration - 1)->toDateString(),
                'status' => 'pending',
                'total_price' => $totalPrice,
                'payment_status' => 'unpaid',
                'details' => [
                    'full_name' => $validated['full_name'],
                    'email' => $validated['email'],
                    'phone_number' => $validated['phone_number'],
                    'participant_nationality' => $validated['participant_nationality'],
                    'adults' => $adultsCount,
                    'children' => $childrenCount,
                    'total_pax' => $totalPax,
                    'pickup_location' => $validated['pickup_location'],
                    'special_request' => $validated['special_request'] ?? null,
                    'service_name' => $trip->name,
                    'price_per_pax' => $pricePerPax,
                    'base_subtotal' => $baseSubtotal,
                    'addons_total' => $addonsTotal,
                    'selected_addons' => $selectedAddonsDetails,
                    'discount_applied' => $discountAmount
                ]
            ]);

            $order->booking_id = $booking->id;
            $order->save();

            // Order Items
            OrderItem::create([
                'order_id' => $order->id,
                'orderable_id' => $trip->id,
                'orderable_type' => OpenTrip::class,
                'name' => $trip->name . " ($totalPax Pax)",
                'quantity' => 1,
                'price' => $baseSubtotal,
            ]);

            foreach ($selectedAddonsDetails as $addon) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'orderable_id' => $trip->id,
                    'orderable_type' => OpenTrip::class,
                    'name' => 'Add-on: ' . $addon['name'],
                    'quantity' => 1,
                    'price' => $addon['price'],
                ]);
            }

            if ($discountCode) {
                $discountCode->increment('uses');
            }

            DB::commit();
            return response()->json($order->load('orderItems.orderable', 'booking.bookable'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Open Trip booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create booking.'], 500);
        }
    }

    /**
     * Store TRIP PLANNER Booking
     */
    public function storeTripPlannerBooking(Request $request)
    {
        $validated = $request->validate([
            'discount_code' => 'nullable|string|exists:discount_codes,code'
        ]);

        $user = Auth::user();
        $tripPlanner = TripPlanner::where('user_id', $user->id)->firstOrFail();
        $tripDate = $tripPlanner->departure_date ?? now()->toDateString();

        $setting = Setting::where('key', 'trip_planner_price')->first();
        if (!$setting || !is_numeric($setting->value) || $setting->value <= 0) {
            return response()->json(['message' => 'Service is not configured.'], 500);
        }

        $subtotal = $setting->value;
        $tripPlanner->price = $subtotal;
        $tripPlanner->save();

        $discountAmount = 0;
        $discountCodeId = null;
        $discountCode = null;

        if (!empty($validated['discount_code'])) {
            $discountCode = DiscountCode::where('code', $validated['discount_code'])->first();
            if (!$discountCode || !$discountCode->isValid()) {
                throw ValidationException::withMessages(['discount_code' => 'Invalid discount code.']);
            }
            $discountAmount = $discountCode->calculateDiscount($subtotal);
            $discountCodeId = $discountCode->id;
        }

        $totalPrice = max(0, $subtotal - $discountAmount);
        $downPayment = $totalPrice * 0.5;
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
                'name' => 'Custom Trip Plan',
                'quantity' => 1,
                'price' => $subtotal,
            ]);

            if ($discountCode) {
                $discountCode->increment('uses');
            }

            DB::commit();
            return response()->json([
                'message' => 'Booking created successfully.',
                'booking' => $booking->load('bookable'),
                'order' => $order,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Trip planner booking failed: ' . $e->getMessage());
            return response()->json(['message' => 'Booking failed.'], 500);
        }
    }

    public function index()
    {
        $bookings = Booking::with(['bookable', 'order'])
            ->where('user_id', Auth::id())
            ->latest()
            ->get();
        return response()->json($bookings);
    }

    public function show(Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $booking->load('bookable', 'order.transaction');
        return response()->json($booking);
    }

    public function update(Request $request, Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled',
        ]);
        $booking->update($validated);
        return response()->json($booking);
    }
}
