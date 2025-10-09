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
            'planners' => TripPlanner::latest()->get(),
        ]);
    }
}