<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GalleryTranslation extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'title',
        'location', // ✅ Added
        'description',
        'best_time',
        'ticket_price',
        'locale',
    ];
}
