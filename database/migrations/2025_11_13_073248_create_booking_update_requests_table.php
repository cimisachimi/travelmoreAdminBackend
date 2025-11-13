<?php
// database/migrations/..._create_booking_update_requests_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_update_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The user who requested it

            // This JSON stores what the user wants to change
            $table->json('requested_changes');

            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('admin_notes')->nullable(); // Admin can explain why it was rejected/approved
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_update_requests');
    }
};
