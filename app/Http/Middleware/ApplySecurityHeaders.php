<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApplySecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // *** THIS IS THE FIX ***
        // We are adding the URLs for the Vite dev server and the Midtrans Snap script.
        $scriptSrc = implode(' ', [
            "'self'",
            'http://127.0.0.1:5173', // Vite development server
            'https://app.sandbox.midtrans.com', // Midtrans Snap script
            'https://snap-assets.al-pc-id-b.cdn.gtflabs.io',
            'https://api.sandbox.midtrans.com',
            'https://pay.google.com',
            'https://js-agent.newrelic.com',
            'https://bam.nr-data.net',
            "'unsafe-inline'",
            "'unsafe-eval'",
        ]);

        $response->headers->set('Content-Security-Policy', "script-src {$scriptSrc}");

        return $response;
    }
}