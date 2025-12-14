<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Main Galleries Table
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->string('redirect_url')->nullable()->comment('Link to the service');
            $table->string('redirect_text')->nullable()->comment('Custom button text');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Translations Table
        Schema::create('gallery_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_id')->constrained()->onDelete('cascade');
            $table->string('locale')->index();

            $table->string('title');
            $table->string('location')->nullable(); // ✅ Added Location
            $table->text('description')->nullable();
            $table->string('best_time')->nullable();
            $table->string('ticket_price')->nullable();

            $table->unique(['gallery_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_translations');
        Schema::dropIfExists('galleries');
    }
};
