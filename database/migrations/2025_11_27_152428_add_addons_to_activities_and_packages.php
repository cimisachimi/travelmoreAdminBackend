<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Check if column exists before adding to holiday_packages
        if (!Schema::hasColumn('holiday_packages', 'addons')) {
            Schema::table('holiday_packages', function (Blueprint $table) {
                $table->json('addons')->nullable()->after('trip_info');
            });
        }

        // 2. Check if column exists before adding to activities
        if (!Schema::hasColumn('activities', 'addons')) {
            Schema::table('activities', function (Blueprint $table) {
                // Ensure we use 'duration' since 'category' was removed previously
                $table->json('addons')->nullable()->after('duration');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('holiday_packages', 'addons')) {
            Schema::table('holiday_packages', function (Blueprint $table) {
                $table->dropColumn('addons');
            });
        }

        if (Schema::hasColumn('activities', 'addons')) {
            Schema::table('activities', function (Blueprint $table) {
                $table->dropColumn('addons');
            });
        }
    }
};
