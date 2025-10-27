<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityTranslation extends Model
{
    use HasFactory;

    public $timestamps = false; // Translations don't need timestamps

    protected $fillable = [
        'name',
        'description',
        'location',
        'category',
    ];
}