<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Holiday Packages (Already in model, ensuring DB has it)
        if (!Schema::hasColumn('holiday_packages', 'addons')) {
            Schema::table('holiday_packages', function (Blueprint $table) {
                $table->json('addons')->nullable()->after('price_tiers');
            });
        }

        // 2. Open Trips (Missing in your provided file)
        if (!Schema::hasColumn('open_trips', 'addons')) {
            Schema::table('open_trips', function (Blueprint $table) {
                $table->json('addons')->nullable()->after('price_tiers');
            });
        }

        // 3. Activities (Already in model, ensuring DB has it)
        if (!Schema::hasColumn('activities', 'addons')) {
            Schema::table('activities', function (Blueprint $table) {
                $table->json('addons')->nullable()->after('price');
            });
        }
    }

    public function down()
    {
        Schema::table('holiday_packages', function (Blueprint $table) {
            $table->dropColumn('addons');
        });
        Schema::table('open_trips', function (Blueprint $table) {
            $table->dropColumn('addons');
        });
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('addons');
        });
    }
};
