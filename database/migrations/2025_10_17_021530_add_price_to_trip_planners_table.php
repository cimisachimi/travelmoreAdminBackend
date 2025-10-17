<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // In database/migrations/xxxx_xx_xx_xxxxxx_add_price_to_trip_planners_table.php
    public function up(): void
    {
        Schema::table('trip_planners', function (Blueprint $table) {
             $table->decimal('price', 15, 2)->default(250000.00)->after('travel_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_planners', function (Blueprint $table) {
            //
        });
    }
};
