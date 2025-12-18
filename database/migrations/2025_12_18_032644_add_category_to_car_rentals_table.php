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
    Schema::table('car_rentals', function (Blueprint $table) {
        // Adding category with a default value of 'regular'
        $table->string('category')->default('regular')->after('car_type');
    });
}

public function down(): void
{
    Schema::table('car_rentals', function (Blueprint $table) {
        $table->dropColumn('category');
    });
}
};
