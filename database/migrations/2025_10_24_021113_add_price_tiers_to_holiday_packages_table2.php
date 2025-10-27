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
            // 1. Add the new JSON column for tiered pricing


            // 2. Drop the old, unused price columns
            $table->dropColumn('price_regular');
            $table->dropColumn('price_exclusive');
            $table->dropColumn('price_child');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('holiday_packages', function (Blueprint $table) {
            // 1. Drop the new column
            $table->dropColumn('price_tiers');

            // 2. Re-add the old columns
            $table->decimal('price_regular', 10, 2)->nullable();
            $table->decimal('price_exclusive', 10, 2)->nullable();
            $table->decimal('price_child', 10, 2)->nullable();
        });
    }
};