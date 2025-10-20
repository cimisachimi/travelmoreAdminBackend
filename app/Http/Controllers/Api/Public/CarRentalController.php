<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\CarRental;
use App\Models\CarRentalAvailability;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CarRentalController extends Controller
{
    public function index(Request $request)
    {
        $locale = $request->input('locale', 'en');
        
        // ✅ UPDATED: Only fetch cars that are globally 'available'
        $carRentals = CarRental::where('status', 'available')
            ->with(['images', 'translations'])
            ->get();

        $carRentals->map(function ($car) use ($locale) {
            $translation = $car->translations->firstWhere('locale', 'en');
            $localeTranslation = $car->translations->firstWhere('locale', $locale);

            if ($localeTranslation) {
                $translation = $localeTranslation;
            }
            
            if ($translation) {
                $translatable = ['description', 'car_type', 'transmission', 'fuel_type', 'features'];
                foreach ($translatable as $attr) {
                    if (!empty($translation->$attr)) {
                        $car->$attr = $translation->$attr;
                    }
                }
            }
            unset($car->translations);
            return $car;
        });

        return response()->json($carRentals);
    }

    /**
     * Display the specified car rental with translations.
     */
    public function show(Request $request, CarRental $carRental)
    {
        // ✅ ADDED: Check if the car is globally available
        if ($carRental->status !== 'available') {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $locale = $request->input('locale', 'en');
        $carRental->load(['images', 'translations']);

        $translation = $carRental->translations->firstWhere('locale', 'en');
        $localeTranslation = $carRental->translations->firstWhere('locale', $locale);

        if ($localeTranslation) {
            $translation = $localeTranslation;
        }

        if ($translation) {
            $translatable = ['description', 'car_type', 'transmission', 'fuel_type', 'features'];
            foreach ($translatable as $attr) {
                if (!empty($translation->$attr)) {
                    $carRental->$attr = $translation->$attr;
                }
            }
        }

        unset($carRental->translations);

        return response()->json($carRental);
    }

    /**
     * Get availability data for a specific car rental.
     */
    public function getAvailability(Request $request, CarRental $carRental)
    {
        // ✅ ADDED: Check if the car is globally available
        if ($carRental->status !== 'available') {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $request->validate([
            'start_date' => 'sometimes|required|date_format:Y-m-d',
            'end_date' => 'sometimes|required|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $startDate = $request->input('start_date', Carbon::today()->toDateString());
        $endDate = $request->input('end_date', Carbon::parse($startDate)->addYear()->toDateString());

        $availability = CarRentalAvailability::where('car_rental_id', $carRental->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'asc')
            ->get(['date', 'status']);

        $formattedAvailability = $availability->keyBy(function ($item) {
             return Carbon::parse($item->date)->toDateString();
        })->map(function ($item) {
             return $item->status;
        });


        return response()->json($formattedAvailability);
    }

    
    public function orders()
    {
        return $this->morphMany(Order::class, 'orderable');
    }
}