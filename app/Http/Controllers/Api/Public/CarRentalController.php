<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\CarRental;
use Illuminate\Http\Request;

class CarRentalController extends Controller
{
    public function index(Request $request)
    {
        $locale = $request->input('locale', 'en');
        $carRentals = CarRental::with(['images', 'translations'])->get();

        $carRentals->map(function ($car) use ($locale) {
            $translation = $car->translations->firstWhere('locale', 'en'); // Always get English as a base
            $localeTranslation = $car->translations->firstWhere('locale', $locale); // Get the requested locale

            if ($localeTranslation) {
                $translation = $localeTranslation; // Use the specific locale if it exists
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
     * ✅ ADD THIS METHOD
     * Display the specified car rental with translations.
     */
    public function show(Request $request, CarRental $carRental)
    {
        $locale = $request->input('locale', 'en');
        $carRental->load(['images', 'translations']); // Eager load relationships

        $translation = $carRental->translations->firstWhere('locale', 'en'); // Base
        $localeTranslation = $carRental->translations->firstWhere('locale', $locale); // Specific

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
}