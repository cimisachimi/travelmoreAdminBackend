<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Only add if they don't exist yet
            if (!Schema::hasColumn('orders', 'orderable_id')) {
                $table->unsignedBigInteger('orderable_id')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('orders', 'orderable_type')) {
                $table->string('orderable_type')->nullable()->after('orderable_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['orderable_id', 'orderable_type']);
        });
    }
};
