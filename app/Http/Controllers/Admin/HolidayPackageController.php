<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str; // Import added for automatic slug generation

class HolidayPackageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = HolidayPackage::with('images');

        if ($request->input('search')) {
            $search = $request->input('search');
            $query->whereTranslationLike('name', "%{$search}%")
                  ->orWhereTranslationLike('location', "%{$search}%");
        }

        $packages = $query->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/HolidayPackage/Index', [
            'packages' => $packages,
            'filters' => $request->only(['search']),
            'successMessage' => session('success'),
            'errorMessage' => session('error'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/HolidayPackage/Create');
    }

    // In app/Http/Controllers/Admin/HolidayPackageController.php

public function show(HolidayPackage $holidayPackage)
{
    // Eager load translations and images so they are available in the view
    $holidayPackage->load(['images', 'translations']);

    return Inertia::render('Admin/HolidayPackage/Show', [
        'package' => $holidayPackage
    ]);
}

    public function edit(HolidayPackage $holidayPackage)
    {
        $holidayPackage->load(['images', 'translations']);
        $packageData = $holidayPackage->toArray();
        $packageData['translations'] = $holidayPackage->getTranslationsArray();

        // Ensure is_active is boolean for the frontend
        $packageData['is_active'] = (bool) $holidayPackage->is_active;

        return Inertia::render('Admin/HolidayPackage/Edit', [
            'package' => $packageData,
            'successMessage' => session('success'),
            'errorMessage' => session('error'),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'is_active' => 'boolean',

            // --- Non-translated ---
            'duration' => 'required|integer|min:1',
            'rating' => 'nullable|numeric|min:0|max:5',
            'map_url' => 'nullable|url',

            // Price Tiers Validation
            'price_tiers' => 'required|array|min:1',
            'price_tiers.*.min_pax' => 'required|integer|min:1',
            'price_tiers.*.max_pax' => 'nullable|integer|gte:price_tiers.*.min_pax',
            'price_tiers.*.price' => 'required|numeric|min:0',

            // Add-ons Validation
            'addons' => 'nullable|array',
            'addons.*.name' => 'required|string|max:255',
            'addons.*.price' => 'required|numeric|min:0',

            // Arrays (JSON)
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

            // Translated Attributes
            'name' => 'required|array','name.en' => 'required|string|max:255','name.id' => 'required|string|max:255',
            'description' => 'required|array','description.en' => 'nullable|string','description.id' => 'nullable|string',
            'location' => 'required|array','location.en' => 'nullable|string|max:255','location.id' => 'nullable|string|max:255',
            'category' => 'required|array','category.en' => 'nullable|string|max:255','category.id' => 'nullable|string|max:255',

            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ], [
            'price_tiers.required' => 'You must add at least one price tier.',
            'price_tiers.min' => 'You must add at least one price tier.',
        ]);

        DB::beginTransaction();
        try {
            $translationFields = ['name', 'description', 'location', 'category'];
            $translationData = [];

            foreach (['en', 'id'] as $locale) {
                foreach ($translationFields as $field) {
                    if (isset($validatedData[$field][$locale])) {
                        $translationData[$locale][$field] = $validatedData[$field][$locale];
                    }
                }
                // Automatic slug generation for store
                $translationData[$locale]['slug'] = Str::slug($validatedData['name'][$locale]) . '-' . Str::random(5);
            }

            $packageData = Arr::except($validatedData, array_merge(['images'], $translationFields));
            $packageData['is_active'] = $request->boolean('is_active');
            $packageData['addons'] = $request->addons ?? [];

            $package = HolidayPackage::create($packageData);

            foreach ($translationData as $locale => $data) {
                $package->translateOrNew($locale)->fill($data);
            }
            $package->save();

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $imageFile) {
                    $path = $imageFile->store('holiday-packages', 'public');
                    $type = $index === 0 ? 'thumbnail' : 'gallery';
                    $package->images()->create([
                        'url' => $path,
                        'type' => $type
                    ]);
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
            return redirect()->back()->with('error', 'Failed to create holiday package.')->withInput();
        }
    }

    public function update(Request $request, HolidayPackage $holidayPackage)
    {
        $validatedData = $request->validate([
            'is_active' => 'boolean',
            'duration' => 'required|integer|min:1',
            'rating' => 'nullable|numeric|min:0|max:5',
            'map_url' => 'nullable|url',
            'price_tiers' => 'required|array|min:1',
            'price_tiers.*.min_pax' => 'required|integer|min:1',
            'price_tiers.*.max_pax' => 'nullable|integer|gte:price_tiers.*.min_pax',
            'price_tiers.*.price' => 'required|numeric|min:0',
            'addons' => 'nullable|array',
            'addons.*.name' => 'required|string|max:255',
            'addons.*.price' => 'required|numeric|min:0',
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
            'name' => 'required|array','name.en' => 'required|string|max:255','name.id' => 'required|string|max:255',
            'description' => 'required|array','description.en' => 'nullable|string','description.id' => 'nullable|string',
            'location' => 'required|array','location.en' => 'nullable|string|max:255','location.id' => 'nullable|string|max:255',
            'category' => 'required|array','category.en' => 'nullable|string|max:255','category.id' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'delete_images' => 'nullable|array',
            'delete_images.*' => 'integer|exists:images,id'
        ]);

        DB::beginTransaction();
        try {
            $translationData = [];
            foreach (['en', 'id'] as $locale) {
                 if (isset($validatedData['name'][$locale])) {
                    $translationData[$locale] = [
                        'name' => $validatedData['name'][$locale],
                        'description' => $validatedData['description'][$locale] ?? null,
                        'location' => $validatedData['location'][$locale] ?? null,
                        'category' => $validatedData['category'][$locale] ?? null,
                        // Automatic slug generation for update
                        'slug' => Str::slug($validatedData['name'][$locale]) . '-' . Str::random(5),
                    ];
                 }
            }

            $packageData = Arr::except($validatedData, ['images', 'delete_images', 'name', 'description', 'location', 'category', 'en', 'id']);
            $packageData['is_active'] = $request->boolean('is_active');
            $packageData['addons'] = $request->addons ?? [];

             $arrayFields = ['itinerary', 'cost', 'faqs', 'trip_info'];
             foreach ($arrayFields as $field) {
                 if (!isset($packageData[$field]) || !is_array($packageData[$field]) || empty($packageData[$field])) {
                     $packageData[$field] = null;
                 }
             }

            $holidayPackage->fill($packageData);

            foreach ($translationData as $locale => $data) {
                $holidayPackage->translateOrNew($locale)->fill($data);
            }
            $holidayPackage->save();

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

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('holiday-packages', 'public');
                    $holidayPackage->images()->create([
                        'url' => $path,
                        'type' => 'gallery'
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('admin.packages.index')->with('success', 'Holiday package updated successfully!');

        } catch (ValidationException $e) {
             DB::rollBack();
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating holiday package: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update holiday package.')->withInput();
        }
    }

    public function destroy(HolidayPackage $holidayPackage)
    {
        DB::beginTransaction();
        try {
            foreach ($holidayPackage->images as $image) {
                if ($image->url) {
                    Storage::disk('public')->delete($image->url);
                }
                $image->delete();
            }
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
            return redirect()->back()->with('error', 'Failed to upload images.');
        }
    }

    public function destroyImage(HolidayPackage $package, Image $image)
    {
         if ($image->imageable_id !== $package->id || $image->imageable_type !== HolidayPackage::class) {
             return redirect()->back()->with('error', 'Image not found.');
         }

        try {
            if ($image->url) {
                Storage::disk('public')->delete($image->url);
            }
            $image->delete();
            return redirect()->back()->with('success', 'Image deleted successfully!');
        } catch (\Exception $e) {
            \Log::error('Error deleting package image: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete image.');
        }
    }

    public function updateThumbnail(Request $request, HolidayPackage $package)
    {
        $request->validate([
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $existingThumbnail = $package->images()->where('type', 'thumbnail')->first();
            if ($existingThumbnail) {
                Storage::disk('public')->delete($existingThumbnail->url);
                $existingThumbnail->delete();
            }

            $path = $request->file('thumbnail')->store('holiday-packages/thumbnails', 'public');

            $package->images()->create([
                'url' => $path,
                'type' => 'thumbnail',
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Thumbnail updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating package thumbnail: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update thumbnail.');
        }
    }
}
