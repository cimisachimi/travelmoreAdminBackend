<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trip_planners', function (Blueprint $table) {
            // Stores the HTML content from the rich text editor
            $table->longText('recommendation_content')->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('trip_planners', function (Blueprint $table) {
            $table->dropColumn('recommendation_content');
        });
    }
};
