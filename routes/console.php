<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule; // ✅ ADD THIS IMPORT

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// ✅ ADD THIS LINE TO SCHEDULE YOUR COMMAND
Schedule::command('orders:expire-pending')->everyFiveMinutes();