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
        $locale = $request->header('Accept-Language', config('app.fallback_locale')); // ✅ Added locale handling

        $trips = OpenTrip::with(['translations', 'images']) // ✅ Include translations
            ->where('is_active', true)
            ->latest()
            ->paginate($limit);

        $formatted = $trips->through(function ($trip) use ($locale) {
            return $this->formatTrip($trip, $locale);
        });

        return response()->json($formatted);
    }
    public function showBySlug(Request $request, $slug)
    {
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        $trip = OpenTrip::whereTranslation('slug', $slug)
            ->where('is_active', true)
            ->with(['translations', 'images'])
            ->firstOrFail();

        return response()->json($this->formatTrip($trip, $locale));
    }

    public function show($id)
    {
        // ✅ ADDED: where('is_active', true)
        $trip = OpenTrip::with('images')
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json($this->formatTrip($trip));
    }

    private function formatTrip($trip, $locale)
    {
        // Get translation for specific locale
        $translation = $trip->translateOrDefault($locale); // ✅ Added localization

        $cost = is_string($trip->cost) ? json_decode($trip->cost, true) : $trip->cost;
        $itinerary = is_string($trip->itinerary) ? json_decode($trip->itinerary, true) : $trip->itinerary;
        $meetingPoints = is_string($trip->meeting_points) ? json_decode($trip->meeting_points, true) : $trip->meeting_points;
        $priceTiers = is_string($trip->price_tiers) ? json_decode($trip->price_tiers, true) : $trip->price_tiers;

        $startingPrice = collect($priceTiers)->min('price') ?? 0;
        $addons = is_string($trip->addons) ? json_decode($trip->addons, true) : $trip->addons;

        return [
            'id' => $trip->id,
            'slug' => $translation->slug ?? null, // ✅ Added localized slug
            'name' => $translation->name ?? $trip->name, // ✅ Use translated name
            'location' => $translation->location ?? $trip->location,
            'duration' => $trip->duration,
            'rating' => $trip->rating,
            'category' => $translation->category ?? $trip->category,
            'description' => $translation->description ?? $trip->description,
            'thumbnail_url' => $trip->thumbnail_url,
            'images' => $trip->images_url,
            'map_url' => $trip->map_url,
            'starting_from_price' => $startingPrice,
            'price_tiers' => $priceTiers ?? [],
            'meeting_points' => $meetingPoints ?? [],
            'itinerary_details' => $itinerary ?? [],
            'includes' => $cost['included'] ?? [],
            'excludes' => $cost['excluded'] ?? [],
            'addons' => $addons ?? [],
        ];
    }
}
