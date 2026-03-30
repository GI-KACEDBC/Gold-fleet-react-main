<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add image upload field for driver maintenance inspections
     */
    public function up(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            // Store inspection image path for driver maintenance documentation
            $table->string('inspection_image_path')->nullable()->after('checklist_items');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspections', function (Blueprint $table) {
            $table->dropColumn('inspection_image_path');
        });
    }
};
