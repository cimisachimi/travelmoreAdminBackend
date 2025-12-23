<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
// Impor Translatable
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;
// [NEW] Add Attribute cast
use Illuminate\Database\Eloquent\Casts\Attribute;

class HolidayPackage extends Model implements TranslatableContract
{
    use HasFactory, Translatable; // Gunakan Trait

    // Tentukan atribut yang akan diterjemahkan
    public array $translatedAttributes = [
        'name',
        'description',
        'location',
        'category',
        'slug', // ✅ Tambahkan slug di sini
    ];

    // Hapus atribut terjemahan dari fillable utama
    protected $fillable = [
        'is_active', // ✅ Added Draft/Publish status
        'duration',
        // 'price_regular',    // [REMOVED]
        // 'price_exclusive',  // [REMOVED]
        // 'price_child',      // [REMOVED]
        'price_tiers', // [NEW] Add price_tiers
        'rating',
        'map_url',
        // Field JSON
        'itinerary',
        'cost',
        'faqs',
        'trip_info',
        'addons', // ✅ Add this
    ];

    // Casts untuk kolom non-terjemahan
    protected $casts = [
        'is_active' => 'boolean', // ✅ Cast to boolean
        // 'price_regular' => 'decimal:2',   // [REMOVED]
        // 'price_exclusive' => 'decimal:2', // [REMOVED]
        // 'price_child' => 'decimal:2',   // [REMOVED]
        'rating' => 'decimal:1',
        'price_tiers' => 'array', // [NEW] Cast price_tiers
        // Cast JSON
        'itinerary' => 'array',
        'cost' => 'array',
        'faqs' => 'array',
        'trip_info' => 'array',
        'addons' => 'array', // ✅ Add this
    ];

    // [FIX 1] Add 'thumbnail_url' to the $appends array
    protected $appends = [
        'images_url',
        // 'regularPrice',    // [REMOVED]
        // 'exclusivePrice',  // [REMOVED]
        // 'childPrice',      // [REMOVED]
        'tripInfo',
        'mapUrl',
        'thumbnail_url',
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
        $thumbnail = $this->images->firstWhere('type', 'thumbnail');

        if ($thumbnail) {
            return $thumbnail->full_url;
        }
        return null;
    }


    // Accessor images_url (tetap sama)
    public function getImagesUrlAttribute()
    {
        return $this->images->map(function ($image) {
            return $image->full_url;
        });
    }

    // [REMOVED] Old Price Accessors
    // public function getRegularPriceAttribute() { ... }
    // public function getExclusivePriceAttribute() { ... }
    // public function getChildPriceAttribute() { ... }

     // Accessor tripInfo (tetap sama)
     public function getTripInfoAttribute()
     {
         return $this->attributes['trip_info'] ?? [];
     }


    // Accessor mapUrl (tetap sama)
    public function getMapUrlAttribute()
    {
        return $this->attributes['map_url'];
    }


    // ----- [NEW] TIERED PRICING METHODS -----

    /**
     * Get the price per person based on the total number of participants.
     *
     * @param int $paxCount The total number of participants (e.g., adults + children)
     * @return float|null The price per pax, or null if no price is found
     */
    public function getPricePerPax(int $paxCount): ?float
    {
        // Use the accessor to ensure price_tiers is a sorted array
        $priceTiers = $this->price_tiers;

        if (empty($priceTiers)) {
            // No fallback, as requested.
            return null;
        }

        foreach ($priceTiers as $tier) {
            $minPax = $tier['min_pax'] ?? 0;
            // If max_pax is null/empty/0, treat it as "and above" for that tier
            $maxPax = $tier['max_pax'] ?? null;

            // Case 1: Tier has min and max (e.g., 6-10 pax)
            if ($maxPax && $maxPax > 0) {
                if ($paxCount >= $minPax && $paxCount <= $maxPax) {
                    return (float)($tier['price'] ?? 0);
                }
            }
            // Case 2: Tier only has min (e.g., 21+ pax)
            // This will match if it's the last tier (due to sorting)
            else {
                if ($paxCount >= $minPax) {
                    return (float)($tier['price'] ?? 0);
                }
            }
        }

        // If $paxCount is lower than the first tier's min_pax, or no tier matches
        return null;
    }

    /**
     * [NEW] Accessor/Mutator for price_tiers.
     *
     * Ensures 'price_tiers' is always an array when retrieved
     * and properly encoded as JSON when set.
     * It also sorts the tiers by 'min_pax' automatically.
     */
    protected function priceTiers(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                $tiers = json_decode($value ?: '[]', true);
                // Sort by min_pax ascending
                usort($tiers, fn ($a, $b) => ($a['min_pax'] ?? 0) <=> ($b['min_pax'] ?? 0));
                return $tiers;
            },
            set: function ($value) {
                if (is_array($value)) {
                    // Ensure keys are reset if it's a sparse array from the frontend
                    $value = array_values($value);
                }
                return json_encode($value ?: []);
            }
        );
    }
}
