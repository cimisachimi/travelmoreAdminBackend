<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use Illuminate\Http\Request;

class HolidayPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return HolidayPackage::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'number_of_days' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'accommodation_details' => 'required|string',
            'itinerary' => 'nullable|json',
            'min_age' => 'nullable|integer|min:0',
            'max_age' => 'nullable|integer|gt:min_age',
        ]);

        $package = HolidayPackage::create($validatedData);

        return response()->json($package, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(HolidayPackage $holidayPackage)
    {
        return $holidayPackage;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, HolidayPackage $holidayPackage)
    {
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'number_of_days' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
            'accommodation_details' => 'sometimes|required|string',
            'itinerary' => 'sometimes|nullable|json',
            'min_age' => 'sometimes|nullable|integer|min:0',
            'max_age' => 'sometimes|nullable|integer|gt:min_age',
        ]);

        $holidayPackage->update($validatedData);

        return response()->json($holidayPackage);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(HolidayPackage $holidayPackage)
    {
        $holidayPackage->delete();

        return response()->json(null, 204);
    }
}