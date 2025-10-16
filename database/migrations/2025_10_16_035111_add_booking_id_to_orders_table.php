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
        Schema::table('orders', function (Blueprint $table) {
            // Add the booking_id column after user_id
            // It's nullable in case you have orders not originating from a booking
            $table->foreignId('booking_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop the foreign key and the column
            $table->dropForeign(['booking_id']);
            $table->dropColumn('booking_id');
        });
    }
};