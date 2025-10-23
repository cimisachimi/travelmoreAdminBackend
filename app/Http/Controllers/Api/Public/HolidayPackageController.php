<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use Illuminate\Http\Request;

class HolidayPackageController extends Controller
{
    /**
     * Get all holiday packages.
     * Translation is handled automatically based on App::getLocale().
     */
    public function index()
    {
        // Eager load non-translated relationships if needed
        $packages = HolidayPackage::with('images')
            ->latest()
            ->paginate(10); // Or ->get() if no pagination

        // Translated attributes (name, description, etc.) are included automatically
        return response()->json($packages);
    }

    /**
     * Get a single holiday package by ID.
     * Translation is handled automatically based on App::getLocale().
     */
    public function show($id)
    {
        // Eager load non-translated relationships if needed
        $package = HolidayPackage::with('images')->findOrFail($id);

        // Translated attributes are included automatically
        return response()->json($package);
    }
}