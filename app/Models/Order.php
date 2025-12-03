<?php
// app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // ✅ ADD THIS

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'discount_code_id', // ✅ ADD THIS
        'order_number',
        'subtotal', // ✅ ADD THIS
        'discount_amount', // ✅ ADD THIS
        'total_amount',
        'down_payment_amount',
        'status',
        'payment_deadline',
    ];

    protected $casts = [
        'payment_deadline' => 'datetime',
    ];

    /**
     * An Order belongs to a User.
     */
    public function user(): BelongsTo // ✅ Type-hint
    {
        return $this->belongsTo(User::class);
    }

    /**
     * An Order has many Transactions.
     */
    public function transactions() // ✅ Plural
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the single successful transaction (if one exists).
     */
    public function transaction(): \Illuminate\Database\Eloquent\Relations\HasOne // ✅ Type-hint
    {
        return $this->hasOne(Transaction::class)->where('status', 'settlement');
    }

    /**
     * An Order has one associated Booking.
     */
    public function booking(): BelongsTo // ✅ Type-hint
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * An Order has many OrderItems.
     */
    public function orderItems() // ✅ Plural
    {
        return $this->hasMany(OrderItem::class);
    }

    // ✅ --- ADD THIS ENTIRE FUNCTION ---
    /**
     * Get the discount code applied to this order.
     */
    public function discountCode(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }
}
