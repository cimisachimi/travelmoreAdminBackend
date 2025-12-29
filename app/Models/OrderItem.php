<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',     // ✅ ADD THIS: Required to save service and addon names
        'order_id',
        'orderable_id',
        'orderable_type',
        'quantity',
        'price',
    ];

    /**
     * Get the parent orderable model (CarRental, Activity, etc.).
     *
     * ✅ This is the key fix. withDefault() prevents errors if the
     * related product has been deleted.
     */
    public function orderable(): MorphTo
    {
        return $this->morphTo()->withDefault([
            'name' => '[Product Not Found]',
            'brand' => 'N/A',
            'car_model' => '',
        ]);
    }

    /**
     * Get the order that this item belongs to.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
