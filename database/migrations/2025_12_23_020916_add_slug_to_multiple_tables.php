<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Holiday Package Translations
        Schema::table('holiday_package_translations', function (Blueprint $table) {
            $table->string('slug')->after('name')->nullable();
            // Adding a unique constraint for the combination of locale and slug
            $table->unique(['locale', 'slug'], 'hp_translations_locale_slug_unique');
        });

        // 2. Activity Translations
        Schema::table('activity_translations', function (Blueprint $table) {
            $table->string('slug')->after('name')->nullable();
            $table->unique(['locale', 'slug'], 'activity_translations_locale_slug_unique');
        });

        // 3. Open Trip Translations
        Schema::table('open_trip_translations', function (Blueprint $table) {
            $table->string('slug')->after('name')->nullable();
            $table->unique(['locale', 'slug'], 'open_trip_translations_locale_slug_unique');
        });

        // 4. Car Rentals (Adding to main table as it doesn't use Translatable trait in current Model)
        Schema::table('car_rentals', function (Blueprint $table) {
            $table->string('slug')->after('car_model')->unique()->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('holiday_package_translations', function (Blueprint $table) {
            $table->dropUnique('hp_translations_locale_slug_unique');
            $table->dropColumn('slug');
        });

        Schema::table('activity_translations', function (Blueprint $table) {
            $table->dropUnique('activity_translations_locale_slug_unique');
            $table->dropColumn('slug');
        });

        Schema::table('open_trip_translations', function (Blueprint $table) {
            $table->dropUnique('open_trip_translations_locale_slug_unique');
            $table->dropColumn('slug');
        });

        Schema::table('car_rentals', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
