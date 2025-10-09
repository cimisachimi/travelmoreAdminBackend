<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripPlanner extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $guarded = ['id']; // A convenient way to make all fields fillable

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'addons' => 'array',
        'budget_priorities' => 'array',
        'travel_style' => 'array',
        'travel_personality' => 'array',
        'food_preference' => 'array',
        'departure_date' => 'date',
        'consent' => 'boolean',
    ];
}