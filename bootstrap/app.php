<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\ApplySecurityHeaders;
use App\Http\Middleware\SetLocaleFromHeader;
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // <-- THIS LINE WAS MISSING
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // --- ADD THE CORS MIDDLEWARE HERE ---
        // This is crucial for your frontend to talk to the backend.
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        // This keeps your Inertia middleware for the admin panel.
        $middleware->web(append: [
            SetLocaleFromHeader::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            ApplySecurityHeaders::class,
        ]);
        // ✅ ADD THIS SECTION: API Middleware Group
        $middleware->api(append: [
            SetLocaleFromHeader::class, // <-- Add this here so API checks the language header
        ]);

        // This keeps your custom 'admin' alias.
        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
