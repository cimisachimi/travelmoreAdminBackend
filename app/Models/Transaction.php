<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $guarded = ['id']; // Allow mass assignment for all fields except id

    protected $casts = [
        'payment_payloads' => 'array',
    ];
}