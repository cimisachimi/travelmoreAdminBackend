<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_paid_amount_to_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('orders', function (Blueprint $table) {
            // Kolom untuk menyimpan total yang sudah dibayarkan (DP atau Lunas)
            $table->decimal('paid_amount', 15, 2)->default(0)->after('total_amount');
        });
    }

    public function down(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('paid_amount');
        });
    }
};
