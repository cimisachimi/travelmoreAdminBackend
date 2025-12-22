<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TripPlanner;
use Illuminate\Http\Request;

class TripPlannerController extends Controller
{
    /**
     * Get ALL of the authenticated user's trip planners.
     */
    public function index(Request $request)
    {
        // Retrieve the collection of planners
        $planners = $request->user()->tripPlanners()->get();

        return response()->json($planners);
    }

    /**
     * Get a specific trip planner by ID.
     */
    public function show(Request $request)
    {
        // ✅ Fix: Only take $request as an argument to stop the error.
        // It fetches the latest plan for the user.
        $planner = $request->user()->tripPlanners()->latest()->first();

        if (!$planner) {
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

    $planner = TripPlanner::updateOrCreate(
        [
            'id' => $request->id, // ✅ MUST include ID here to allow creating new rows
            'user_id' => $user->id
        ],
        $request->all()
    );

    return response()->json($planner, 200);
}
}

