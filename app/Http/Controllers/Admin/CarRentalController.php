<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CarRental;
use App\Models\CarRentalTranslation;
use App\Models\CarRentalAvailability;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
class CarRentalController extends Controller
{
public function index(Request $request)
    {
        $year = $request->query('year', Carbon::now()->format('Y'));
        $month = $request->query('month', Carbon::now()->format('m'));

        $carRentals = CarRental::with(['images', 'availabilities' => function ($query) use ($month, $year) {
            $query->whereYear('date', $year)->whereMonth('date', $month);
        }])
        ->latest()
        ->paginate(10)
        ->withQueryString();

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
        $carRental = CarRental::with(['images', 'availabilities', 'translations'])->findOrFail($id);

        return Inertia::render('Admin/CarRental/Show', [
            'carRental' => $carRental,
            'filters' => [
                'year' => date('Y'),
                'month' => date('m'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'car_model' => 'required|string|max:255',
            'brand' => 'required|string|max:255',
            'category' => 'required|string|in:regular,exclusive', // New field validation
            'price_per_day' => 'required|numeric',
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'gallery.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
        ]);
        // ✅ Generate slug from car_model
        $data = $request->only('car_model', 'brand', 'category', 'price_per_day');
        $data['slug'] = Str::slug($request->car_model) . '-' . Str::random(5);

        $carRental = CarRental::create($data);

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

        return redirect()->route('admin.rentals.index')->with('success', 'Car rental created successfully.');
    }

    public function update(Request $request, CarRental $carRental)
{
    $validatedData = $request->validate([
        'brand' => 'required|string|max:255',
        'car_model' => 'required|string|max:255',
        'category' => 'required|string|in:regular,exclusive',
        'capacity' => 'nullable|integer|min:0',
        'trunk_size' => 'nullable|integer|min:0',
        'price_per_day' => 'required|numeric|min:0',
        'status' => 'required|string|in:available,unavailable,maintenance',
        'translations' => 'required|array',
        'translations.en' => 'required|array',
        'translations.*.description' => 'nullable|string',
        'translations.*.car_type' => 'nullable|string|max:255',
        'translations.*.transmission' => 'nullable|string|max:255',
        'translations.*.fuel_type' => 'nullable|string|max:255',
        'translations.*.features' => 'nullable|string',
    ]);

    // 1. Prepare data for the main table
    $updateData = $request->only([
        'brand',
        'car_model',
        'category',
        'capacity',
        'trunk_size',
        'price_per_day',
        'status',
    ]);

    // 2. ✅ Update slug ONLY if the car_model name has changed
    // We check this BEFORE the model is updated in the database
    if ($request->car_model !== $carRental->car_model) {
        $updateData['slug'] = Str::slug($request->car_model) . '-' . Str::random(5);
    }

    // 3. Perform a single update for main fields and slug
    $carRental->update($updateData);

    // 4. Update fallback fields on main table (English defaults)
    $english = $validatedData['translations']['en'];
    $carRental->description = $english['description'] ?? null;
    $carRental->car_type = $english['car_type'] ?? null;
    $carRental->transmission = $english['transmission'] ?? null;
    $carRental->fuel_type = $english['fuel_type'] ?? null;
    $carRental->features = !empty($english['features'])
        ? array_map('trim', explode(',', $english['features']))
        : [];
    $carRental->save();

    // 5. Update or create individual translations
    foreach ($validatedData['translations'] as $locale => $data) {
        $carRental->translations()->updateOrCreate(
            ['locale' => $locale],
            [
                'description' => $data['description'] ?? null,
                'car_type' => $data['car_type'] ?? null,
                'transmission' => $data['transmission'] ?? null,
                'fuel_type' => $data['fuel_type'] ?? null,
                'features' => !empty($data['features'])
                    ? array_map('trim', explode(',', $data['features']))
                    : [],
            ]
        );
    }

    return redirect()->route('admin.rentals.show', $carRental->id)
                     ->with('success', 'Car rental updated successfully.');
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
            if (!ctype_digit((string)$day)) continue;
            $date = Carbon::createFromDate($year, $month, $day)->toDateString();
            CarRentalAvailability::updateOrCreate(
                ['car_rental_id' => $carRental->id, 'date' => $date],
                ['status' => $newStatus]
            );
        }
        return back()->with('success', 'Availability updated successfully.');
    }

    public function destroy($id)
    {
        $carRental = CarRental::findOrFail($id);
        $carRental->delete();
        return redirect()->route('admin.rentals.index')->with('success', 'Car rental deleted successfully.');
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

    public function destroyImage($carRentalId, $imageId)
    {
        $carRental = CarRental::findOrFail($carRentalId);
        $image = $carRental->images()->findOrFail($imageId);

        if (Storage::disk('public')->exists($image->url)) {
             Storage::disk('public')->delete($image->url);
        }

        $image->delete();

        return back()->with('success', 'Image deleted successfully.');
    }

    public function updateThumbnail(Request $request, CarRental $carRental)
    {
        $request->validate([
            'thumbnail' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        if ($oldThumbnail = $carRental->images()->where('type', 'thumbnail')->first()) {
            if (Storage::disk('public')->exists($oldThumbnail->url)) {
                Storage::disk('public')->delete($oldThumbnail->url);
            }
            $oldThumbnail->delete();
        }

        $path = $request->file('thumbnail')->store('car_rentals/thumbnails', 'public');

        $carRental->images()->create([
            'url' => $path,
            'type' => 'thumbnail',
        ]);

        return back()->with('success', 'Thumbnail updated successfully.');
    }
}
