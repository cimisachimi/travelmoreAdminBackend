<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'order_number',
        'status',
        'total_amount',
    ];

    /**
     * An Order belongs to a User.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * An Order has one associated Booking.
     */
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * An Order has many OrderItems.
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * An Order has one Transaction.
     */
    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }
}