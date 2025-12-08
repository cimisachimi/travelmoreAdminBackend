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
        // 1. Add non-translatable fields (Google Map & JSON Includes) to main table
        Schema::table('activities', function (Blueprint $table) {
            // Check if column exists before adding to prevent duplicates
            if (!Schema::hasColumn('activities', 'google_map_url')) {
                $table->text('google_map_url')->nullable()->after('price');
            }

            if (!Schema::hasColumn('activities', 'includes')) {
                // We try to place it after google_map_url, but if that doesn't exist (unlikely here), fallback to price
                $after = Schema::hasColumn('activities', 'google_map_url') ? 'google_map_url' : 'price';
                $table->json('includes')->nullable()->after($after);
            }
        });

        // 2. Add translatable text fields (Itinerary & Notes) to translations table
        Schema::table('activity_translations', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_translations', 'itinerary')) {
                $table->longText('itinerary')->nullable();
            }
            if (!Schema::hasColumn('activity_translations', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (Schema::hasColumn('activities', 'includes')) {
                $table->dropColumn('includes');
            }
            if (Schema::hasColumn('activities', 'google_map_url')) {
                $table->dropColumn('google_map_url');
            }
        });

        Schema::table('activity_translations', function (Blueprint $table) {
            if (Schema::hasColumn('activity_translations', 'itinerary')) {
                $table->dropColumn('itinerary');
            }
            if (Schema::hasColumn('activity_translations', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
