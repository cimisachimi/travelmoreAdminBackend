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

        // ✅ ADDED: where('is_active', true)
        $trips = OpenTrip::with('images')
            ->where('is_active', true)
            ->latest()
            ->paginate($limit);

        $formatted = $trips->through(function ($trip) {
            return $this->formatTrip($trip);
        });

        return response()->json($formatted);
    }

    public function show($id)
    {
        // ✅ ADDED: where('is_active', true)
        $trip = OpenTrip::with('images')
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json($this->formatTrip($trip));
    }

    private function formatTrip($trip)
    {
        $cost = is_string($trip->cost) ? json_decode($trip->cost, true) : $trip->cost;
        $itinerary = is_string($trip->itinerary) ? json_decode($trip->itinerary, true) : $trip->itinerary;
        $meetingPoints = is_string($trip->meeting_points) ? json_decode($trip->meeting_points, true) : $trip->meeting_points;
        $priceTiers = is_string($trip->price_tiers) ? json_decode($trip->price_tiers, true) : $trip->price_tiers;

        $startingPrice = collect($priceTiers)->min('price') ?? 0;

        return [
            'id' => $trip->id,
            'name' => $trip->name,
            'location' => $trip->location,
            'duration' => $trip->duration,
            'rating' => $trip->rating,
            'category' => $trip->category,
            'description' => $trip->description,
            'thumbnail_url' => $trip->thumbnail_url,
            'images' => $trip->images_url,
            'map_url' => $trip->map_url,
            'starting_from_price' => $startingPrice,
            'price_tiers' => $priceTiers ?? [],
            'meeting_points' => $meetingPoints ?? [],
            'itinerary_details' => $itinerary ?? [],
            'includes' => $cost['included'] ?? [],
            'excludes' => $cost['excluded'] ?? [],
        ];
    }
}
