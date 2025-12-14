<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 9);

        $galleries = Gallery::where('is_active', true)
            ->with(['translations', 'images'])
            ->latest()
            ->paginate($limit);

        $galleries->getCollection()->transform(function ($gallery) {
            return [
                'id' => $gallery->id,
                'title' => $gallery->title,
                'location' => $gallery->location, // ✅ Added
                'description' => $gallery->description,
                'best_time' => $gallery->best_time,
                'ticket_price' => $gallery->ticket_price,
                'redirect_url' => $gallery->redirect_url,
                'redirect_text' => $gallery->redirect_text,
                'thumbnail' => $gallery->images->first()
                    ? Storage::disk('public')->url($gallery->images->first()->url)
                    : null,
                'images' => $gallery->images->map(fn($img) => Storage::disk('public')->url($img->url)),
            ];
        });

        return response()->json($galleries);
    }
}
