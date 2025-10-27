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
        Schema::table('holiday_packages', function (Blueprint $table) {
            /**
             * Add a JSON column to store tiered pricing.
             * Example structure:
             * [
             * {"min_pax": 1, "max_pax": 1, "price": 4030000},
             * {"min_pax": 2, "max_pax": 2, "price": 2700000},
             * {"min_pax": 3, "max_pax": 3, "price": 2200000},
             * {"min_pax": 6, "max_pax": 10, "price": 1550000}
             * ]
             */
            $table->json('price_tiers')->nullable()->after('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('holiday_packages', function (Blueprint $table) {
            $table->dropColumn('price_tiers');
        });
    }
};