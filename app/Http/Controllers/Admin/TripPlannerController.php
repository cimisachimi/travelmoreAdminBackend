<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TripPlanner;
use App\Models\Setting; // ✅ ADD THIS
use Illuminate\Http\Request; // ✅ ADD THIS
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache; // ✅ ADD THIS

class TripPlannerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get the paginated planners
        $planners = TripPlanner::with('user')->latest()->paginate(10);

        // Get the general price from settings
        $tripPlannerPrice = Setting::where('key', 'trip_planner_price')->first()->value ?? 0;

        return Inertia::render('Admin/TripPlanner/Index', [
            'planners' => $planners,
            'tripPlannerPrice' => $tripPlannerPrice, // ✅ Pass the price to the page
        ]);
    }

    /**
     * ✅ ADD THIS NEW METHOD
     * Update the general trip planner price.
     */
    public function updateGeneralPrice(Request $request)
    {
        $validated = $request->validate([
            'trip_planner_price' => 'required|numeric|min:0',
        ]);

        Setting::updateOrCreate(
            ['key' => 'trip_planner_price'],
            ['value' => $validated['trip_planner_price']]
        );

        Cache::forget('trip_planner_price'); // Clear cache if you use it

        return redirect()->route('admin.planners.index')->with('success', 'General price updated.');
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TripPlanner $tripPlanner)
    {
        return Inertia::render('Admin/TripPlanner/Edit', [
            'tripPlanner' => $tripPlanner->load('user'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TripPlanner $tripPlanner)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:Pending,Approved,Rejected',
            'notes' => 'nullable|string',
        ]);

        $tripPlanner->update($validated);

        return redirect()->route('admin.planners.index')->with('success', 'Trip Planner updated successfully.');
    }
}
