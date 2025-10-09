<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\CarRental;
use App\Models\HolidayPackage;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Service/Index', [
            'holidayPackages' => HolidayPackage::latest()->get(),
            'carRentals' => CarRental::latest()->get(),
            'activities' => Activity::latest()->get(),
        ]);
    }
}