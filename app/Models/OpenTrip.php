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
        'duration',
        'rating',
        'map_url',
        'price_tiers',
        'itinerary',
        'cost',
        'meeting_points'
    ];

    protected $casts = [
        'rating' => 'decimal:1',
        'price_tiers' => 'array',
        'itinerary' => 'array',
        'cost' => 'array',
        'meeting_points' => 'array',
    ];

    protected $appends = ['thumbnail_url', 'images_url'];

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
        return $thumbnail ? $thumbnail->full_url : ($this->images->first()?->full_url ?? null);
    }

    public function getImagesUrlAttribute()
    {
        return $this->images->map(fn($img) => $img->full_url);
    }

    // --- Helpers ---

    /**
     * Calculate "Starting From" price based on the lowest price in tiers.
     */
    public function getStartingFromPriceAttribute()
    {
        if (empty($this->price_tiers)) return 0;
        return collect($this->price_tiers)->min('price');
    }

    /**
     * Helper to sort price tiers by min_pax
     */
    protected function priceTiers(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                $tiers = json_decode($value ?: '[]', true);
                usort($tiers, fn ($a, $b) => ($a['min_pax'] ?? 0) <=> ($b['min_pax'] ?? 0));
                return $tiers;
            },
            set: function ($value) {
                return json_encode(is_array($value) ? array_values($value) : []);
            }
        );
    }
}
