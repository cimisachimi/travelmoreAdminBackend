<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CarRental;
use Carbon\Carbon;

class CarRentalController extends Controller
{
    public function index(Request $request)
    {
        // Set default values if the request doesn't have them
        $year = $request->query('year', Carbon::now()->format('Y'));
        $month = $request->query('month', Carbon::now()->format('m'));

        $carRentals = CarRental::with(['images', 'availabilities' => function ($query) use ($month, $year) {
            $query->whereYear('date', $year)->whereMonth('date', $month);
        }])
        ->latest()
        ->paginate(10)
        ->withQueryString(); // Appends the query string to pagination links

        return Inertia::render('Admin/CarRental/Index', [
            'carRentals' => $carRentals,
            // This 'filters' array is now ALWAYS sent to the frontend
            'filters' => [
                'year' => $year,
                'month' => $month,
            ]
        ]);
    }

    // ... The store() method remains unchanged ...
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
}