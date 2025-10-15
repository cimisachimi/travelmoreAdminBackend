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
            // Add columns for simple text translations
            $table->string('car_type')->nullable()->after('description');
            $table->string('transmission')->nullable()->after('car_type');
            $table->string('fuel_type')->nullable()->after('transmission');
            
            // Use a JSON column to store an array of translated features
            $table->json('features')->nullable()->after('fuel_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('car_rental_translations', function (Blueprint $table) {
            $table->dropColumn(['car_type', 'transmission', 'fuel_type', 'features']);
        });
    }
};