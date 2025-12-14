<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Gallery extends Model implements TranslatableContract
{
    use HasFactory, Translatable;

    protected $fillable = [
        'redirect_url',
        'redirect_text',
        'is_active',
    ];

    public $translatedAttributes = [
        'title',
        'location', // ✅ Added
        'description',
        'best_time',
        'ticket_price',
    ];

    public $translationModel = GalleryTranslation::class;

    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
