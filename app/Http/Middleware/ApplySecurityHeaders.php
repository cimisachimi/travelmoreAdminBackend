<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApplySecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // ✅ FIXED: Updated the Content-Security-Policy to allow Midtrans and other necessary scripts.
        // This is a more complete and secure policy than what was there before.
        $response->headers->set('Content-Security-Policy', "
            default-src 'self';
            script-src 'self' 'unsafe-eval' https://app.sandbox.midtrans.com https://snap-assets.al-pc-id-b.cdn.gtflabs.io https://api.sandbox.midtrans.com https://pay.google.com https://js-agent.newrelic.com https://bam.nr-data.net;
            script-src-elem 'self' 'unsafe-inline' https://app.sandbox.midtrans.com https://snap-assets.al-pc-id-b.cdn.gtflabs.io https://api.sandbox.midtrans.com https://pay.google.com https://js-agent.newrelic.com https://bam.nr-data.net;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https:;
            frame-src 'self' https://app.sandbox.midtrans.com https://pay.google.com;
            connect-src 'self' https://app.sandbox.midtrans.com https://api.sandbox.midtrans.com https://bam.nr-data.net;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
        ");

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'no-referrer-when-downgrade');
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        return $response;
    }
}