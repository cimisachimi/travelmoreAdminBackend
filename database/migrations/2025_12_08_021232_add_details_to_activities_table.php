<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add non-translatable field (Google Map) to main table
        Schema::table('activities', function (Blueprint $table) {
            $table->text('google_map_url')->nullable()->after('price');
        });

        // Add translatable fields to translations table
        Schema::table('activity_translations', function (Blueprint $table) {
            $table->longText('itinerary')->nullable();
            $table->longText('whats_included')->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('google_map_url');
        });

        Schema::table('activity_translations', function (Blueprint $table) {
            $table->dropColumn(['itinerary', 'whats_included', 'notes']);
        });
    }
};
