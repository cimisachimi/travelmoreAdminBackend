<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Inertia\Inertia; // Import Inertia facade
use Illuminate\Validation\ValidationException; // [Add this]

class HolidayPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Fetch paginated packages. Translations are usually loaded automatically.
        // Eager load images to display thumbnails/counts if needed.
        $packages = HolidayPackage::with('images') // Eager load images
            ->latest() // Order by latest created
            ->paginate(10); // Adjust pagination size as needed

        // Render the Inertia view, passing the packages data
        return Inertia::render('Admin/HolidayPackage/Index', [
            'packages' => $packages,
             // Pass any flash messages if set (e.g., from store/update/destroy)
            'successMessage' => session('success'),
            'errorMessage' => session('error'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Render the Inertia view for creating a package
        // Pass any necessary data, like available locales if dynamic
        return Inertia::render('Admin/HolidayPackage/Create');
    }

    /**
     * Store a newly created resource in storage.
     */

    public function show(HolidayPackage $holidayPackage)
    {
        // Load translations and images if not already loaded by route model binding
        $holidayPackage->load(['images', 'translations']);

         // Render a detail view if you have one
         return Inertia::render('Admin/HolidayPackage/Show', [
             'package' => $holidayPackage
         ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(HolidayPackage $holidayPackage)
    {
        // Eager load images and translations
        $holidayPackage->load(['images', 'translations']); // 'images' is crucial

        $packageData = $holidayPackage->toArray();
        $packageData['translations'] = $holidayPackage->getTranslationsArray();

        // The 'images' array within $packageData will now contain 'full_url' for each image.
        return Inertia::render('Admin/HolidayPackage/Edit', [
            'package' => $packageData,
            'successMessage' => session('success'),
            'errorMessage' => session('error'),
        ]);
    }


public function store(Request $request)
    {
        // 1. Validate request data
        $validatedData = $request->validate([
            // --- Non-translated ---
            'duration' => 'required|integer|min:1',
            // [REMOVED] Old price fields
            // 'price_regular' => 'required|numeric|min:0',
            // 'price_exclusive' => 'required|numeric|min:0',
            // 'price_child' => 'nullable|numeric|min:0',
            'rating' => 'nullable|numeric|min:0|max:5',
            'map_url' => 'nullable|url',
            
            // [NEW] Validation for price_tiers
            'price_tiers' => 'required|array|min:1',
            'price_tiers.*.min_pax' => 'required|integer|min:1',
            'price_tiers.*.max_pax' => 'nullable|integer|gte:price_tiers.*.min_pax',
            'price_tiers.*.price' => 'required|numeric|min:0',

            // --- Validate as arrays ---
            'itinerary' => 'nullable|array',
            'itinerary.*.day' => 'required_with:itinerary|integer|min:1',
            'itinerary.*.title' => 'required_with:itinerary|string|max:255',
            'itinerary.*.description' => 'nullable|string',
            'cost' => 'nullable|array',
            'cost.included' => 'nullable|array',
            'cost.included.*' => 'nullable|string|max:255',
            'cost.excluded' => 'nullable|array',
            'cost.excluded.*' => 'nullable|string|max:255',
            'faqs' => 'nullable|array',
            'faqs.*.question' => 'required_with:faqs|string|max:255',
            'faqs.*.answer' => 'required_with:faqs|string',
            'trip_info' => 'nullable|array',
            'trip_info.*.label' => 'required_with:trip_info|string|max:255',
            'trip_info.*.value' => 'required_with:trip_info|string|max:255',
            'trip_info.*.icon' => 'nullable|string|max:50',
            // --- Translated ---
            'name' => 'required|array','name.en' => 'required|string|max:255','name.id' => 'required|string|max:255',
            'description' => 'required|array','description.en' => 'nullable|string','description.id' => 'nullable|string',
            'location' => 'required|array','location.en' => 'nullable|string|max:255','location.id' => 'nullable|string|max:255',
            'category' => 'required|array','category.en' => 'nullable|string|max:255','category.id' => 'nullable|string|max:255',
            // --- Images ---
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ], [
            // [NEW] Custom messages for price_tiers
            'price_tiers.required' => 'You must add at least one price tier.',
            'price_tiers.min' => 'You must add at least one price tier.',
            'price_tiers.*.min_pax.required' => 'The Min Pax field is required.',
            'price_tiers.*.min_pax.integer' => 'Min Pax must be a number.',
            'price_tiers.*.min_pax.min' => 'Min Pax must be at least 1.',
            'price_tiers.*.max_pax.gte' => 'Max Pax must be greater than or equal to Min Pax.',
            'price_tiers.*.price.required' => 'The Price field is required.',
            'price_tiers.*.price.numeric' => 'The Price must be a number.',
        ]);

        DB::beginTransaction();
        try {
            // 2. Prepare data for model creation (exclude images)
             // We pass the validated arrays directly, relying on $casts
            $packageData = Arr::except($validatedData, ['images']);

            // 3. Create the HolidayPackage (Model $casts handle array->JSON storage)
            // The create method correctly handles translatable attributes
            // The model accessor will handle the 'price_tiers' array
            $package = HolidayPackage::create($packageData);

            // 4. Handle Image Uploads
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('holiday-packages', 'public');
                    // Use 'url' key to match Image model's fillable property
                    $package->images()->create(['url' => $path]);
                }
            }

            DB::commit();

            return redirect()->route('admin.packages.index')->with('success', 'Holiday package created successfully!');

        } catch (ValidationException $e) {
             DB::rollBack();
             return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating holiday package: ' . $e->getMessage());
             $previous = $e->getPrevious();
             \Log::error($previous ? $previous->getMessage() : 'No previous exception details.');
            return redirect()->back()->with('error', 'Failed to create holiday package. Error: Check logs.')->withInput();
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, HolidayPackage $holidayPackage)
    {
        // 1. Validate request data
        $validatedData = $request->validate([
            // --- Non-translated ---
            'duration' => 'required|integer|min:1',
            // [REMOVED] Old price fields
            // 'price_regular' => 'required|numeric|min:0',
            // 'price_exclusive' => 'required|numeric|min:0',
            // 'price_child' => 'nullable|numeric|min:0',
            'rating' => 'nullable|numeric|min:0|max:5',
            'map_url' => 'nullable|url',

            // [NEW] Validation for price_tiers
            'price_tiers' => 'required|array|min:1',
            'price_tiers.*.min_pax' => 'required|integer|min:1',
            'price_tiers.*.max_pax' => 'nullable|integer|gte:price_tiers.*.min_pax',
            'price_tiers.*.price' => 'required|numeric|min:0',

             // --- Array Validation ---
            'itinerary' => 'nullable|array',
            'itinerary.*.day' => 'required_with:itinerary|integer|min:1',
            'itinerary.*.title' => 'required_with:itinerary|string|max:255',
            'itinerary.*.description' => 'nullable|string',
            'cost' => 'nullable|array',
            'cost.included' => 'nullable|array',
            'cost.included.*' => 'nullable|string|max:255',
            'cost.excluded' => 'nullable|array',
            'cost.excluded.*' => 'nullable|string|max:255',
            'faqs' => 'nullable|array',
            'faqs.*.question' => 'required_with:faqs|string|max:255',
            'faqs.*.answer' => 'required_with:faqs|string',
            'trip_info' => 'nullable|array',
            'trip_info.*.label' => 'required_with:trip_info|string|max:255',
            'trip_info.*.value' => 'required_with:trip_info|string|max:255',
            'trip_info.*.icon' => 'nullable|string|max:50',
             // --- Translated ---
            'name' => 'required|array','name.en' => 'required|string|max:255','name.id' => 'required|string|max:255',
            'description' => 'required|array','description.en' => 'nullable|string','description.id' => 'nullable|string',
            'location' => 'required|array','location.en' => 'nullable|string|max:255','location.id' => 'nullable|string|max:255',
            'category' => 'required|array','category.en' => 'nullable|string|max:255','category.id' => 'nullable|string|max:255',
             // --- Images / Deletion ---
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'delete_images' => 'nullable|array',
            'delete_images.*' => 'integer|exists:images,id'
        ], [
             // [NEW] Custom messages for price_tiers
            'price_tiers.required' => 'You must add at least one price tier.',
            'price_tiers.min' => 'You must add at least one price tier.',
            'price_tiers.*.min_pax.required' => 'The Min Pax field is required.',
            'price_tiers.*.min_pax.integer' => 'Min Pax must be a number.',
            'price_tiers.*.min_pax.min' => 'Min Pax must be at least 1.',
            'price_tiers.*.max_pax.gte' => 'Max Pax must be greater than or equal to Min Pax.',
            'price_tiers.*.price.required' => 'The Price field is required.',
            'price_tiers.*.price.numeric' => 'The Price must be a number.',
        ]);

        \Log::info("Attempting to update HolidayPackage ID: " . $holidayPackage->id);
        \Log::info("Validated Data:", $validatedData);

        DB::beginTransaction();
        try {
            // 2. Separate translation data
            $translationData = [];
            foreach (['en', 'id'] as $locale) {
                 if (isset($validatedData['name'][$locale])) { // Check based on a required field
                    $translationData[$locale] = [
                        'name' => $validatedData['name'][$locale],
                        'description' => $validatedData['description'][$locale] ?? null,
                        'location' => $validatedData['location'][$locale] ?? null,
                        'category' => $validatedData['category'][$locale] ?? null,
                    ];
                 }
            }

            // 3. Prepare data for the main model update (including arrays, excluding translations & image fields)
            $packageData = Arr::except($validatedData, ['images', 'delete_images', 'en', 'id']);
             // Ensure array fields are set to null if empty/not provided to clear them if needed
             $arrayFields = ['itinerary', 'cost', 'faqs', 'trip_info'];
             foreach ($arrayFields as $field) {
                 if (!isset($packageData[$field]) || !is_array($packageData[$field]) || empty($packageData[$field])) {
                     $packageData[$field] = null;
                 }
             }
            // 'price_tiers' is now a required field, so it doesn't need to be in $arrayFields

            // 4. Update the main model attributes (including arrays)
            // Let $casts handle JSON conversion
            $holidayPackage->fill($packageData);

            // 5. Update translations
            foreach ($translationData as $locale => $data) {
                $holidayPackage->translateOrNew($locale)->fill($data);
            }

            \Log::info("Model state BEFORE save:", $holidayPackage->toArray());
            \Log::info("Model dirty attributes:", $holidayPackage->getDirty());

            // 6. Save the model and translations
            $isSaved = $holidayPackage->save();

            \Log::info("HolidayPackage update save() result: " . ($isSaved ? 'Success' : 'Failed'));

            // 7. Handle Image Deletion
            if ($request->filled('delete_images')) {
                 $imagesToDelete = Image::whereIn('id', $request->input('delete_images'))
                                       ->where('imageable_id', $holidayPackage->id)
                                       ->where('imageable_type', HolidayPackage::class)
                                       ->get();
                foreach ($imagesToDelete as $image) {
                    if ($image->url) {
                       Storage::disk('public')->delete($image->url);
                    }
                    $image->delete();
                }
            }

            // 8. Handle New Image Uploads
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('holiday-packages', 'public');
                    // Use 'url' key to match Image model
                    $holidayPackage->images()->create(['url' => $path]);
                }
            }

            DB::commit();
            \Log::info("DB Commit successful for update. Redirecting...");
            return redirect()->route('admin.packages.index')->with('success', 'Holiday package updated successfully!');

        } catch (ValidationException $e) {
             DB::rollBack();
             \Log::error("ValidationException during update:", $e->errors());
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating holiday package: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
             $previous = $e->getPrevious();
             \Log::error($previous ? ('Previous Exception: ' . $previous->getMessage()) : 'No previous exception details.');
            return redirect()->back()->with('error', 'Failed to update holiday package. Error: Check logs.')->withInput();
        }
    }
     /**
     * Remove the specified resource from storage.
     */
    public function destroy(HolidayPackage $holidayPackage)
    {
        DB::beginTransaction();
        try {
            // Delete associated images first
            foreach ($holidayPackage->images as $image) {
                // [FIX] Use $image->url
                Storage::disk('public')->delete($image->url);
                $image->delete();
            }

            // Delete the package
            $holidayPackage->delete();

            DB::commit();
             // Redirect back to index with success message
            return redirect()->route('admin.packages.index')->with('success', 'Holiday package deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting holiday package: ' . $e->getMessage());
             // Redirect back to index with error message
            return redirect()->route('admin.packages.index')->with('error', 'Failed to delete holiday package.');        }
    }
    public function storeImage(Request $request, HolidayPackage $package)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ]);

        try {
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    // Store the file and get its path
                    $path = $imageFile->store('holiday-packages', 'public');

                    // --- >>> CHANGE 'path' TO 'url' HERE <<< ---
                    $package->images()->create([
                        'url' => $path, // Use 'url' as the key to match the model/DB
                        // 'type' => 'gallery', // Add type if you use it
                    ]);
                    // --- >>> END CHANGE <<< ---
                }
            }
            return redirect()->route('admin.packages.edit', $package->id)->with('success', 'Images uploaded successfully!');

        } catch (\Exception $e) {
            \Log::error('Error uploading package image: ' . $e->getMessage());
            $previous = $e->getPrevious();
            // Log the specific SQL error if available
            \Log::error($previous ? $previous->getMessage() : 'No previous exception details.');
            return redirect()->back()->with('error', 'Failed to upload images. Error: Check logs for details.');
        }
    }

    /**
     * Remove the specified image from storage and database.
     * Mimics CarRentalController::destroyImage
     */
   /**
     * Remove the specified image from storage and database.
     */
    public function destroyImage(HolidayPackage $package, Image $image)
    {
         // Optional: Ownership check (good to keep)
         if ($image->imageable_id !== $package->id || $image->imageable_type !== HolidayPackage::class) {
             return redirect()->back()->with('error', 'Image not found or does not belong to this package.');
         }

        try {
            // ✅ Add a check for $image->url before deleting from storage
            if ($image->url) {
                Storage::disk('public')->delete($image->url); // Only delete if path exists
            } else {
                // Optionally log a warning if the path was missing
                 \Log::warning("Image record ID {$image->id} for package {$package->id} had a null URL/path upon deletion.");
            }

            // Delete the image record (always do this)
            $image->delete();

            return redirect()->back()->with('success', 'Image deleted successfully!');

        } catch (\Exception $e) {
            \Log::error('Error deleting package image: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete image. Error: ' . $e->getMessage());
        }
    }

    public function updateThumbnail(Request $request, HolidayPackage $package)
    {
        $request->validate([
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // Validate the single thumbnail file
        ]);

        DB::beginTransaction();
        try {
            // Find and delete the existing thumbnail for this package, if any
            $existingThumbnail = $package->images()->where('type', 'thumbnail')->first();
            if ($existingThumbnail) {
                Storage::disk('public')->delete($existingThumbnail->url); // Use 'url' column
                $existingThumbnail->delete();
            }

            // Store the new thumbnail
            $path = $request->file('thumbnail')->store('holiday-packages/thumbnails', 'public'); // Store in a subfolder

            // Create the new thumbnail image record
            $package->images()->create([
                'url' => $path, // Use 'url' column
                'type' => 'thumbnail',
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Thumbnail updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating package thumbnail: ' . $e->getMessage());
             $previous = $e->getPrevious();
             \Log::error($previous ? $previous->getMessage() : 'No previous exception details.');
            return redirect()->back()->with('error', 'Failed to update thumbnail. Error: Check logs.');
        }
    }
}