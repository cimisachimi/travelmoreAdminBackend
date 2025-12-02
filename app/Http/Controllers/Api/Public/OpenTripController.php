<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\OpenTrip;
use Illuminate\Http\Request;

class OpenTripController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 10);

        // Eager load images to prevent N+1 queries
        $trips = OpenTrip::with('images')
            ->latest()
            ->paginate($limit);

        // Transform the data
        $formatted = $trips->through(function ($trip) {
            return $this->formatTrip($trip);
        });

        return response()->json($formatted);
    }

    public function show($id)
    {
        $trip = OpenTrip::with('images')->findOrFail($id);

        return response()->json($this->formatTrip($trip));
    }

    /**
     * Reusable formatter to ensure consistency between index and show
     */
    private function formatTrip($trip)
    {
        // 1. Parse JSON fields safely
        $cost = is_string($trip->cost) ? json_decode($trip->cost, true) : $trip->cost;
        $itinerary = is_string($trip->itinerary) ? json_decode($trip->itinerary, true) : $trip->itinerary;
        $meetingPoints = is_string($trip->meeting_points) ? json_decode($trip->meeting_points, true) : $trip->meeting_points;
        $priceTiers = is_string($trip->price_tiers) ? json_decode($trip->price_tiers, true) : $trip->price_tiers;

        // 2. Calculate "Starting From" Price
        $startingPrice = collect($priceTiers)->min('price') ?? 0;

        return [
            'id' => $trip->id,
            'name' => $trip->name,
            'location' => $trip->location,
            'duration' => $trip->duration,
            'rating' => $trip->rating,
            'category' => $trip->category,
            'description' => $trip->description,

            // ✅ FIX: Use the model accessors (getThumbnailUrlAttribute & getImagesUrlAttribute)
            // This relies on Image::getFullUrlAttribute() which handles the storage disk logic
            'thumbnail_url' => $trip->thumbnail_url,
            'images' => $trip->images_url, // Returns array of strings ['http...', 'http...']

            'map_url' => $trip->map_url,

            // Pricing
            'starting_from_price' => $startingPrice,
            'price_tiers' => $priceTiers ?? [],

            // Details
            'meeting_points' => $meetingPoints ?? [],
            'itinerary_details' => $itinerary ?? [],
            'includes' => $cost['included'] ?? [],
            'excludes' => $cost['excluded'] ?? [],
        ];
    }
}
