<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Astrotomic\Translatable\Contracts\Translatable as TranslatableContract;
use Astrotomic\Translatable\Translatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model implements TranslatableContract
{
    use HasFactory, Translatable;

    // 1. The "base" model's fillable fields
    protected $fillable = [
        'author_id',
        'status',
        'published_at',
    ];

    // 2. The attributes that are translatable
    public $translatedAttributes = [
        'title',
        'slug',
        'excerpt',
        'content',
    ];

    // 3. The related translation model
    public $translationModel = PostTranslation::class;

    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * Get the author of the post.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Get all of the post's images.
     */
    public function images(): MorphMany
    {
        // This uses your existing 'Image' model and polymorphic relationship
        return $this->morphMany(Image::class, 'imageable');
    }
}
