<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'order_id',
        'transaction_code', // Required for Refunds
        'user_id',
        'snap_token',
        'status',
        'gross_amount',
        'payment_type',
        'payment_payloads',
        'notes',            // ✅ REQUIRED: Fixes the status update issue for Down Payments
    ];

    /**
     * A Transaction is always associated with one Order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * A Transaction is always initiated by a User.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
