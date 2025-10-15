<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'orderable_id',
        'orderable_type',
        'price',
    ];

    public function orderable()
    {
        return $this->morphTo();
    }
}