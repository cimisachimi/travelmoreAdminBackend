<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    /**
     * ✅ FIXED: All fields are now fillable
     */
    protected $fillable = [
        'user_id',
        'bookable_id',
        'bookable_type',
        'booking_date',  // ✅ KEPT THIS
        'status',
        'total_price',
        'payment_status',
        'details',
        'start_date',      // ✅ ADDED THIS
        'end_date',        // ✅ ADDED THIS
    ];

    /**
     * ✅ FIXED: All dates are cast
     */
    protected $casts = [
        'details' => 'array',
        'booking_date' => 'date', // ✅ KEPT THIS
        'start_date' => 'date',   // ✅ ADDED THIS
        'end_date' => 'date',     // ✅ ADDED THIS
    ];

    public function bookable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function order()
    {
        return $this->hasOne(Order::class);
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }
}