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
use Illuminate\Validation\ValidationException;

class HolidayPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = HolidayPackage::with('images');

        // ✅ ADD: Search Logic for Translatable Fields
        if ($request->input('search')) {
            $search = $request->input('search');
            // Uses Astrotomic's whereTranslationLike for cleaner syntax on translated fields
            $query->whereTranslationLike('name', "%{$search}%")
                  ->orWhereTranslationLike('location', "%{$search}%");
        }

        $packages = $query->latest()
            ->paginate(10)
            ->withQueryString(); // Keep search params in pagination links

        return Inertia::render('Admin/HolidayPackage/Index', [
            'packages' => $packages,
            'filters' => $request->only(['search']), // Pass search term back to view for the input field
            'successMessage' => session('success'),
            'errorMessage' => session('error'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/HolidayPackage/Create');
    }

    /**
     * Display the specified resource.
     */
    public function show(HolidayPackage $holidayPackage)
    {
        // Load translations and images
        $holidayPackage->load(['images', 'translations']);

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
        $holidayPackage->load(['images', 'translations']);

        $packageData = $holidayPackage->toArray();
        $packageData['translations'] = $holidayPackage->getTranslationsArray();

        return Inertia::render('Admin/HolidayPackage/Edit', [
            'package' => $packageData,
            'successMessage' => session('success'),
            'errorMessage' => session('error'),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 1. Validate request data
        $validatedData = $request->validate([
            // --- Non-translated ---
            'duration' => 'required|integer|min:1',
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
            $packageData = Arr::except($validatedData, ['images']);

            // 3. Create the HolidayPackage
            $package = HolidayPackage::create($packageData);

            // 4. Handle Image Uploads
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('holiday-packages', 'public');
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

        DB::beginTransaction();
        try {
            // 2. Separate translation data
            $translationData = [];
            foreach (['en', 'id'] as $locale) {
                 if (isset($validatedData['name'][$locale])) {
                    $translationData[$locale] = [
                        'name' => $validatedData['name'][$locale],
                        'description' => $validatedData['description'][$locale] ?? null,
                        'location' => $validatedData['location'][$locale] ?? null,
                        'category' => $validatedData['category'][$locale] ?? null,
                    ];
                 }
            }

            // 3. Prepare data for the main model update
            $packageData = Arr::except($validatedData, ['images', 'delete_images', 'en', 'id']);

             // Ensure array fields are set to null if empty to clear them if needed
             $arrayFields = ['itinerary', 'cost', 'faqs', 'trip_info'];
             foreach ($arrayFields as $field) {
                 if (!isset($packageData[$field]) || !is_array($packageData[$field]) || empty($packageData[$field])) {
                     $packageData[$field] = null;
                 }
             }

            // 4. Update the main model attributes
            $holidayPackage->fill($packageData);

            // 5. Update translations
            foreach ($translationData as $locale => $data) {
                $holidayPackage->translateOrNew($locale)->fill($data);
            }

            // 6. Save the model and translations
            $holidayPackage->save();

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
                    $holidayPackage->images()->create(['url' => $path]);
                }
            }

            DB::commit();
            return redirect()->route('admin.packages.index')->with('success', 'Holiday package updated successfully!');

        } catch (ValidationException $e) {
             DB::rollBack();
             \Log::error("ValidationException during update:", $e->errors());
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating holiday package: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
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
                if ($image->url) {
                    Storage::disk('public')->delete($image->url);
                }
                $image->delete();
            }

            // Delete the package
            $holidayPackage->delete();

            DB::commit();
            return redirect()->route('admin.packages.index')->with('success', 'Holiday package deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting holiday package: ' . $e->getMessage());
            return redirect()->route('admin.packages.index')->with('error', 'Failed to delete holiday package.');
        }
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
                    $path = $imageFile->store('holiday-packages', 'public');

                    $package->images()->create([
                        'url' => $path,
                    ]);
                }
            }
            return redirect()->route('admin.packages.edit', $package->id)->with('success', 'Images uploaded successfully!');

        } catch (\Exception $e) {
            \Log::error('Error uploading package image: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to upload images. Error: Check logs for details.');
        }
    }

    /**
     * Remove the specified image from storage and database.
     */
    public function destroyImage(HolidayPackage $package, Image $image)
    {
         // Optional: Ownership check
         if ($image->imageable_id !== $package->id || $image->imageable_type !== HolidayPackage::class) {
             return redirect()->back()->with('error', 'Image not found or does not belong to this package.');
         }

        try {
            if ($image->url) {
                Storage::disk('public')->delete($image->url);
            }

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
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        DB::beginTransaction();
        try {
            // Find and delete the existing thumbnail for this package, if any
            $existingThumbnail = $package->images()->where('type', 'thumbnail')->first();
            if ($existingThumbnail) {
                Storage::disk('public')->delete($existingThumbnail->url);
                $existingThumbnail->delete();
            }

            // Store the new thumbnail
            $path = $request->file('thumbnail')->store('holiday-packages/thumbnails', 'public');

            // Create the new thumbnail image record
            $package->images()->create([
                'url' => $path,
                'type' => 'thumbnail',
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Thumbnail updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating package thumbnail: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update thumbnail. Error: Check logs.');
        }
    }
}
