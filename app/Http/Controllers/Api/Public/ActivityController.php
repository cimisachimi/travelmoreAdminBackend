<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Activity;

class ActivityController extends Controller
{
    public function index()
    {
        return Activity::latest()->get();
    }

    public function show(Activity $activity)
    {
        return $activity;
    }
}