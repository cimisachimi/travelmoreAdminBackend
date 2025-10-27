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
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->text('description')->nullable();
            $table->string('location');
            $table->decimal('price', 10, 2)->default(0.00); // Add price
            $table->string('status')->default('active'); // Add status
            $table->string('duration')->nullable(); // Add duration
            $table->string('category')->nullable(); // Add category
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};