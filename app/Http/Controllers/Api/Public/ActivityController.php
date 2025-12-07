<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Display a listing of the resource, including translations and images.
     * Uses locale from request header or fallback.
     */
    public function index(Request $request)
    {
        // Get locale from header or fallback to config
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        // Eager load translations and images
        // ✅ ADDED: where('is_active', true) to show only published
        $activities = Activity::with(['translations', 'images'])
            ->where('is_active', true)
            ->latest()
            ->paginate(10);

        // Map over the results to format them nicely for the API
        $formattedActivities = $activities->through(function ($activity) use ($locale) {
            // Get specific locale translation or fallback
            $translation = $activity->translateOrDefault($locale);

            // Add translated fields directly to the main object
            $activity->name = $translation->name ?? $activity->getTranslation('en', true)->name; // Fallback to 'en' name
            $activity->description = $translation->description ?? null;
            $activity->location = $translation->location ?? null;
            $activity->category = $translation->category ?? null;

            // ✅ ENSURE ADDONS IS ARRAY
            $activity->addons = $activity->addons ?? [];

            // Remove the raw relations to avoid redundant data
            unset($activity->translations);
            unset($activity->images);

            return $activity;
        });

        return response()->json($formattedActivities);
    }

    /**
     * Display the specified resource, including translations and images.
     * Uses locale from request header or fallback.
     */
    public function show(Request $request, $id)
    {
         // Get locale from header or fallback to config
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        // ✅ ADDED: Find ONLY if active
        $activity = Activity::with(['translations', 'images'])
            ->where('is_active', true)
            ->findOrFail($id);

        // Get specific locale translation or fallback
        $translation = $activity->translateOrDefault($locale);

        // Add translated fields directly to the main object
        $activity->name = $translation->name ?? $activity->getTranslation('en', true)->name; // Fallback to 'en' name
        $activity->description = $translation->description ?? null;
        $activity->location = $translation->location ?? null;
        $activity->category = $translation->category ?? null;

        // ✅ ENSURE ADDONS IS ARRAY
        $activity->addons = $activity->addons ?? [];

        // Remove the raw relations to avoid redundant data
        unset($activity->translations);
        unset($activity->images);

        return response()->json($activity);
    }
}
