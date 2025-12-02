<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\OpenTrip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OpenTripController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 10);

        $trips = OpenTrip::with('images')
            ->latest()
            ->paginate($limit);

        // Transform the data to match Frontend 'OpenTripListItem' interface
        $formatted = $trips->through(function ($trip) {

            // 1. Get Thumbnail (Image with type 'thumbnail' or the first image)
            $thumbObj = $trip->images->where('type', 'thumbnail')->first() ?? $trip->images->first();
            $thumbnailUrl = $thumbObj ? Storage::url($thumbObj->path) : null;

            // 2. Get All Images URL List
            $imagesList = $trip->images->map(fn($img) => Storage::url($img->path))->toArray();

            // 3. Parse JSON fields (they might be strings or arrays depending on casting)
            $cost = is_string($trip->cost) ? json_decode($trip->cost, true) : $trip->cost;
            $itinerary = is_string($trip->itinerary) ? json_decode($trip->itinerary, true) : $trip->itinerary;
            $meetingPoints = is_string($trip->meeting_points) ? json_decode($trip->meeting_points, true) : $trip->meeting_points;
            $priceTiers = is_string($trip->price_tiers) ? json_decode($trip->price_tiers, true) : $trip->price_tiers;

            // 4. Calculate "Starting From" Price (Lowest in tiers)
            $startingPrice = collect($priceTiers)->min('price') ?? 0;

            return [
                'id' => $trip->id,
                'name' => $trip->name, // Should be translatable if using spatie-translatable
                'location' => $trip->location,
                'duration' => $trip->duration,
                'rating' => $trip->rating,
                'category' => $trip->category,
                'description' => $trip->description,

                // URLs
                'thumbnail_url' => $thumbnailUrl,
                'images' => $imagesList,
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
        });

        return response()->json($formatted);
    }

    public function show($id)
    {
        $trip = OpenTrip::with('images')->findOrFail($id);

        // Use the same formatting logic as index, or extract to a private method
        // For brevity, we return the raw object here, but ideally you use the same transformation above.
        return response()->json($trip);
    }
}
