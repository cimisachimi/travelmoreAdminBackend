<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class BannerController extends Controller
{
    /**
     * Get the active banner discount code.
     */
    public function index(): JsonResponse
    {
        // 1. Get the ID from settings
        $bannerId = Setting::where('key', 'banner_discount_code')->value('value');

        if (!$bannerId) {
            return response()->json(['data' => null]);
        }

        // 2. Find the code
        $code = DiscountCode::find($bannerId);

        // 3. Check if exists and is valid (not expired, max uses not reached)
        // Note: Ensure your DiscountCode model has the isValid() method we added earlier
        if (!$code || (method_exists($code, 'isValid') && !$code->isValid())) {
            return response()->json(['data' => null]);
        }

        // 4. Return the code details
        return response()->json([
            'data' => [
                'code' => $code->code,
                'type' => $code->type,
                'value' => (float)$code->value,
                'expires_at' => $code->expires_at,
            ]
        ]);
    }
}
