<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'gross_amount',
        'status',
        'snap_token',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // ✅ ADD THIS
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ✅ If you are referencing booking.holidayPackage, add this too:
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
