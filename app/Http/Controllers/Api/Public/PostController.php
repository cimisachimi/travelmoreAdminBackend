<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostTranslation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\App; // ✅ ADD THIS

class PostController extends Controller
{
    /**
     * Display a listing of published posts.
     */
    public function index(Request $request)
    {
        $limit = $request->query('limit', 10);

        $posts = Post::where('status', 'published')
            ->with(['author', 'images'])
            ->latest('published_at')
            ->paginate($limit);

        $posts->getCollection()->transform(function ($post) {
            return $this->formatPost($post);
        });

        return response()->json($posts);
    }

    /**
     * Display the specified post by its slug.
     */
    public function show(Request $request, $slug)
    {
        // Find the translation first
        $translation = PostTranslation::where('slug', $slug)->first();

        if (!$translation) {
            return response()->json(['message' => 'Post not found.'], 404);
        }

        // Find the parent post and check if it's published
        $post = Post::where('id', $translation->post_id)
            ->where('status', 'published')
            ->with(['author', 'images'])
            ->first();

        if (!$post) {
            return response()->json(['message' => 'Post not found or not published.'], 404);
        }

        // ✅ --- START OF FIX ---
        // Instead of setting locale on the model, set it for the whole app.
        // This is a more reliable way to ensure the translatable
        // package loads the correct language.
        App::setLocale($translation->locale);
        // ✅ --- END OF FIX ---

        return response()->json($this->formatPost($post));
    }

    /**
     * Helper function to format post data.
     */
    // In app/Http/Controllers/Api/Public/PostController.php

private function formatPost($post)
{
    return [
        'id' => $post->id,
        'slug' => $post->slug,
        'title' => $post->title,
        'content' => $post->content,
        'excerpt' => $post->excerpt,
        'status' => $post->status,
        'published_at' => $post->published_at ? $post->published_at->format('Y-m-d') : null,
        'author' => $post->author ? $post->author->name : 'Unknown',

        // 👇 UPDATE THIS SECTION
        'images' => $post->images->map(function ($image) {
            // Option A: Ensure it uses the public disk config (requires correct APP_URL in .env)
            return Storage::disk('public')->url($image->url);

            // Option B (Safer fallback): Use the asset helper to force the current domain
            // return asset('storage/' . $image->url);
        }),
    ];
}
}
