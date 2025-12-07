<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;
use Illuminate\Database\Eloquent\Casts\Attribute;

class OpenTrip extends Model implements TranslatableContract
{
    use HasFactory, Translatable;

    public $translatedAttributes = ['name', 'location', 'category', 'description'];

    protected $fillable = [
        'is_active',
        'duration',
        'rating',
        'map_url',
        'price_tiers',
        'itinerary',
        'cost',
        'meeting_points',
        'addons', // ✅ Add this
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'decimal:1',
        'price_tiers' => 'array',
        'itinerary' => 'array',
        'cost' => 'array',
        'meeting_points' => 'array',
        'addons' => 'array', // ✅ Add this
    ];

    // ✅ FIXED: Added 'starting_from_price' so it's sent to the frontend
    protected $appends = ['thumbnail_url', 'images_url', 'starting_from_price'];

    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function bookings()
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function getThumbnailUrlAttribute()
    {
        $thumbnail = $this->images->firstWhere('type', 'thumbnail');
        return $thumbnail ? $thumbnail->full_url : ($this->images->first()?->full_url ?? null);
    }

    public function getImagesUrlAttribute()
    {
        return $this->images->map(fn($img) => $img->full_url);
    }

    // This accessor calculates the price, but wasn't being appended before
    public function getStartingFromPriceAttribute()
    {
        if (empty($this->price_tiers) || !is_array($this->price_tiers)) return 0;

        // Ensure we extract valid numeric prices
        $minPrice = collect($this->price_tiers)->min('price');

        return $minPrice ? (float) $minPrice : 0;
    }

    protected function priceTiers(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                // Handle case where value is already an array (due to casting) or null
                if (is_array($value)) {
                    $tiers = $value;
                } else {
                    $tiers = json_decode($value ?: '[]', true);
                }

                if (is_array($tiers)) {
                    usort($tiers, fn ($a, $b) => ($a['min_pax'] ?? 0) <=> ($b['min_pax'] ?? 0));
                }

                return $tiers ?: [];
            },
            set: function ($value) {
                return json_encode(is_array($value) ? array_values($value) : []);
            }
        );
    }
}
