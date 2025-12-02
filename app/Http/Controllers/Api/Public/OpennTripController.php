<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\OpenTrip;
use Illuminate\Http\Request;

class OpenTripController extends Controller
{
    /**
     * Format the package to match Frontend 'OpenTripListItem' interface.
     */
    private function formatOpenTrip($trip)
    {
        $trip->loadMissing('images');

        // Extract JSON fields safely
        $cost = $trip->cost ?? ['included' => [], 'excluded' => []];

        return [
            'id' => $trip->id,
            'name' => $trip->name,
            'location' => $trip->location,
            'description' => $trip->description, // Added for Detail Page
            'duration' => $trip->duration,
            'rating' => $trip->rating,
            'category' => $trip->category,

            // Images
            'thumbnail_url' => $trip->thumbnail_url,
            'images' => $trip->images_url,

            // Pricing
            'price_tiers' => $trip->price_tiers ?? [],
            'starting_from_price' => $trip->starting_from_price,

            // Details
            'meeting_points' => $trip->meeting_points ?? [],
            'itinerary_details' => $trip->itinerary ?? [], // Frontend expects 'itinerary_details'
            'includes' => $cost['included'] ?? [],         // Map cost.included -> includes
            'excludes' => $cost['excluded'] ?? [],         // Map cost.excluded -> excludes
            'map_url' => $trip->map_url,
        ];
    }

    public function index(Request $request)
    {
        $limit = $request->query('limit', 10);

        $trips = OpenTrip::with('images')
            ->latest()
            ->paginate($limit);

        $formatted = $trips->through(function ($trip) {
            return $this->formatOpenTrip($trip);
        });

        return response()->json($formatted);
    }

    public function show($id)
    {
        $trip = OpenTrip::with('images')->findOrFail($id);
        return response()->json($this->formatOpenTrip($trip));
    }
}
