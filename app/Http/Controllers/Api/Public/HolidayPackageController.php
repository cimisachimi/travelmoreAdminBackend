<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class HolidayPackageController extends Controller
{
    /**
     * Helper to format data package.
     */
    private function formatPackageData($package)
    {
        // Muat relasi gambar jika belum dimuat
        $package->loadMissing('images');

        // Dapatkan semua URL gambar dari accessor 'full_url' di model Image
        $allImages = $package->images->map(function ($image) {
            return $image->full_url; // Menggunakan accessor full_url dari model Image
        });

        // Temukan thumbnail
        $thumbnail = $package->images->firstWhere('type', 'thumbnail');

        // Atur atribut kustom
        $package->images_url = $allImages;
        $package->thumbnail_url = $thumbnail ? $thumbnail->full_url : ($allImages->first() ?? null);

        // Hapus relasi 'images' agar tidak terkirim duplikat
        unset($package->images);

        // --- ✅ FIX: Ensure JSON fields are decoded ---
        $jsonFields = ['itinerary', 'cost', 'faqs', 'trip_info'];
        foreach ($jsonFields as $field) {
            // Check if the attribute exists and is a string before decoding
            if (isset($package->{$field}) && is_string($package->{$field})) {
                $decoded = json_decode($package->{$field}, true);
                // Only assign if decoding was successful and resulted in an array/object
                if (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) {
                     $package->{$field} = $decoded;
                } else {
                    // Handle potential decode error or non-JSON string, e.g., set to empty array
                    $package->{$field} = (strpos($field, 'cost') !== false) ? ['included' => [], 'excluded' => []] : [];
                    // Log::warning("Failed to decode JSON field '$field' for package ID {$package->id}. Value was: " . $package->{$field});
                }
            } elseif (!isset($package->{$field})) {
                 // Ensure the field exists even if null in DB, initialize appropriately
                 $package->{$field} = (strpos($field, 'cost') !== false) ? ['included' => [], 'excluded' => []] : [];
            }
            // If it's already an array (due to model casting), leave it as is.
        }
        // --- END FIX ---


        // Atribut terjemahan (name, description, dll.) sudah otomatis ditambahkan
        // oleh model Translatable.
        // Atribut dari $appends (seperti regularPrice, exclusivePrice) juga
        // akan otomatis ditambahkan.

        return $package;
    }

    /**
     * Get all holiday packages.
     */
    public function index()
    {
        $packages = HolidayPackage::with('images')
            ->latest()
            ->paginate(10); // Or ->get() if no pagination

        // Format setiap paket dalam data paginasi
        $formattedPackages = $packages->through(function ($package) {
            return $this->formatPackageData($package);
        });

        return response()->json($formattedPackages);
    }

    /**
     * Get a single holiday package by ID.
     */
    public function show($id)
    {
        $package = HolidayPackage::with('images')->findOrFail($id);

        // Format data paket tunggal
        $formattedPackage = $this->formatPackageData($package);

        return response()->json($formattedPackage);
    }
}