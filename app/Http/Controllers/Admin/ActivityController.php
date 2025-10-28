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
    public function index()
    {
        $activities = Activity::with('translations')->latest()->paginate(10);
        return Inertia::render('Admin/Activity/Index', [
            'activities' => $activities,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Activity/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:active,inactive',
            'duration' => 'nullable|string|max:255',
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'translations' => 'required|array',
            'translations.en' => 'required|array',
            'translations.en.name' => 'required|string|max:255',
            'translations.en.description' => 'nullable|string',
            'translations.en.location' => 'required|string|max:255',
            'translations.en.category' => 'nullable|string|max:255',
            'translations.id' => 'required|array',
            'translations.id.name' => 'required|string|max:255',
            'translations.id.description' => 'nullable|string',
            'translations.id.location' => 'required|string|max:255',
            'translations.id.category' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $activity = Activity::create([
                'price' => $validated['price'],
                'status' => $validated['status'],
                'duration' => $validated['duration'],
                //'name' => $validated['translations']['en']['name'],
            ]);

            $this->storeImage($request->file('thumbnail'), $activity, 'thumbnail');

            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $imageFile) {
                    $this->storeImage($imageFile, $activity, 'gallery');
                }
            }

            $this->updateTranslations($activity, $validated['translations']);

            DB::commit();

            return redirect()->route('admin.activities.index')->with('success', 'Activity created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create activity: ' . $e->getMessage()]);
        }
    }

    public function show(Activity $activity)
    {
        return redirect()->route('admin.activities.edit', $activity->id);
    }

    public function edit(Activity $activity)
    {
        $activity->load('images', 'translations');

        $translations = $activity->translations->keyBy('locale')->toArray();
        $activityData = $activity->toArray();

        // Separate thumbnail and gallery for the form
        $allImages = $activity->images;
        $activityData['thumbnail'] = $allImages->firstWhere('type', 'thumbnail');
        $activityData['gallery'] = $allImages->where('type', 'gallery')->values()->all();

        $activityData['translations'] = [
            'en' => $translations['en'] ?? (object)[],
            'id' => $translations['id'] ?? (object)[],
        ];

        unset($activityData['images']);

        return Inertia::render('Admin/Activity/Edit', [
            'activity' => $activityData,
        ]);
    }

    /**
     * Update the specified resource's TEXT fields in storage.
     */
    public function update(Request $request, Activity $activity)
    {
        // --- THIS FORM NO LONGER ACCEPTS FILES ---
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:active,inactive',
            'duration' => 'nullable|string|max:255',
            'translations' => 'required|array',
            'translations.en' => 'required|array',
            'translations.en.name' => 'required|string|max:255',
            'translations.en.description' => 'nullable|string',
            'translations.en.location' => 'required|string|max:255',
            'translations.en.category' => 'nullable|string|max:255',
            'translations.id' => 'required|array',
            'translations.id.name' => 'required|string|max:255',
            'translations.id.description' => 'nullable|string',
            'translations.id.location' => 'required|string|max:255',
            'translations.id.category' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $activity->update([
                'price' => $validated['price'],
                'status' => $validated['status'],
                'duration' => $validated['duration'],
                //'name' => $validated['translations']['en']['name'],
            ]);

            $this->updateTranslations($activity, $validated['translations']);

            DB::commit();

            return redirect()->route('admin.activities.edit', $activity->id)->with('success', 'Activity updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update activity: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Activity $activity)
    {
        try {
            DB::beginTransaction();
            $activity->load('images');
            foreach ($activity->images as $image) {
                $this->destroyImage($activity, $image);
            }
            $activity->delete();
            DB::commit();
            return redirect()->route('admin.activities.index')->with('success', 'Activity deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete activity: ' . $e->getMessage()]);
        }
    }

    // --- NEW IMAGE HANDLING METHODS ---

    /**
     * Update the thumbnail for the activity.
     */
    public function updateThumbnail(Request $request, Activity $activity)
    {
        $request->validate([
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        DB::beginTransaction();
        try {
            // Delete old thumbnail
            $oldThumbnail = $activity->images()->where('type', 'thumbnail')->first();
            if ($oldThumbnail) {
                Storage::disk('public')->delete($oldThumbnail->url);
                $oldThumbnail->delete();
            }

            // Store new one
            $this->storeImage($request->file('thumbnail'), $activity, 'thumbnail');

            DB::commit();
            return back()->with('success', 'Thumbnail updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update thumbnail: ' . $e->getMessage()]);
        }
    }

    /**
     * Store new gallery images for the activity.
     */
    public function storeGallery(Request $request, Activity $activity)
    {
        $request->validate([
            'gallery' => 'required|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        DB::beginTransaction();
        try {
            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $imageFile) {
                    $this->storeImage($imageFile, $activity, 'gallery');
                }
            }
            DB::commit();
            return back()->with('success', 'Gallery images added.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to add images: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a specific image.
     */
    public function destroyImage(Activity $activity, Image $image)
    {
        // Check if image belongs to activity
        if ($image->imageable_id !== $activity->id) {
            return back()->withErrors(['error' => 'Image mismatch.']);
        }

        // Prevent deleting the last thumbnail (unless activity is being deleted)
        if ($image->type === 'thumbnail' && $activity->images()->where('type', 'thumbnail')->count() <= 1) {
             return back()->withErrors(['error' => 'Cannot delete the only thumbnail. Upload a new one first.']);
        }

        Storage::disk('public')->delete($image->url);
        $image->delete();

        return back()->with('success', 'Image deleted.');
    }


    // --- Helper Methods ---

    protected function storeImage($imageFile, Activity $activity, $type = 'gallery')
    {
        $fileName = Str::uuid() . '.' . $imageFile->getClientOriginalExtension();
        $path = $imageFile->storeAs("activities/{$type}", $fileName, 'public');
        $activity->images()->create(['url' => $path, 'type' => $type]);
    }

    protected function updateTranslations(Activity $activity, array $translationsData)
    {
        foreach ($translationsData as $locale => $data) {
            $activity->translateOrNew($locale)->fill([
                'name' => $data['name'] ?? '',
                'description' => $data['description'] ?? null,
                'location' => $data['location'] ?? '',
                'category' => $data['category'] ?? null,
            ]);
        }
        $activity->save();
    }
}
