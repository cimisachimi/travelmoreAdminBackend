<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TripPlanner;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class TripPlannerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // ✅ CHANGED: Eager load 'bookings' to get payment status
        $planners = TripPlanner::with(['user', 'bookings'])
            ->latest()
            ->paginate(10);

        // Get the general price from settings
        $tripPlannerPrice = Setting::where('key', 'trip_planner_price')->first()->value ?? 0;

        return Inertia::render('Admin/TripPlanner/Index', [
            'planners' => $planners,
            'tripPlannerPrice' => $tripPlannerPrice,
        ]);
    }

    // ... (keep updateGeneralPrice, edit, update, etc. exactly as they were)
    public function updateGeneralPrice(Request $request)
    {
        $validated = $request->validate([
            'trip_planner_price' => 'required|numeric|min:0',
        ]);

        Setting::updateOrCreate(
            ['key' => 'trip_planner_price'],
            ['value' => $validated['trip_planner_price']]
        );

        Cache::forget('trip_planner_price');

        return redirect()->route('admin.planners.index')->with('success', 'General price updated.');
    }

    public function edit(TripPlanner $tripPlanner)
    {
        return Inertia::render('Admin/TripPlanner/Edit', [
            'tripPlanner' => $tripPlanner->load('user'),
        ]);
    }

    public function update(Request $request, TripPlanner $tripPlanner)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:Pending,Approved,Rejected',
            'notes' => 'nullable|string',
            'recommendation_content' => 'nullable|string',
        ]);

        $tripPlanner->update($validated);

        return redirect()->route('admin.planners.index')->with('success', 'Trip Planner updated successfully.');
    }
}
