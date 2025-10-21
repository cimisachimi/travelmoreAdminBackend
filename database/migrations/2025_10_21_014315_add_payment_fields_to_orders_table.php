<?php
// database/migrations/xxxx_xx_xx_xxxxxx_add_payment_fields_to_orders_table.php

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
            // Stores the 50% down payment amount
            $table->decimal('down_payment_amount', 15, 2)->nullable()->after('total_amount');
            // Stores the timestamp when the payment window closes
            $table->timestamp('payment_deadline')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['down_payment_amount', 'payment_deadline']);
        });
    }
};