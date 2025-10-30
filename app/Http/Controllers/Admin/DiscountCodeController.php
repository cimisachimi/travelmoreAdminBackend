<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DiscountCodeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/DiscountCode/Index', [
            'discountCodes' => DiscountCode::latest()->paginate(10),
        ]);
    }

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
}
