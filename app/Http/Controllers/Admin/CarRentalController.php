<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CarRental;
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
    public function show(Request $request, $id)
{
    $carRental = CarRental::with(['images', 'availabilities'])->findOrFail($id);

    // Add any other data you want to pass to the details page
    // For example, you could fetch recent bookings for this car here.

    return Inertia::render('Admin/CarRental/Show', [
        'carRental' => $carRental,
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

    public function update(Request $request, $id)
    {
        $carRental = CarRental::findOrFail($id);

        // ✅ Add validation for the new fields from your form
        $validatedData = $request->validate([
            'brand' => 'required|string|max:255',
            'car_model' => 'required|string|max:255',
            'price_per_day' => 'required|numeric|min:0',
            'description' => 'nullable|string', // Validate the description
            'availability' => 'required|integer|min:0',
            'status' => 'required|in:available,unavailable,maintenance',
        ]);

        // ✅ Update the model with the validated data
        $carRental->update($validatedData);

        return back()->with('success', 'Car details updated successfully.');
    }
/**
 * Store a new gallery image for the specified car rental.
 */
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
}