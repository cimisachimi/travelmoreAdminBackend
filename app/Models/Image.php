<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage; // <-- Import Storage

class Image extends Model
{
    use HasFactory;

    // Use 'url' here as it's your actual column name
    protected $fillable = ['url', 'type', 'imageable_id', 'imageable_type'];

    // Define the relationship
    public function imageable()
    {
        return $this->morphTo();
    }

    // ✅ Add this accessor if it doesn't exist
    // It creates a virtual 'full_url' attribute
    public function getFullUrlAttribute(): string | null
    {
        // Use the 'url' column which stores the path
        if ($this->url) {
            return Storage::disk('public')->url($this->url);
        }
        return null;
    }

    // ✅ Ensure 'full_url' is appended to JSON/Array output
    protected $appends = ['full_url'];
}