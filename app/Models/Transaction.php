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
     *
     * This array is now clean and only contains the columns that
     * actually exist in your 'transactions' table after the cleanup.
     */
    protected $fillable = [
        'order_id',
        'user_id',
        'snap_token',
        'status',
        'gross_amount',
        'payment_type',
        'payment_payloads',
    ];

    /**
     * A Transaction is always associated with one Order.
     *
     * This is the single, correct way to link a transaction to what was purchased.
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