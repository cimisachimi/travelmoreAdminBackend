<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    /**
     * ✅ FIXED: Updated fillable fields for polymorphism.
     */
    protected $fillable = [
        'user_id',
        'bookable_id',
        'bookable_type',
        'booking_date',
        'status',
        'total_price',
        'payment_status',
        'details',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'details' => 'array',
        'booking_date' => 'date',
    ];

    /**
     * ✅ FIXED: Define the polymorphic relationship.
     */
    public function bookable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user that owns the booking.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}