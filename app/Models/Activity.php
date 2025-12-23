<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;

class Activity extends Model implements TranslatableContract
{
    use HasFactory, Translatable;

    protected $fillable = [
        'is_active',
        'price',
        'status',
        'duration',
        'addons',
        'google_map_url', // ✅ Added
        'includes',       // ✅ Added (JSON)
    ];

    public array $translatedAttributes = [
        'name',
        'description',
        'location',
        'category',
        'itinerary',      // ✅ Added (Text)
        'notes',          // ✅ Added (Text)
        'slug', // ✅ Add this
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'addons' => 'array',
        'is_active' => 'boolean',
        'includes' => 'array', // ✅ Cast JSON to Array
    ];

    protected $appends = [
        'thumbnail_url',
        'images_url',
    ];

    // --- Relationships ---

    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function bookings()
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    // --- Accessors ---

    public function getThumbnailUrlAttribute()
    {
        $thumbnail = $this->images->firstWhere('type', 'thumbnail');
        if ($thumbnail) {
            return Storage::disk('public')->url($thumbnail->url);
        }
        $firstImage = $this->images->first();
        if ($firstImage) {
            return Storage::disk('public')->url($firstImage->url);
        }
        return null;
    }

    public function getImagesUrlAttribute()
    {
        return $this->images->map(function ($image) {
            return [
                'id' => $image->id,
                'url' => Storage::disk('public')->url($image->url),
                'type' => $image->type,
            ];
        });
    }
}
