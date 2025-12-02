<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OpenTrip;
use App\Models\Image;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class OpenTripController extends Controller
{
    public function index(Request $request)
    {
        $query = OpenTrip::query()->with(['translations', 'images']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereTranslationLike('name', "%{$search}%");
        }

        $trips = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/OpenTrip/Index', [
            'trips' => $trips,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/OpenTrip/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'duration' => 'required|integer|min:1',
            'rating' => 'required|numeric|min:0|max:5',
            'map_url' => 'nullable|string',

            // Translatable fields (en & id)
            'en.name' => 'required|string',
            'en.location' => 'required|string',
            'en.category' => 'required|string',
            'en.description' => 'required|string',
            'id.name' => 'required|string',
            'id.location' => 'required|string',
            'id.category' => 'required|string',
            'id.description' => 'required|string',

            // JSON Fields
            'price_tiers' => 'nullable|array',
            'meeting_points' => 'nullable|array',
            'itinerary' => 'nullable|array',
            'includes' => 'nullable|array',
            'excludes' => 'nullable|array',

            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        DB::beginTransaction();
        try {
            // Prepare JSON structures
            $cost = [
                'included' => $request->includes ?? [],
                'excluded' => $request->excludes ?? []
            ];

            $data = [
                'duration' => $validated['duration'],
                'rating' => $validated['rating'],
                'map_url' => $validated['map_url'],
                'price_tiers' => $request->price_tiers, // Model accessor handles json_encode
                'meeting_points' => $request->meeting_points,
                'itinerary' => $request->itinerary,
                'cost' => $cost,

                // Translations
                'en' => $validated['en'],
                'id' => $validated['id'],
            ];

            $trip = OpenTrip::create($data);

            // Handle Images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('open-trips', 'public');
                    $trip->images()->create([
                        'url' => $path,
                        'type' => $index === 0 ? 'thumbnail' : 'gallery'
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('admin.open-trips.index')->with('success', 'Open Trip created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create trip: ' . $e->getMessage());
        }
    }

    public function edit(OpenTrip $openTrip)
    {
        $openTrip->load(['translations', 'images']);

        // Prepare cost breakdown for frontend
        $cost = $openTrip->cost ?? ['included' => [], 'excluded' => []];

        return Inertia::render('Admin/OpenTrip/Edit', [
            'openTrip' => $openTrip,
            'initialCost' => $cost // Pass separated cost structure
        ]);
    }

    public function update(Request $request, OpenTrip $openTrip)
    {
        $validated = $request->validate([
            'duration' => 'required|integer|min:1',
            'rating' => 'required|numeric|min:0|max:5',
            'map_url' => 'nullable|string',

            'en.name' => 'required|string',
            'en.location' => 'required|string',
            'en.category' => 'required|string',
            'en.description' => 'required|string',
            'id.name' => 'required|string',
            'id.location' => 'required|string',
            'id.category' => 'required|string',
            'id.description' => 'required|string',

            'price_tiers' => 'nullable|array',
            'meeting_points' => 'nullable|array',
            'itinerary' => 'nullable|array',
            'includes' => 'nullable|array',
            'excludes' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $cost = [
                'included' => $request->includes ?? [],
                'excluded' => $request->excludes ?? []
            ];

            $openTrip->update([
                'duration' => $validated['duration'],
                'rating' => $validated['rating'],
                'map_url' => $validated['map_url'],
                'price_tiers' => $request->price_tiers,
                'meeting_points' => $request->meeting_points,
                'itinerary' => $request->itinerary,
                'cost' => $cost,
                'en' => $validated['en'],
                'id' => $validated['id'],
            ]);

            DB::commit();
            return redirect()->route('admin.open-trips.index')->with('success', 'Open Trip updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Update failed: ' . $e->getMessage());
        }
    }

    public function destroy(OpenTrip $openTrip)
    {
        $openTrip->delete();
        return redirect()->route('admin.open-trips.index')->with('success', 'Trip deleted.');
    }

    // --- Image Handling Methods ---

    public function storeImage(Request $request, OpenTrip $openTrip)
    {
        $request->validate(['image' => 'required|image|max:2048']);
        $path = $request->file('image')->store('open-trips', 'public');
        $openTrip->images()->create(['url' => $path, 'type' => 'gallery']);
        return back()->with('success', 'Image uploaded.');
    }

    public function destroyImage(OpenTrip $openTrip, Image $image)
    {
        if (Storage::disk('public')->exists($image->url)) {
            Storage::disk('public')->delete($image->url);
        }
        $image->delete();
        return back()->with('success', 'Image deleted.');
    }

    public function updateThumbnail(Request $request, OpenTrip $openTrip)
    {
        $request->validate(['image_id' => 'required|exists:images,id']);

        $openTrip->images()->update(['type' => 'gallery']); // Reset all
        $openTrip->images()->where('id', $request->image_id)->update(['type' => 'thumbnail']); // Set new

        return back()->with('success', 'Thumbnail updated.');
    }
}
