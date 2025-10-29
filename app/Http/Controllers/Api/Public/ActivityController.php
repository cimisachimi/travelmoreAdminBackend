<?php
// File: app/Http/Controllers/Api/Public/ActivityController.php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request; // Import Request

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
        $activities = Activity::with(['translations', 'images'])
            ->latest() // Order by latest
            ->paginate(10); // Or ->get() if you don't need pagination

        // Map over the results to format them nicely for the API
        $formattedActivities = $activities->through(function ($activity) use ($locale) {
            // Get specific locale translation or fallback
            $translation = $activity->translateOrDefault($locale);

            // Add translated fields directly to the main object
            $activity->name = $translation->name ?? $activity->getTranslation('en', true)->name; // Fallback to 'en' name
            $activity->description = $translation->description ?? null;
            $activity->location = $translation->location ?? null;
            $activity->category = $translation->category ?? null;

            // Use accessors for image URLs (already defined in your Activity model)
            // thumbnail_url and images_url are appended automatically

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
    public function show(Request $request, Activity $activity)
    {
         // Get locale from header or fallback to config
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        // Eager load translations and images
        $activity->load(['translations', 'images']);

        // Get specific locale translation or fallback
        $translation = $activity->translateOrDefault($locale);

        // Add translated fields directly to the main object
        $activity->name = $translation->name ?? $activity->getTranslation('en', true)->name; // Fallback to 'en' name
        $activity->description = $translation->description ?? null;
        $activity->location = $translation->location ?? null;
        $activity->category = $translation->category ?? null;

        // Use accessors for image URLs (already defined in your Activity model)
        // thumbnail_url and images_url are appended automatically

        // Remove the raw relations to avoid redundant data
        unset($activity->translations);
        unset($activity->images);

        return response()->json($activity);
    }
}
