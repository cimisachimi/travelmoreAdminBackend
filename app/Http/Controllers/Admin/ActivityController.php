<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Image;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::with('translations');

        if ($request->input('search')) {
            $search = $request->input('search');
            $query->whereTranslationLike('name', "%{$search}%")
                  ->orWhereTranslationLike('location', "%{$search}%");
        }

        $activities = $query->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Activity/Index', [
            'activities' => $activities,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Activity/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'price' => 'required|numeric|min:0',
            'status' => 'nullable|string',
            'duration' => 'nullable|string|max:255',
            'google_map_url' => 'nullable|url', // ✅ Added

            // ✅ Includes Validation (Structured JSON)
            'includes' => 'nullable|array',
            'includes.included' => 'nullable|array',
            'includes.included.*' => 'nullable|string|max:255',
            'includes.excluded' => 'nullable|array',
            'includes.excluded.*' => 'nullable|string|max:255',

            'addons' => 'nullable|array',
            'addons.*.name' => 'required|string|max:255',
            'addons.*.price' => 'required|numeric|min:0',

            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',

            'translations' => 'required|array',
            'translations.en.name' => 'required|string|max:255',
            'translations.en.description' => 'nullable|string',
            'translations.en.location' => 'required|string|max:255',
            'translations.en.category' => 'nullable|string|max:255',
            'translations.en.itinerary' => 'nullable|string', // ✅ Added
            'translations.en.notes' => 'nullable|string',     // ✅ Added

            'translations.id.name' => 'required|string|max:255',
            'translations.id.description' => 'nullable|string',
            'translations.id.location' => 'required|string|max:255',
            'translations.id.category' => 'nullable|string|max:255',
            'translations.id.itinerary' => 'nullable|string', // ✅ Added
            'translations.id.notes' => 'nullable|string',     // ✅ Added
        ]);

        try {
            DB::beginTransaction();

            $activity = Activity::create([
                'is_active' => $validated['is_active'] ?? false,
                'price' => $validated['price'],
                'status' => $validated['status'] ?? 'active',
                'duration' => $validated['duration'],
                'google_map_url' => $validated['google_map_url'] ?? null, // ✅ Save Map
                'includes' => $validated['includes'] ?? ['included' => [], 'excluded' => []], // ✅ Save Includes
                'addons' => $request->addons ?? [],
            ]);

            $this->updateTranslations($activity, $validated['translations']);

            if ($request->hasFile('thumbnail')) {
                $this->storeImage($request->file('thumbnail'), $activity, 'thumbnail');
            }

            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $imageFile) {
                    $this->storeImage($imageFile, $activity, 'gallery');
                }
            }

            DB::commit();

            return redirect()->route('admin.activities.index')->with('success', 'Activity created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create activity: ' . $e->getMessage()]);
        }
    }

    public function edit(Activity $activity)
    {
        $activity->load('images', 'translations');

        $translations = $activity->translations->keyBy('locale')->toArray();
        $activityData = $activity->toArray();

        $activityData['is_active'] = (bool) $activity->is_active;
        $activityData['addons'] = $activity->addons ?? [];
        $activityData['includes'] = $activity->includes ?? ['included' => [], 'excluded' => []]; // ✅ Ensure structure

        $activityData['translations'] = [
            'en' => $translations['en'] ?? (object)[],
            'id' => $translations['id'] ?? (object)[],
        ];

        return Inertia::render('Admin/Activity/Edit', [
            'activity' => $activityData,
        ]);
    }

    public function update(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'price' => 'required|numeric|min:0',
            'status' => 'nullable|string',
            'duration' => 'nullable|string|max:255',
            'google_map_url' => 'nullable|url', // ✅ Added

            // ✅ Includes Validation
            'includes' => 'nullable|array',
            'includes.included' => 'nullable|array',
            'includes.included.*' => 'nullable|string|max:255',
            'includes.excluded' => 'nullable|array',
            'includes.excluded.*' => 'nullable|string|max:255',

            'addons' => 'nullable|array',
            'addons.*.name' => 'required|string|max:255',
            'addons.*.price' => 'required|numeric|min:0',

            'translations' => 'required|array',
            'translations.en.name' => 'required|string|max:255',
            'translations.en.description' => 'nullable|string',
            'translations.en.location' => 'required|string|max:255',
            'translations.en.category' => 'nullable|string|max:255',
            'translations.en.itinerary' => 'nullable|string', // ✅ Added
            'translations.en.notes' => 'nullable|string',     // ✅ Added

            'translations.id.name' => 'required|string|max:255',
            'translations.id.description' => 'nullable|string',
            'translations.id.location' => 'required|string|max:255',
            'translations.id.category' => 'nullable|string|max:255',
            'translations.id.itinerary' => 'nullable|string', // ✅ Added
            'translations.id.notes' => 'nullable|string',     // ✅ Added
        ]);

        try {
            DB::beginTransaction();

            $activity->update([
                'is_active' => $request->boolean('is_active'),
                'price' => $validated['price'],
                'status' => $validated['status'] ?? 'active',
                'duration' => $validated['duration'],
                'google_map_url' => $validated['google_map_url'] ?? null, // ✅ Update Map
                'includes' => $validated['includes'] ?? ['included' => [], 'excluded' => []], // ✅ Update Includes
                'addons' => $request->addons ?? [],
            ]);

            $this->updateTranslations($activity, $validated['translations']);

            DB::commit();

            return redirect()->route('admin.activities.edit', $activity->id)->with('success', 'Activity updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update activity: ' . $e->getMessage()]);
        }
    }

   public function destroy(Activity $activity)
    {
        try {
            DB::transaction(function () use ($activity) {
                $this->deleteImages($activity->images);
                $activity->delete();
            });

            return redirect()
                ->route('admin.activities.index')
                ->with('success', 'Activity deleted successfully.');
        } catch (\Throwable $e) {
            return back()->withErrors([
                'error' => 'Failed to delete activity.'
            ]);
        }
    }

    /* =======================
     |  Image Methods
     ======================= */

    public function updateThumbnail(Request $request, Activity $activity)
    {
        $request->validate([
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        try {
            DB::transaction(function () use ($request, $activity) {
                $oldThumbnail = $activity->images()
                    ->where('type', 'thumbnail')
                    ->first();

                if ($oldThumbnail) {
                    $this->deleteImageFile($oldThumbnail);
                    $oldThumbnail->delete();
                }

                $this->storeImage(
                    $request->file('thumbnail'),
                    $activity,
                    'thumbnail'
                );
            });

            return back()->with('success', 'Thumbnail updated.');
        } catch (\Throwable $e) {
            return back()->withErrors([
                'error' => 'Failed to update thumbnail.'
            ]);
        }
    }

    public function storeGallery(Request $request, Activity $activity)
    {
        $request->validate([
            'gallery'   => 'required|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        try {
            DB::transaction(function () use ($request, $activity) {
                foreach ($request->file('gallery', []) as $imageFile) {
                    $this->storeImage($imageFile, $activity, 'gallery');
                }
            });

            return back()->with('success', 'Gallery updated.');
        } catch (\Throwable $e) {
            return back()->withErrors([
                'error' => 'Failed to update gallery.'
            ]);
        }
    }

    public function destroyImage(Activity $activity, Image $image)
    {
        if ($image->imageable_id !== $activity->id) {
            return back()->withErrors([
                'error' => 'Image mismatch.'
            ]);
        }

        $this->deleteImageFile($image);
        $image->delete();

        return back()->with('success', 'Image deleted.');
    }

    /* =======================
     |  Helper Methods
     ======================= */

    protected function storeImage($imageFile, Activity $activity, string $type = 'gallery'): void
    {
        $fileName = Str::uuid() . '.' . $imageFile->getClientOriginalExtension();

        $path = $imageFile->storeAs(
            "activities/{$type}",
            $fileName,
            'public'
        );

        $activity->images()->create([
            'url'  => $path,
            'type' => $type
        ]);
    }

    protected function deleteImages($images): void
    {
        foreach ($images as $image) {
            $this->deleteImageFile($image);
            $image->delete();
        }
    }

    protected function deleteImageFile(Image $image): void
    {
        if ($image->url) {
            Storage::disk('public')->delete($image->url);
        }
    }
    protected function updateTranslations(Activity $activity, array $translationsData)
    {
        foreach ($translationsData as $locale => $data) {
            $activity->translateOrNew($locale)->fill($data);
        }
        $activity->save();
    }
}
