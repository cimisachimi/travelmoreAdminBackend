<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->string('snap_token')->nullable();
            $table->string('status')->default('pending'); // pending, success, failed
            $table->decimal('gross_amount', 10, 2);
            $table->string('payment_type')->nullable();
            $table->json('payment_payloads')->nullable(); // To store response from Midtrans
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};