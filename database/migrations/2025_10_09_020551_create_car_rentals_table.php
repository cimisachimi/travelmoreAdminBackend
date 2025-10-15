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
    Schema::create('car_rentals', function (Blueprint $table) {
        $table->id();
        $table->string('car_model');
        $table->string('brand');
        $table->string('car_type')->nullable();
        $table->string('transmission')->nullable();
        $table->string('fuel_type')->nullable();
        $table->integer('capacity')->nullable();
        $table->integer('trunk_size')->nullable();
        $table->text('description')->nullable();
        $table->json('features')->nullable();
        $table->decimal('price_per_day', 15, 2);
        $table->boolean('availability')->default(true);
        $table->string('status')->default('available');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('car_rentals');
    }
};