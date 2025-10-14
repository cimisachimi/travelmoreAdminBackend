<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripPlanner;
use Illuminate\Http\Request;

class TripPlannerController extends Controller
{
    /**
     * Get the authenticated user's trip planner data.
     */
    public function show(Request $request)
    {
        $planner = $request->user()->tripPlanner()->first();

        if (!$planner) {
            // It's okay if a user doesn't have a plan yet.
            // Return a null response so the frontend knows to show a blank form.
            return response()->json(null, 200);
        }

        return response()->json($planner);
    }

    /**
     * Create or update a trip planner for the authenticated user.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // This is a powerful Eloquent method that finds a record
        // based on the first array, and if it exists, updates it
        // with the second array. If not, it creates a new one.
        $planner = TripPlanner::updateOrCreate(
            ['user_id' => $user->id], // The key to find the record by
            $request->all()          // The data to update or create with
        );

        return response()->json($planner, 200);
    }
}