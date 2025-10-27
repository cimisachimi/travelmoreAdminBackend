<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage; // <-- Import Storage needed

class Image extends Model
{
    use HasFactory;

    // --- FIX 3: Use 'path' (or your actual column name) in fillable ---
    protected $fillable = ['path', 'type', 'imageable_id', 'imageable_type'];

    // Define the relationship
    public function imageable()
    {
        return $this->morphTo();
    }

    // --- FIX 1: Rename this accessor to getUrlAttribute ---
    // It creates a virtual 'url' attribute
    public function getUrlAttribute(): string | null
    {
        // Use the 'path' column (or your actual column name)
        if ($this->path) {
             // Ensure you're using the 'public' disk if that's where files are stored
            return Storage::disk('public')->url($this->path);
        }
        return null;
    }

    // --- FIX 2: Ensure 'url' is appended ---
    protected $appends = ['url'];
}