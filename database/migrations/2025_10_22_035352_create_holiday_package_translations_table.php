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
        Schema::create('holiday_package_translations', function (Blueprint $table) {
            $table->id();
            // Foreign key ke tabel utama
            $table->foreignId('holiday_package_id')->constrained()->onDelete('cascade');
            // Kolom locale ('en', 'id')
            $table->string('locale')->index();

            // Kolom yang diterjemahkan
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('category')->nullable();

            // Unique constraint
            $table->unique(['holiday_package_id', 'locale']);
            // Timestamps opsional
            // $table->timestamps();
        });

        // Hapus kolom asli dari tabel utama
       // Hapus kolom asli dari tabel utama HANYA JIKA ADA
 Schema::table('holiday_packages', function (Blueprint $table) {
     // Kolom yang dipindah ke translation table
     $columnsToDrop = ['name', 'description', 'location', 'category'];

     foreach ($columnsToDrop as $column) {
         if (Schema::hasColumn('holiday_packages', $column)) {
             $table->dropColumn($column);
         }
     }
     // JANGAN drop kolom lain seperti duration, prices, map_url, JSON fields di sini
 });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         // Tambahkan kembali kolom ke tabel utama
         Schema::table('holiday_packages', function (Blueprint $table) {
             // Tambahkan hanya jika belum ada
             if (!Schema::hasColumn('holiday_packages', 'name')) {
                 $table->string('name')->after('id'); // Sesuaikan posisi jika perlu
             }
              if (!Schema::hasColumn('holiday_packages', 'description')) {
                $table->text('description')->nullable()->after('name');
             }
             if (!Schema::hasColumn('holiday_packages', 'location')) {
                 $table->string('location')->nullable()->after('description');
             }
              if (!Schema::hasColumn('holiday_packages', 'category')) {
                $table->string('category')->nullable()->after('rating');
             }
         });

        Schema::dropIfExists('holiday_package_translations');
    }
};