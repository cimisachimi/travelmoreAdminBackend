<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
// Impor Translatable
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;

class HolidayPackage extends Model implements TranslatableContract
{
    use HasFactory, Translatable; // Gunakan Trait

    // Tentukan atribut yang akan diterjemahkan
    public array $translatedAttributes = [
        'name',
        'description',
        'location',
        'category',
    ];

    // Hapus atribut terjemahan dari fillable utama
    protected $fillable = [
        'duration',
        'price_regular',
        'price_exclusive',
        'price_child',
        'rating',
        'map_url',
        // Field JSON (tidak diterjemahkan dalam contoh ini)
        'itinerary',
        'cost',
        'faqs',
        'trip_info',
    ];

    // Casts untuk kolom non-terjemahan
    protected $casts = [
        'price_regular' => 'decimal:2',
        'price_exclusive' => 'decimal:2',
        'price_child' => 'decimal:2',
        'rating' => 'decimal:1',
        // Cast JSON (tidak diterjemahkan dalam contoh ini)
        'itinerary' => 'array',
        'cost' => 'array',
        'faqs' => 'array',
        'trip_info' => 'array',
    ];

    // [FIX 1] Add 'thumbnail_url' to the $appends array
    protected $appends = [
        'images_url',
        'regularPrice',
        'exclusivePrice',
        'childPrice',
        'tripInfo',
        'mapUrl',
        'thumbnail_url', // <-- ADD THIS LINE
    ];

    // Relasi (tetap sama)
    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function bookings()
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    // ----- ACCESSORS -----

    // [FIX 2] Add the new accessor method for the thumbnail
    public function getThumbnailUrlAttribute()
    {
        // The 'images' relation is eager loaded by with('images') in the controller
        // We find the first image that is marked as a 'thumbnail'
        $thumbnail = $this->images->firstWhere('type', 'thumbnail');

        if ($thumbnail) {
            // The Image model already has a 'full_url' accessor
            return $thumbnail->full_url;
        }

        // Optional: fallback to the *first* image if no thumbnail is set
        // $firstImage = $this->images->first();
        // if ($firstImage) {
        //     return $firstImage->full_url;
        // }

        // Otherwise, return null
        return null;
    }


    // Accessor images_url (tetap sama)
    public function getImagesUrlAttribute()
    {
        return $this->images->map(function ($image) {
            // Assuming your Image model has a 'full_url' accessor
            return $image->full_url; 
        });
    }

    // Accessor harga (tetap sama)
    public function getRegularPriceAttribute()
    {
        return $this->attributes['price_regular'];
    }

    public function getExclusivePriceAttribute()
    {
        return $this->attributes['price_exclusive'];
    }

    public function getChildPriceAttribute()
    {
        $childPrice = $this->attributes['price_child'] ?? 0;
        $exclusivePrice = $this->attributes['price_exclusive'] ?? 0;
        if ($childPrice > 0) {
            return $childPrice;
        }
        return $exclusivePrice * 0.5;
    }

     // Accessor tripInfo (mengambil dari tabel utama)
     public function getTripInfoAttribute()
     {
         // This is wrong, it should be $this->attributes['trip_info']
         // But based on your casts, it's already an array.
         return $this->attributes['trip_info'] ?? [];
     }


    // Accessor mapUrl (tetap sama)
    public function getMapUrlAttribute()
    {
        return $this->attributes['map_url'];
    }
}