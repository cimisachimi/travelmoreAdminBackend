<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HolidayPackage;
use Inertia\Inertia;

class HolidayPackageController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/HolidayPackages/Index', [
            'packages' => HolidayPackage::all(),
        ]);
    }
}