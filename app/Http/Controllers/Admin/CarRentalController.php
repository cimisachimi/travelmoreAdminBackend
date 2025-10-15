<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CarRental;
use App\Models\CarRentalTranslation;
use App\Models\CarRentalAvailability;
use Carbon\Carbon;

class CarRentalController extends Controller
{
    /**
     * Display a paginated listing of the resource.
     */
    public function index(Request $request)
    {
        $year = $request->query('year', Carbon::now()->format('Y'));
        $month = $request->query('month', Carbon::now()->format('m'));

        // *** THIS IS THE CHANGE ***
        // We are re-introducing pagination for a cleaner, faster list view.
        $carRentals = CarRental::with(['images', 'availabilities' => function ($query) use ($month, $year) {
            $query->whereYear('date', $year)->whereMonth('date', $month);
        }])
        ->latest() // Order by most recently created
        ->paginate(10) // Paginate the results, 10 per page
        ->withQueryString(); // Important for keeping filters on pagination links

        return Inertia::render('Admin/CarRental/Index', [
            'carRentals' => $carRentals,
            'filters' => [
                'year' => $year,
                'month' => (int)$month,
            ]
        ]);
    }
        public function show($id)
    {
        // ✅ FIXED: Added 'translations' to the load() method.
        // This is the key change to make sure your data is sent to the frontend.
        $carRental = CarRental::with(['images', 'availabilities', 'translations'])->findOrFail($id);

        return Inertia::render('Admin/CarRental/Show', [
            'carRental' => $carRental,
            'filters' => [
                'year' => date('Y'),
                'month' => date('m'),
            ],
        ]);
    }

    // ... all other methods (store, update_availability, destroy) remain unchanged ...
    
    public function store(Request $request)
    {
        $request->validate([
            'car_model' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'price_per_day' => 'required|numeric',
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'gallery.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
        ]);
        $carRental = CarRental::create($request->only('car_model', 'brand', 'price_per_day'));
        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('images/thumbnails', 'public');
            $carRental->images()->create(['url' => $path, 'type' => 'thumbnail']);
        }
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                $path = $file->store('images/gallery', 'public');
                $carRental->images()->create(['url' => $path, 'type' => 'gallery']);
            }
        }
        $startDate = Carbon::today();
        for ($i = 0; $i < 365; $i++) {
            $carRental->availabilities()->create([
                'date' => $startDate->copy()->addDays($i),
                'status' => 'available'
            ]);
        }
        return redirect()->route('admin.rentals.index')->with('success', 'Car rental created successfully.');
    }

    public function update_availability(Request $request, $id)
    {
        $request->validate([
            'year' => 'required|integer|date_format:Y',
            'month' => 'required|integer|between:1,12',
            'statuses' => 'required|array'
        ]);
        $carRental = CarRental::findOrFail($id);
        $year = $request->input('year');
        $month = $request->input('month');
        $statuses = $request->input('statuses', []);
        foreach ($statuses as $day => $newStatus) {
            if (!ctype_digit((string)$day)) {
                continue;
            }
            $date = Carbon::createFromDate($year, $month, $day)->toDateString();
            $availability = CarRentalAvailability::firstOrNew([
                'car_rental_id' => $carRental->id,
                'date' => $date,
            ]);
            if (in_array($newStatus, ['available', 'maintenance', 'booked'])) {
                $availability->status = $newStatus;
                $availability->save();
            }
        }
        return back()->with('success', 'Availability updated successfully.');
    }

    public function destroy($id)
    {
        $carRental = CarRental::findOrFail($id);
        $carRental->delete();
        return redirect()->route('admin.rentals.index')->with('success', 'Car rental deleted successfully.');
    }

     public function update(Request $request, CarRental $carRental)
    {
        $validatedData = $request->validate([
            // Non-translatable fields
            'brand' => 'required|string|max:255',
            'car_model' => 'required|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'trunk_size' => 'nullable|integer|min:0',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'required|string|in:available,unavailable,maintenance',

            // Translatable fields validation
            'translations' => 'required|array',
            'translations.en' => 'required|array', // Ensure English is present as a fallback
            'translations.*.description' => 'nullable|string',
            'translations.*.car_type' => 'nullable|string|max:255',
            'translations.*.transmission' => 'nullable|string|max:255',
            'translations.*.fuel_type' => 'nullable|string|max:255',
            'translations.*.features' => 'nullable|string',
        ]);

        // ✅ FIXED: Step 1 -> Update the main CarRental model with ONLY non-translatable data.
        $carRental->update($request->only([
            'brand',
            'car_model',
            'capacity',
            'trunk_size',
            'price_per_day',
            'status',
        ]));
        
        // ✅ FIXED: Step 2 -> Now, also update the main table's fallback fields using the English translation.
        // This ensures you always have default data on the main car_rentals table.
        $englishTranslation = $validatedData['translations']['en'];
        $carRental->description = $englishTranslation['description'];
        $carRental->car_type = $englishTranslation['car_type'];
        $carRental->transmission = $englishTranslation['transmission'];
        $carRental->fuel_type = $englishTranslation['fuel_type'];
        $carRental->features = !empty($englishTranslation['features']) ? array_map('trim', explode(',', $englishTranslation['features'])) : [];
        $carRental->save();


        // ✅ FIXED: Step 3 -> Loop through and save the detailed translations to the separate table.
        // This part was correct before, but it's crucial that it runs after the main update.
        foreach ($validatedData['translations'] as $locale => $data) {
            $carRental->translations()->updateOrCreate(
                ['locale' => $locale], // Match by locale
                [
                    'description' => $data['description'],
                    'car_type' => $data['car_type'],
                    'transmission' => $data['transmission'],
                    'fuel_type' => $data['fuel_type'],
                    'features' => !empty($data['features']) ? array_map('trim', explode(',', $data['features'])) : [],
                ]
            );
        }

        return redirect()->route('admin.rentals.show', $carRental->id)
                         ->with('success', 'Car rental updated successfully.');
    }
public function storeImage(Request $request, $id)
{
    $request->validate([
        'gallery' => 'required|array',
        'gallery.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048'
    ]);

    $carRental = CarRental::findOrFail($id);

    if ($request->hasFile('gallery')) {
        foreach ($request->file('gallery') as $file) {
            $path = $file->store('images/gallery', 'public');
            $carRental->images()->create(['url' => $path, 'type' => 'gallery']);
        }
    }

    return back()->with('success', 'Gallery images uploaded successfully.');
}

/**
 * Remove the specified image from storage.
 */
public function destroyImage($carRentalId, $imageId)
{
    // Ensure the image belongs to the car rental for security
    $carRental = CarRental::findOrFail($carRentalId);
    $image = $carRental->images()->findOrFail($imageId);

    // Optional: Delete the actual file from storage
    // Storage::disk('public')->delete($image->url);

    $image->delete();

    return back()->with('success', 'Image deleted successfully.');
}

public function updateThumbnail(Request $request, CarRental $carRental)
{
    $request->validate([
        'thumbnail' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
    ]);

    // Find and delete the old thumbnail from storage and database
    if ($oldThumbnail = $carRental->images()->where('type', 'thumbnail')->first()) {
        Storage::disk('public')->delete($oldThumbnail->url);
        $oldThumbnail->delete();
    }

    // Store the new thumbnail file
    $path = $request->file('thumbnail')->store('car_rentals/thumbnails', 'public');

    // Create a new image record in the database
    $carRental->images()->create([
        'url' => $path,
        'type' => 'thumbnail',
    ]);

    return back()->with('success', 'Thumbnail updated successfully.');
}
}