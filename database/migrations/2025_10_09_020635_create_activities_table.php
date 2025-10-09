<?php
// database/migrations/..._create_activities_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('location');
            $table->decimal('price', 8, 2);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('activities');
    }
};