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
        Schema::table('users', function (Blueprint $table) {
            // Add your new fields after 'name' or another existing column
            $table->string('full_name')->nullable()->after('name');
            $table->string('phone_number')->nullable()->after('full_name');
            $table->string('nationality', 3)->nullable()->after('phone_number'); // 'WNI'/'WNA'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['full_name', 'phone_number', 'nationality']);
        });
    }
};
