<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DiscountCodeController extends Controller
{
    public function index()
    {
        // 1. Get the ID
        $activeBannerId = Setting::where('key', 'banner_discount_code')->value('value');

        // 2. ✅ Fetch the FULL object so we can show a preview card
        $activeBanner = $activeBannerId ? DiscountCode::find($activeBannerId) : null;

        return Inertia::render('Admin/DiscountCode/Index', [
            'discountCodes' => DiscountCode::latest()->paginate(10),
            'activeBanner' => $activeBanner, // ✅ Pass full object instead of just ID
        ]);
    }

    // ... (keep the rest of the methods: create, store, edit, update, destroy, toggleBanner)
    public function create()
    {
        return Inertia::render('Admin/DiscountCode/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:discount_codes,code',
            'type' => 'required|in:fixed,percent',
            'value' => 'required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
        ]);

        DiscountCode::create($validated);

        return redirect()->route('admin.discount-codes.index')->with('success', 'Discount code created.');
    }

    public function edit(DiscountCode $discountCode)
    {
        return Inertia::render('Admin/DiscountCode/Edit', [
            'discountCode' => $discountCode,
        ]);
    }

    public function update(Request $request, DiscountCode $discountCode)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:discount_codes,code,' . $discountCode->id,
            'type' => 'required|in:fixed,percent',
            'value' => 'required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
        ]);

        $discountCode->update($validated);

        return redirect()->route('admin.discount-codes.index')->with('success', 'Discount code updated.');
    }

    public function destroy(DiscountCode $discountCode)
    {
        $discountCode->delete();
        return redirect()->route('admin.discount-codes.index')->with('success', 'Discount code deleted.');
    }

    public function toggleBanner(DiscountCode $discountCode)
    {
        $currentBannerId = Setting::where('key', 'banner_discount_code')->value('value');

        if ($currentBannerId == $discountCode->id) {
            Setting::updateOrCreate(['key' => 'banner_discount_code'], ['value' => null]);
            $message = 'Discount code removed from banner.';
        } else {
            Setting::updateOrCreate(['key' => 'banner_discount_code'], ['value' => $discountCode->id]);
            $message = 'Discount code set as active banner.';
        }

        return back()->with('success', $message);
    }
}
