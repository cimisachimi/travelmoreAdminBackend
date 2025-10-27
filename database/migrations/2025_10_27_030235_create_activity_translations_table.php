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
        Schema::create('activity_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->onDelete('cascade');
            $table->string('locale')->index();

            // Translatable fields
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('location')->nullable(); // Make location/category nullable if they can be empty
            $table->string('category')->nullable();

            // Make the combination of activity_id and locale unique
            $table->unique(['activity_id', 'locale']);
        });

        // Move non-translatable fields from activities to translations if they should be translated
        // We will keep 'name' in 'activities' as a fallback, but translate it
        // We will move 'description', 'location', 'category' from 'activities'
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['description', 'location', 'category']);
            // Keep 'name' in activities table as a fallback/default
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('location');
            $table->string('category')->nullable();
        });

        Schema::dropIfExists('activity_translations');
    }
};