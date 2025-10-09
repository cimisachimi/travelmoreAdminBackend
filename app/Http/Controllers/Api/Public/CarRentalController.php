<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\CarRental;

class CarRentalController extends Controller
{
    public function index()
    {
        return CarRental::latest()->get();
    }

    public function show(CarRental $carRental)
    {
        return $carRental;
    }
}