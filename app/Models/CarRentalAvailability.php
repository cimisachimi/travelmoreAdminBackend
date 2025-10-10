<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarRentalAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'car_rental_id',
        'date',
        'status',
    ];

    public function carRental()
    {
        return $this->belongsTo(CarRental::class);
    }
}