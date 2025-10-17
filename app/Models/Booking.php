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
        'booking_date', // ✅ ADD THIS LINE
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
    // ✅ --- ADD THIS ENTIRE FUNCTION ---
    /**
     * Get the order associated with the booking.
     */
    public function order()
    {
        return $this->hasOne(Order::class);
    }

    /**
     * Get the transaction for the booking.
     */
    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }
}