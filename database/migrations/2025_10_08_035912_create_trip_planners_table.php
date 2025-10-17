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
        Schema::create('trip_planners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // --- Basic Info ---
            $table->string('type'); // This is required from step 1
            $table->string('trip_type')->nullable(); // ✅ ADDED ->nullable()

            // --- Contact Info ---
            $table->string('full_name')->nullable();
            $table->string('email')->nullable(); // ✅ ADDED ->nullable()
            $table->string('phone')->nullable(); // ✅ ADDED ->nullable()
            $table->string('company_name')->nullable();
            $table->string('brand_name')->nullable();
            
            // --- The rest of your columns are already nullable, which is perfect ---
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->string('pax_adults')->nullable();
            $table->string('pax_teens')->nullable();
            $table->string('pax_kids')->nullable();
            $table->string('pax_seniors')->nullable();
            $table->date('departure_date')->nullable();
            $table->string('duration')->nullable();
            $table->string('budget_pack')->nullable();
            $table->json('addons')->nullable();
            $table->json('budget_priorities')->nullable();
            $table->json('travel_style')->nullable();
            $table->string('other_travel_style')->nullable();
            $table->json('travel_personality')->nullable();
            $table->string('other_travel_personality')->nullable();
            $table->string('activity_level')->nullable();
            $table->text('must_visit')->nullable();
            $table->string('attraction_preference')->nullable();
            $table->json('food_preference')->nullable();
            $table->string('other_food_preference')->nullable();
            $table->text('accommodation_preference')->nullable();
            $table->boolean('consent')->default(false);
            $table->string('is_frequent_traveler')->nullable();
            $table->string('travel_type')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_planners');
    }
};