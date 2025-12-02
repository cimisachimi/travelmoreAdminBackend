<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('open_trips', function (Blueprint $table) {
            $table->id();
            $table->integer('duration')->comment('Duration in days');
            $table->decimal('rating', 2, 1)->default(0);
            $table->text('map_url')->nullable();

            // JSON Fields for flexible data
            $table->json('price_tiers')->nullable(); // Stores min_pax, max_pax, price
            $table->json('itinerary')->nullable();   // Maps to itinerary_details
            $table->json('cost')->nullable();        // Maps to includes/excludes
            $table->json('meeting_points')->nullable(); // Specific for Open Trips

            $table->timestamps();
        });

        Schema::create('open_trip_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('open_trip_id')->constrained()->onDelete('cascade');
            $table->string('locale')->index();

            // Translatable Fields
            $table->string('name');
            $table->string('location')->nullable();
            $table->string('category')->nullable(); // e.g., Mountain, Beach
            $table->longText('description')->nullable();

            $table->unique(['open_trip_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('open_trip_translations');
        Schema::dropIfExists('open_trips');
    }
};
