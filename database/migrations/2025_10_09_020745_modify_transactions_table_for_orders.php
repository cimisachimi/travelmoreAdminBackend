<?php
// database/migrations/..._modify_transactions_table_for_orders.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('transactions', function (Blueprint $table) {
            // Add the new order_id column
            $table->foreignId('order_id')->after('user_id')->constrained()->onDelete('cascade');
            // Drop the old booking_id column
            $table->dropForeign(['booking_id']);
            $table->dropColumn('booking_id');
        });
    }
    public function down(): void {
        Schema::table('transactions', function (Blueprint $table) {
            // Reverse the changes if we roll back
            $table->dropForeign(['order_id']);
            $table->dropColumn('order_id');
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
        });
    }
};