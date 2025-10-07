<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use Inertia\Inertia;

class HolidayPackageController extends Controller
{
    public function index()
    {
        // Change 'HolidayPackages' to 'HolidayPackage' to match your folder name
        return Inertia::render('Admin/HolidayPackage/Index', [
            'packages' => HolidayPackage::all(),
        ]);
    }
}