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
        Schema::table('trip_planners', function (Blueprint $table) {
            // Add status with a default value
            $table->string('status')->default('pending')->after('price');
            // Add notes column
            $table->text('notes')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_planners', function (Blueprint $table) {
            $table->dropColumn(['status', 'notes']);
        });
    }
};
