<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use Illuminate\Http\Request;

class HolidayPackageController extends Controller
{
    /**
     * Helper to format data package.
     */
    private function formatPackageData($package)
    {
        // Load missing relationships
        $package->loadMissing('images');

        // Get all image URLs
        $allImages = $package->images->map(function ($image) {
            return $image->full_url;
        });

        // Find thumbnail
        $thumbnail = $package->images->firstWhere('type', 'thumbnail');

        // Set custom attributes
        $package->images_url = $allImages;
        $package->thumbnail_url = $thumbnail ? $thumbnail->full_url : ($allImages->first() ?? null);

        // Unset relation to avoid duplication
        unset($package->images);

        // Ensure JSON fields are decoded properly
        $jsonFields = ['itinerary', 'cost', 'faqs', 'trip_info', 'addons'];

        foreach ($jsonFields as $field) {
            if (isset($package->{$field}) && is_string($package->{$field})) {
                $decoded = json_decode($package->{$field}, true);
                if (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) {
                     $package->{$field} = $decoded;
                } else {
                    $package->{$field} = (strpos($field, 'cost') !== false) ? ['included' => [], 'excluded' => []] : [];
                }
            } elseif (!isset($package->{$field})) {
                 $package->{$field} = (strpos($field, 'cost') !== false) ? ['included' => [], 'excluded' => []] : [];
            }
        }

        return $package;
    }

    /**
     * Get all ACTIVE holiday packages.
     */
    public function index()
    {
        // ✅ FIX: Filter to show ONLY active packages
        $packages = HolidayPackage::with('images')
            ->where('is_active', true)
            ->latest()
            ->paginate(10);

        // Format data
        $formattedPackages = $packages->through(function ($package) {
            return $this->formatPackageData($package);
        });

        return response()->json($formattedPackages);
    }

    /**
     * Get a single ACTIVE holiday package by ID.
     */

    public function showBySlug($slug)
    {
        // Search through the translations table for the slug
        $package = HolidayPackage::with('images')
            ->where('is_active', true)
            ->whereHas('translations', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        if (!$package) {
            return response()->json(['message' => 'Package not found'], 404);
        }

        $formattedPackage = $this->formatPackageData($package);

        return response()->json($formattedPackage);
    }

    public function show($id)
    {
        // ✅ FIX: Prevent accessing Draft packages via direct link
        $package = HolidayPackage::with('images')
            ->where('is_active', true)
            ->findOrFail($id);

        $formattedPackage = $this->formatPackageData($package);

        return response()->json($formattedPackage);
    }
}
