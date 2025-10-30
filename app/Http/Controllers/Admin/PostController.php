<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Post/Index', [
            'posts' => Post::with('author')
                ->latest()
                ->paginate(10)
                ->through(fn ($post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'status' => $post->status,
                    'author' => $post->author->name,
                    'published_at' => $post->published_at ? $post->published_at->format('d M Y') : 'N/A',
                ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Post/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,published',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'en.title' => 'required|string|max:255',
            'en.content' => 'required|string',
            'en.excerpt' => 'nullable|string',
            'idn.title' => 'required|string|max:255',
            'idn.content' => 'required|string',
            'idn.excerpt' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $post = Post::create([
                'author_id' => Auth::id(),
                'status' => $validated['status'],
                'published_at' => $validated['status'] == 'published' ? now() : null,
            ]);

            // Save English
            $post->translateOrNew('en')->title = $validated['en']['title'];
            $post->translateOrNew('en')->content = $validated['en']['content'];
            $post->translateOrNew('en')->excerpt = $validated['en']['excerpt'] ?? '';
            $post->translateOrNew('en')->slug = Str::slug($validated['en']['title']) . '-' . strtolower(Str::random(4));

            // Save Indonesian (from 'idn' key)
            $post->translateOrNew('id')->title = $validated['idn']['title'];
            $post->translateOrNew('id')->content = $validated['idn']['content'];
            $post->translateOrNew('id')->excerpt = $validated['idn']['excerpt'] ?? '';
            $post->translateOrNew('id')->slug = Str::slug($validated['idn']['title']) . '-' . strtolower(Str::random(4));

            $post->save();

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('posts', 'public');
                    $post->images()->create(['url' => $path]); // ✅ FIXED: 'path' to 'url'
                }
            }

            DB::commit();

            return redirect()->route('admin.posts.index')->with('success', 'Post created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            // This error is what you are seeing. We return it to the frontend.
            return back()->with('error', 'Error creating post: ' . $e->getMessage());
        }
    }

    public function edit(Post $post)
    {
        // Eager load translations and images
        $post->load('translations', 'images');

        return Inertia::render('Admin/Post/Edit', [ // This is used by our Index page
            'post' => [
                'id' => $post->id,
                'status' => $post->status,
                'images' => $post->images->map(fn ($img) => ['id' => $img->id, 'url' => $img->url]), // ✅ FIXED: 'path' to 'url'
                'en' => $post->translate('en'),
                'idn' => $post->translate('id'),
            ]
        ]);
    }

    public function update(Request $request, Post $post)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,published',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'deleted_images' => 'nullable|array',
            'deleted_images.*' => 'integer|exists:images,id',
            'en.title' => 'required|string|max:255',
            'en.content' => 'required|string',
            'en.excerpt' => 'nullable|string',
            'idn.title' => 'required|string|max:255',
            'idn.content' => 'required|string',
            'idn.excerpt' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $post->status = $validated['status'];
            if ($validated['status'] == 'published' && !$post->published_at) {
                $post->published_at = now();
            }

            // Save English
            $post->translateOrNew('en')->title = $validated['en']['title'];
            $post->translateOrNew('en')->content = $validated['en']['content'];
            $post->translateOrNew('en')->excerpt = $validated['en']['excerpt'] ?? '';
            $post->translateOrNew('en')->slug = Str::slug($validated['en']['title']) . '-' . strtolower(Str::random(4));

            // Save Indonesian (from 'idn' key)
            $post->translateOrNew('id')->title = $validated['idn']['title'];
            $post->translateOrNew('id')->content = $validated['idn']['content'];
            $post->translateOrNew('id')->excerpt = $validated['idn']['excerpt'] ?? '';
            $post->translateOrNew('id')->slug = Str::slug($validated['idn']['title']) . '-' . strtolower(Str::random(4));

            $post->save();

            // 1. Delete images marked for deletion
            if (!empty($validated['deleted_images'])) {
                $imagesToDelete = $post->images()->whereIn('id', $validated['deleted_images'])->get();
                foreach ($imagesToDelete as $image) {
                    Storage::disk('public')->delete($image->url); // ✅ FIXED: 'path' to 'url'
                    $image->delete();
                }
            }

            // 2. Add new images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('posts', 'public');
                    $post->images()->create(['url' => $path]); // ✅ FIXED: 'path' to 'url'
                }
            }

            DB::commit();

            return redirect()->route('admin.posts.index')->with('success', 'Post updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error updating post: ' . $e->getMessage());
        }
    }

    public function destroy(Post $post)
    {
        DB::beginTransaction();
        try {
            foreach ($post->images as $image) {
                Storage::disk('public')->delete($image->url); // ✅ FIXED: 'path' to 'url'
            }
            $post->delete();
            DB::commit();
            return redirect()->route('admin.posts.index')->with('success', 'Post deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error deleting post: ' . $e->getMessage());
        }
    }
}
