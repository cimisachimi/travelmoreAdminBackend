<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripPlanner;
use Illuminate\Http\Request;

class TripPlannerController extends Controller
{
    /**
     * Store a newly created trip planner submission.
     */
    public function store(Request $request)
    {
        // Laravel's validation is powerful. This ensures the data is clean.
        $validatedData = $request->validate([
            'type' => 'required|string|in:personal,company',
            'tripType' => 'required|string|in:domestic,foreign',
            'fullName' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:255',
            'companyName' => 'nullable|string|max:255',
            'brandName' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'postalCode' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'paxAdults' => 'required|integer|min:0',
            'paxTeens' => 'required|integer|min:0',
            'paxKids' => 'required|integer|min:0',
            'paxSeniors' => 'required|integer|min:0',
            'departureDate' => 'nullable|date',
            'duration' => 'nullable|string|max:255',
            'travelType' => 'required|string|max:255',
            'budgetPack' => 'required|string|max:255',
            'addons' => 'nullable|array',
            'budgetPriorities' => 'nullable|array',
            'travelStyle' => 'nullable|array',
            'travelPersonality' => 'nullable|array',
            'mustVisit' => 'nullable|string',
            'attractionPreference' => 'nullable|string',
            'foodPreference' => 'nullable|array',
            'accommodationPreference' => 'nullable|string',
            'consent' => 'required|boolean',
            'isFrequentTraveler' => 'required|string|max:255',
        ]);
        
        // The field name in the request is 'tripType', but our column is 'trip_type'
        // We'll manually map it before creation.
        $validatedData['trip_type'] = $validatedData['tripType'];
        unset($validatedData['tripType']);

        // Create a new record in the database
        $tripPlanner = TripPlanner::create($validatedData);

        return response()->json([
            'message' => 'Trip planner submitted successfully!',
            'data' => $tripPlanner
        ], 201);
    }
}