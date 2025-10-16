<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index()
    {
        // ✅ FIXED: The eager loading path is now correct.
        // We go through the 'order' to get to the 'booking' and then to the 'bookable' item.
        $transactions = Transaction::with([
            'user',
            'order.booking.bookable' // This is the correct relationship chain
        ])
        ->latest()
        ->get();

        // Calculate stats after fetching the data for efficiency
        $successfulTransactions = $transactions->where('status', 'settlement');
        $totalRevenue = $successfulTransactions->sum('gross_amount');
        $pendingCount = $transactions->where('status', 'pending')->count();
        $successfulCount = $successfulTransactions->count();

        return Inertia::render('Admin/Transaction/Index', [
            'transactions' => $transactions,
            'stats' => [
                // ✅ FIXED: Correctly reference the calculated stats
                'total_revenue' => $totalRevenue,
                'pending_transactions' => $pendingCount,
                'successful_transactions' => $successfulCount,
            ]
        ]);
    }
}