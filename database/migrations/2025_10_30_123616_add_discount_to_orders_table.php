<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // ✅ Make sure this is imported

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add new columns and make total_amount nullable
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('discount_code_id')->nullable()->after('booking_id')->constrained('discount_codes')->onDelete('set null');
            $table->decimal('subtotal', 15, 2)->after('total_amount');
            $table->decimal('discount_amount', 15, 2)->default(0)->after('subtotal');

            // Make total_amount nullable temporarily
            $table->decimal('total_amount', 15, 2)->nullable()->change();
        });

        // Step 2: Now that columns exist, update the data
        DB::statement('UPDATE orders SET subtotal = total_amount');

        // Step 3: Change total_amount back to not nullable
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('total_amount', 15, 2)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['discount_code_id']);
            $table->dropColumn(['discount_code_id', 'subtotal', 'discount_amount']);
        });
    }
};
