<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_id', // ✅ Correct foreign key
        'snap_token',
        'status',
        'gross_amount',
        'payment_type',
        'payment_payloads',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}