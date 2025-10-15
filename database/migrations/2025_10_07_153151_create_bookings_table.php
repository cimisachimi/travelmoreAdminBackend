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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // ✅ Defines 'bookable_id' (bigint) and 'bookable_type' (varchar)
            $table->morphs('bookable'); 

            $table->date('booking_date');
            $table->string('status')->default('pending'); // e.g., pending, confirmed, cancelled
            $table->decimal('total_price', 15, 2);
            $table->string('payment_status')->default('unpaid'); // e.g., unpaid, paid, partial
            
            // ✅ For storing extra info like pickup location
            $table->json('details')->nullable(); 
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};