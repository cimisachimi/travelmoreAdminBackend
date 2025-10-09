<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index()
    {
        // Eager load relationships for efficiency
        $transactions = Transaction::with('user', 'booking.holidayPackage')->latest()->get();

        return Inertia::render('Admin/Transaction/Index', [
            'transactions' => $transactions,
            'stats' => [
                'total_revenue' => $transactions->where('status', 'success')->sum('gross_amount'),
                'pending_transactions' => $transactions->where('status', 'pending')->count(),
                'successful_transactions' => $transactions->where('status', 'success')->count(),
            ]
        ]);
        }
    }