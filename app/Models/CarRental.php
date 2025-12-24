<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarRental extends Model
{
    use HasFactory;

    protected $fillable = [
        'car_model',
        'slug', // ✅ Add this line
        'brand',
        'car_type',
        'category', // Add this line
        'transmission',
        'fuel_type',
        'capacity',
        'trunk_size',
        'description',
        'features',
        'price_per_day',
        'availability',
        'status',
    ];

    protected $casts = [
        'features' => 'array',
    ];

    public function translations()
    {
        return $this->hasMany(CarRentalTranslation::class);
    }

    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function availabilities()
    {
        return $this->hasMany(CarRentalAvailability::class);
    }
    public function bookings()
    {
        return $this->morphMany(Booking::class, 'bookable');
    }
}
