<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocaleFromHeader
{
    public function handle(Request $request, Closure $next)
    {
        // Tentukan bahasa yang didukung aplikasi Anda
        $supportedLocales = ['en', 'id'];

        // Dapatkan bahasa pilihan dari header 'Accept-Language'
        $locale = $request->getPreferredLanguage($supportedLocales);

        // Jika bahasa yang diminta didukung, set locale aplikasi
        if ($locale) {
            App::setLocale($locale);
        }
        // Jika tidak, locale default dari config/app.php ('fallback_locale') akan digunakan

        return $next($request);
    }
}