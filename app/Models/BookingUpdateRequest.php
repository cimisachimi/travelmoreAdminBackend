<?php
// app/Models/BookingUpdateRequest.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingUpdateRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'user_id',
        'requested_changes',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'requested_changes' => 'array',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
