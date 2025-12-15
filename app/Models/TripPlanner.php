<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripPlanner extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'trip_type',
        'full_name',
        'email',
        'phone',
        'company_name',
        'brand_name',
        'province',
        'city',
        'address',
        'postal_code',
        'country',
        'pax_adults',
        'pax_teens',
        'pax_kids',
        'pax_seniors',
        'departure_date',
        'duration',
        'budget_pack',
        'addons',
        'budget_priorities',
        'travel_style',
        'other_travel_style',
        'travel_personality',
        'other_travel_personality',
        'activity_level',
        'must_visit',
        'attraction_preference',
        'food_preference',
        'other_food_preference',
        'accommodation_preference',
        'consent',
        'is_frequent_traveler',
        'travel_type',
        'price',
        'status', // ✅ Added
        'notes',  // ✅ Added
    ];

    protected $casts = [
        'addons' => 'array',
        'budget_priorities' => 'array',
        'travel_style' => 'array',
        'travel_personality' => 'array',
        'food_preference' => 'array',
        'consent' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookings()
    {
        return $this->morphMany(Booking::class, 'bookable');
    }
}
