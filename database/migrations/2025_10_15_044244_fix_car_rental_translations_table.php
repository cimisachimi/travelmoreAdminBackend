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
        Schema::table('car_rental_translations', function (Blueprint $table) {
            // These columns do not belong in a translation table.
            $table->dropColumn(['fuel_type', 'availability', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_rental_translations', function (Blueprint $table) {
            // Add them back if we need to roll back the migration
            $table->string('fuel_type')->nullable();
            $table->boolean('availability')->default(true);
            $table->string('status')->default('available');
        });
    }
};