<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TripPlanner;
use Inertia\Inertia;

class TripPlannerController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/TripPlanner/Index', [
            'planners' => TripPlanner::with('user')->latest()->paginate(10), // ✅ Use paginate()
        ]);
    }
    // ✅ ADD THIS NEW METHOD TO SHOW THE EDIT PAGE
    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TripPlanner $tripPlanner)
    {
        return Inertia::render('Admin/TripPlanner/Edit', [
            'tripPlanner' => $tripPlanner->load('user'),
        ]);
    }

    // ✅ ADD THIS NEW METHOD TO SAVE THE PRICE
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

        // This works because 'price', 'status', and 'notes' are in your $fillable array
        //
        $tripPlanner->update($validated);

        return redirect()->route('admin.trip-planner.index')->with('success', 'Trip Planner updated successfully.');
    }
}
