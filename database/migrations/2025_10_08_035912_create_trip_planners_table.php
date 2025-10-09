<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_planners', function (Blueprint $table) {
            $table->id();
            
            // Step 1 & 2: Contact Information
            $table->string('type'); // personal or company
            $table->string('trip_type'); // domestic or foreign
            $table->string('full_name')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->string('company_name')->nullable();
            $table->string('brand_name')->nullable();

            // Step 4: Address Information
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();

            // Step 5 & 6: Trip Details
            $table->unsignedInteger('pax_adults')->default(0);
            $table->unsignedInteger('pax_teens')->default(0);
            $table->unsignedInteger('pax_kids')->default(0);
            $table->unsignedInteger('pax_seniors')->default(0);
            $table->date('departure_date')->nullable();
            $table->string('duration')->nullable();
            $table->string('travel_type');

            // Step 7, 8, 9: Preferences (using JSON for multi-select fields)
            $table->string('budget_pack');
            $table->json('addons')->nullable();
            $table->json('budget_priorities')->nullable();
            $table->json('travel_style')->nullable();
            $table->json('travel_personality')->nullable();
            $table->text('must_visit')->nullable();
            $table->text('attraction_preference')->nullable();
            $table->json('food_preference')->nullable();
            $table->text('accommodation_preference')->nullable();

            // Step 10: Final Details
            $table->boolean('consent');
            $table->string('is_frequent_traveler');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_planners');
    }
};