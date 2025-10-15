<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApplySecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // ✅ Basic recommended security headers without CSP
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'no-referrer-when-downgrade');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // ❌ No Content-Security-Policy — to prevent dev build blocking (Vite, Midtrans, Fonts, etc.)
        return $response;
    }
}
