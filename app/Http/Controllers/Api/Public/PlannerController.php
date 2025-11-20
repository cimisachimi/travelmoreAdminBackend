<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PlannerController extends Controller
{
    /**
     * Get the public configuration for the trip planner.
     */
    public function getConfig()
    {
        $priceSetting = Setting::where('key', 'trip_planner_price')->first();

        if (!$priceSetting || !is_numeric($priceSetting->value)) {
            Log::error('TRIP_PLANNER_PRICE setting is not set or invalid in public config.');
            $price = 0; // Default to 0 if not set
        } else {
            $price = (float) $priceSetting->value;
        }

        return response()->json([
            'price' => $price,
        ]);
    }
}
