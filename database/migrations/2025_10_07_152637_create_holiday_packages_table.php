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
        Schema::create('holiday_packages', function (Blueprint $table) {
            $table->id();

            // Kolom Non-Terjemahan (Berdasarkan Model & Seeder)
            $table->integer('duration')->nullable()->comment('Duration in days'); // From Seeder
            $table->decimal('price_regular', 10, 2)->nullable(); // From Model & Seeder
            $table->decimal('price_exclusive', 10, 2)->nullable(); // From Model & Seeder
            $table->decimal('price_child', 10, 2)->nullable(); // From Model & Seeder
            $table->decimal('rating', 2, 1)->nullable(); // From Model & Seeder
            $table->text('map_url')->nullable(); // From Model & Seeder

            // Kolom JSON (Berdasarkan Model & Seeder)
            $table->json('itinerary')->nullable();
            $table->json('cost')->nullable();
            $table->json('faqs')->nullable();
            $table->json('trip_info')->nullable();

            // Kolom name, description, location, category DIHAPUS
            // karena akan ada di tabel holiday_package_translations

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holiday_packages');
    }
};