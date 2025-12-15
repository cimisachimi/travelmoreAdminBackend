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
    public function index()
    {
        $planners = TripPlanner::with(['user', 'bookings'])
            ->latest()
            ->paginate(10);

        $tripPlannerPrice = Setting::where('key', 'trip_planner_price')->first()->value ?? 0;

        return Inertia::render('Admin/TripPlanner/Index', [
            'planners' => $planners,
            'tripPlannerPrice' => $tripPlannerPrice,
        ]);
    }

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
        // Load bookings to check payment status
        $tripPlanner->load('bookings');

        $globalPrice = Setting::where('key', 'trip_planner_price')->value('value') ?? 0;

        return Inertia::render('Admin/TripPlanner/Edit', [
            'tripPlanner' => $tripPlanner->load('user'),
            'globalPrice' => $globalPrice,
        ]);
    }

    public function update(Request $request, TripPlanner $tripPlanner)
    {
        $globalPrice = Setting::where('key', 'trip_planner_price')->value('value') ?? 0;

        // ✅ Validate against the new workflow statuses
        $validated = $request->validate([
            'status' => 'required|string|in:pending,drafting,sent_to_client,revision,completed,rejected',
            'notes' => 'nullable|string',
        ]);

        // Force price to match global setting
        $validated['price'] = $globalPrice;

        $tripPlanner->update($validated);

        return redirect()->route('admin.planners.index')->with('success', 'Trip Planner updated successfully.');
    }
}
