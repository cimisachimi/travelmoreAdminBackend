<?php
// database/migrations/..._create_order_items_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->morphs('orderable'); // This creates orderable_id and orderable_type columns
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price', 8, 2);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('order_items');
    }
};