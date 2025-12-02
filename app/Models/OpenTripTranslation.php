<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpenTripTranslation extends Model
{
    public $timestamps = false;
    protected $fillable = ['name', 'location', 'category', 'description'];
}
