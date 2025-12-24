<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->withCount('orders')
            ->withSum(['orders as total_spent' => function ($q) {
                // Only count successful or partially paid orders toward total spent
                $q->whereIn('status', ['paid', 'settlement', 'partially_paid']);
            }], 'total_amount');

        // --- Search Feature ---
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        // --- Role Filtering ---
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // --- Sorting ---
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $query->orderBy($sort, $direction);

        return Inertia::render('Admin/Users/Index', [
            // Returns paginated object to fix performance and map errors
            'users' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'role', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,client',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,client',
            'name' => 'required|string|max:255',
        ]);

        $user->update($validated);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        // Safety: Prevent admin from deleting themselves
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();
        return back()->with('success', 'User deleted successfully.');
    }
}
