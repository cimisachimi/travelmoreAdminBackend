<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Image; // Added for image handling
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; // Added for image handling
use Illuminate\Support\Str; // Added for image handling

class ActivityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Load the 'translations' relationship to display the correct name
        $activities = Activity::with('translations')->latest()->paginate(10);

        return Inertia::render('Admin/Activity/Index', [
            'activities' => $activities,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Activity/Create');
    }

    /**
     * Store a new resource in storage.
     */
    public function store(Request $request)
    {
        // Validation now includes translations
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:active,inactive',
            'duration' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',

            // Translation validation
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

            // Create the activity with non-translatable fields
            $activity = Activity::create([
                'price' => $validated['price'],
                'status' => $validated['status'],
                'duration' => $validated['duration'],
                'name' => $validated['translations']['en']['name'], // Use 'en' as fallback
            ]);

            // --- Image Handling ---
            if ($request->hasFile('images')) {
                $isFirstImage = true;
                foreach ($request->file('images') as $imageFile) {
                    // Set the first uploaded image as the thumbnail
                    $type = $isFirstImage ? 'thumbnail' : 'gallery';
                    $this->storeImage($imageFile, $activity, $type);
                    $isFirstImage = false;
                }
            }

            // --- Translation Handling ---
            $this->updateTranslations($activity, $request);

            DB::commit();

            return redirect()->route('admin.activities.index')->with('success', 'Activity created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create activity: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Activity $activity)
    {
        // Typically not used in admin panels, redirect to edit
        return redirect()->route('admin.activities.edit', $activity->id);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Activity $activity)
    {
        // Load both images and translations
        $activity->load('images', 'translations');

        // Prepare translations data for the form
        $translations = $activity->translations->keyBy('locale')->toArray();
        $activityData = $activity->toArray();
        // Ensure both 'en' and 'id' keys exist to avoid errors in the form
        $activityData['translations'] = [
            'en' => $translations['en'] ?? (object)[],
            'id' => $translations['id'] ?? (object)[],
        ];

        return Inertia::render('Admin/Activity/Edit', [
            'activity' => $activityData, // Pass the formatted data
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            // Non-translatable fields
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:active,inactive',
            'duration' => 'nullable|string|max:255',
            
            // Image fields
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'deleted_images' => 'nullable|array',
            'deleted_images.*' => 'integer|exists:images,id',
            'thumbnail_id' => 'nullable|integer|exists:images,id',

            // Translation validation
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

            // Update non-translatable fields
            $activity->update([
                'price' => $validated['price'],
                'status' => $validated['status'],
                'duration' => $validated['duration'],
                'name' => $validated['translations']['en']['name'], // Update fallback name
            ]);

            // --- Image Handling ---

            // 1. Delete images marked for deletion
            if ($request->has('deleted_images')) {
                foreach ($request->deleted_images as $imageId) {
                    $this->destroyImage($imageId);
                }
            }

            // 2. Upload new images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $this->storeImage($imageFile, $activity, 'gallery');
                }
            }

            // 3. Update thumbnail
            if ($request->has('thumbnail_id')) {
                $this->updateThumbnail($activity, $request->thumbnail_id);
            }
            // --- End Image Handling ---


            // --- Translation Handling ---
            $this->updateTranslations($activity, $request);

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

            // --- Image Deletion ---
            // Eager load images to ensure we have them before deleting the activity
            $activity->load('images');
            foreach ($activity->images as $image) {
                Storage::disk('public')->delete($image->path);
                $image->delete(); // Delete the image record
            }
            // --- End Image Deletion ---

            $activity->delete(); // This will also delete translations due to cascade delete

            DB::commit();

            return redirect()->route('admin.activities.index')->with('success', 'Activity deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete activity: ' . $e->getMessage()]);
        }
    }


    // --- Image Helper Methods ---

    /**
     * Store a new image.
     */
    protected function storeImage($imageFile, Activity $activity, $type = 'gallery')
    {
        $fileName = Str::uuid() . '.' . $imageFile->getClientOriginalExtension();
        $path = $imageFile->storeAs('activities', $fileName, 'public');

        $activity->images()->create([
            'path' => $path,
            'type' => $type,
        ]);
    }

    /**
     * Delete an image from storage and database.
     */
    protected function destroyImage($imageId)
    {
        $image = Image::find($imageId);
        if ($image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }
    }

    /**
     * Update the thumbnail for the activity.
     */
    protected function updateThumbnail(Activity $activity, $thumbnailId)
    {
        // Reset old thumbnail
        $activity->images()->where('type', 'thumbnail')->update(['type' => 'gallery']);

        // Set new thumbnail
        $newThumbnail = Image::find($thumbnailId);
        // Check if the image belongs to this activity before updating
        if ($newThumbnail && $newThumbnail->imageable_id === $activity->id) {
            $newThumbnail->type = 'thumbnail';
            $newThumbnail->save();
        }
    }


    // --- Translation Helper Methods ---
    
    /**
     * Update or create translations for the activity.
     */
    protected function updateTranslations(Activity $activity, Request $request)
    {
        if ($request->has('translations')) {
            foreach ($request->translations as $locale => $data) {
                // Use translateOrNew to either update existing or create new translation
                $activity->translateOrNew($locale)->fill([
                    'name' => $data['name'] ?? '',
                    'description' => $data['description'] ?? null,
                    'location' => $data['location'] ?? '',
                    'category' => $data['category'] ?? null,
                ]);
            }
            $activity->save(); // Save the translations
        }
    }
}