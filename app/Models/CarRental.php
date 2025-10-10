<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarRental extends Model
{
    use HasFactory;

    protected $fillable = [
        'car_model',
        'brand',
        'description',
        'price_per_day',
        'availability',
        'status',
    ];

    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }

    public function availabilities()
    {
        return $this->hasMany(CarRentalAvailability::class);
    }
}