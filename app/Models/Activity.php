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

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        // 'name',  // <-- REMOVE THIS
        'price',
        'status',
        'duration',
        'addons', // ✅ Add this
    ];

    /**
     * The attributes that are translatable.
     *
     * @var array
     */
    public array $translatedAttributes = [
        'name',
        'description',
        'location',
        'category',

    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'addons' => 'array', // ✅ Add this
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
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
        // AFTER
if ($thumbnail) {
    return Storage::disk('public')->url($thumbnail->url); // <-- To this
}
$firstImage = $this->images->first();
if ($firstImage) {
    return Storage::disk('public')->url($firstImage->url); // <-- And this
}

        return null;
    }

    public function getImagesUrlAttribute()
    {
        return $this->images->map(function ($image) {
            return [
                'id' => $image->id,
                'url' => Storage::disk('public')->url($image->url), // <-- To this
                'type' => $image->type,
            ];
        });
    }
}
