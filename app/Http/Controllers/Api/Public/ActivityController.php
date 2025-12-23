<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Display a listing of active activities.
     */
    public function index(Request $request)
    {
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        $activities = Activity::with(['translations', 'images'])
            ->where('is_active', true)
            ->latest()
            ->paginate(10);

        $formattedActivities = $activities->through(function ($activity) use ($locale) {
            return $this->formatActivityData($activity, $locale);
        });

        return response()->json($formattedActivities);
    }

    /**
     * Get a single activity by ID.
     */
    public function show(Request $request, $id)
    {
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        $activity = Activity::with(['translations', 'images'])
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json($this->formatActivityData($activity, $locale));
    }

    /**
     * Get a single activity by SLUG.
     * ✅ Corrected to include formatting and localization.
     */
    public function showBySlug(Request $request, $slug)
    {
        $locale = $request->header('Accept-Language', config('app.fallback_locale'));

        $activity = Activity::with(['translations', 'images'])
            ->where('is_active', true)
            ->whereHas('translations', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        if (!$activity) {
            return response()->json(['message' => 'Activity not found'], 404);
        }

        return response()->json($this->formatActivityData($activity, $locale));
    }

    /**
     * Helper to ensure consistent data structure across all methods.
     */
    private function formatActivityData($activity, $locale)
    {
        // Get specific locale translation or fallback
        $translation = $activity->translateOrDefault($locale);

        // Add translated fields directly to the main object
        $activity->name = $translation->name ?? ($activity->translate('en')->name ?? 'Unnamed Activity');
        $activity->description = $translation->description ?? null;
        $activity->location = $translation->location ?? null;
        $activity->category = $translation->category ?? null;
        $activity->slug = $translation->slug ?? null; // ✅ Important for frontend SEO

        // Flatten additional translatable fields you added earlier
        $activity->itinerary = $translation->itinerary ?? null;
        $activity->notes = $translation->notes ?? null;

        // Ensure JSON fields are arrays
        $activity->addons = $activity->addons ?? [];
        $activity->includes = $activity->includes ?? ['included' => [], 'excluded' => []];

        // Clean up relations to reduce JSON size
        unset($activity->translations);

        return $activity;
    }
}
