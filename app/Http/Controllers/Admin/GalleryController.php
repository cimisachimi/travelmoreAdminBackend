<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Models\HolidayPackage;
use App\Models\Activity;
use App\Models\OpenTrip;
use App\Models\CarRental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class GalleryController extends Controller
{
    private function getSafeName($model, $type)
    {
        if (!empty($model->name)) return $model->name;
        if ($model->relationLoaded('translations')) {
            $en = $model->translations->firstWhere('locale', 'en');
            if ($en && !empty($en->name)) return $en->name;
            $id = $model->translations->firstWhere('locale', 'id');
            if ($id && !empty($id->name)) return $id->name;
            foreach ($model->translations as $trans) {
                if (!empty($trans->name)) return $trans->name . " ({$trans->locale})";
            }
        }
        return "{$type} #{$model->id} (No Title)";
    }

    private function formatRp($amount)
    {
        return "Rp " . number_format((float)$amount, 0, ',', '.');
    }

    private function getLinkOptions()
    {
        return [
            'packages' => HolidayPackage::with('translations')->get()->map(function ($item) {
                $minPrice = collect($item->price_tiers)->min('price') ?? 0;
                return ['id' => $item->id, 'name' => $this->getSafeName($item, 'Package') . " (" . $this->formatRp($minPrice) . ")"];
            }),
            'activities' => Activity::with('translations')->get()->map(function ($item) {
                return ['id' => $item->id, 'name' => $this->getSafeName($item, 'Activity') . " (" . $this->formatRp($item->price) . ")"];
            }),
            'open_trips' => OpenTrip::with('translations')->get()->map(function ($item) {
                return ['id' => $item->id, 'name' => $this->getSafeName($item, 'Open Trip') . " (" . $this->formatRp($item->starting_from_price) . ")"];
            }),
            'rentals' => CarRental::all()->map(function ($item) {
                $name = trim("{$item->brand} {$item->car_model}");
                return ['id' => $item->id, 'name' => ($name ?: "Car #{$item->id}") . " (" . $this->formatRp($item->price_per_day) . "/day)"];
            }),
        ];
    }

    public function index()
    {
        return Inertia::render('Admin/Gallery/Index', [
            'galleries' => Gallery::with('translations', 'images')
                ->latest()
                ->paginate(10)
                ->through(fn ($gallery) => [
                    'id' => $gallery->id,
                    'title' => $gallery->title ?? $gallery->translations->first()?->title ?? 'Untitled',
                    'location' => $gallery->location, // ✅ Added for table
                    'is_active' => $gallery->is_active,
                    'image' => $gallery->images->first() ? Storage::disk('public')->url($gallery->images->first()->url) : null,
                ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Gallery/Create', [
            'linkOptions' => $this->getLinkOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'redirect_url' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',

            // English
            'en.title' => 'required|string|max:255',
            'en.location' => 'nullable|string|max:255', // ✅ Added
            'en.description' => 'nullable|string',
            'en.best_time' => 'nullable|string|max:255',
            'en.ticket_price' => 'nullable|string|max:255',

            // Indonesian
            'idn.title' => 'required|string|max:255',
            'idn.location' => 'nullable|string|max:255', // ✅ Added
            'idn.description' => 'nullable|string',
            'idn.best_time' => 'nullable|string|max:255',
            'idn.ticket_price' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $gallery = Gallery::create([
                'is_active' => $validated['is_active'] ?? true,
                'redirect_url' => $validated['redirect_url'],
            ]);

            $gallery->translateOrNew('en')->fill($validated['en']);
            $gallery->translateOrNew('id')->fill($validated['idn']);
            $gallery->save();

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('galleries', 'public');
                    $gallery->images()->create(['url' => $path]);
                }
            }

            DB::commit();
            return redirect()->route('admin.galleries.index')->with('success', 'Gallery item created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error creating gallery: ' . $e->getMessage());
        }
    }

    public function edit(Gallery $gallery)
    {
        $gallery->load('translations', 'images');

        return Inertia::render('Admin/Gallery/Edit', [
            'gallery' => [
                'id' => $gallery->id,
                'is_active' => (bool) $gallery->is_active,
                'redirect_url' => $gallery->redirect_url,
                'images' => $gallery->images->map(fn ($img) => ['id' => $img->id, 'url' => Storage::disk('public')->url($img->url)]),
                'en' => $gallery->translate('en'),
                'idn' => $gallery->translate('id'),
            ],
            'linkOptions' => $this->getLinkOptions(),
        ]);
    }

    public function update(Request $request, Gallery $gallery)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'redirect_url' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
            'deleted_images' => 'nullable|array',
            'deleted_images.*' => 'integer|exists:images,id',

            'en.title' => 'required|string|max:255',
            'en.location' => 'nullable|string|max:255', // ✅ Added
            'en.description' => 'nullable|string',
            'en.best_time' => 'nullable|string|max:255',
            'en.ticket_price' => 'nullable|string|max:255',

            'idn.title' => 'required|string|max:255',
            'idn.location' => 'nullable|string|max:255', // ✅ Added
            'idn.description' => 'nullable|string',
            'idn.best_time' => 'nullable|string|max:255',
            'idn.ticket_price' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $gallery->update([
                'is_active' => $validated['is_active'] ?? true,
                'redirect_url' => $validated['redirect_url'],
            ]);

            $gallery->translateOrNew('en')->fill($validated['en']);
            $gallery->translateOrNew('id')->fill($validated['idn']);
            $gallery->save();

            if (!empty($validated['deleted_images'])) {
                $imagesToDelete = $gallery->images()->whereIn('id', $validated['deleted_images'])->get();
                foreach ($imagesToDelete as $image) {
                    Storage::disk('public')->delete($image->url);
                    $image->delete();
                }
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $imageFile) {
                    $path = $imageFile->store('galleries', 'public');
                    $gallery->images()->create(['url' => $path]);
                }
            }

            DB::commit();
            return redirect()->route('admin.galleries.index')->with('success', 'Gallery updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error updating gallery: ' . $e->getMessage());
        }
    }

    public function destroy(Gallery $gallery)
    {
        DB::beginTransaction();
        try {
            foreach ($gallery->images as $image) {
                Storage::disk('public')->delete($image->url);
            }
            $gallery->delete();
            DB::commit();
            return redirect()->route('admin.galleries.index')->with('success', 'Gallery deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error deleting gallery: ' . $e->getMessage());
        }
    }
}
