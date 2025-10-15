<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('car_rental_translations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('car_rental_id')->constrained()->onDelete('cascade');
        $table->string('locale')->index();
        $table->text('description')->nullable();
        $table->string('fuel_type')->nullable();
        $table->boolean('availability')->default(true);
        $table->string('status')->default('available');
        $table->timestamps();


        $table->unique(['car_rental_id', 'locale']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('car_rental_translations');
    }
};
