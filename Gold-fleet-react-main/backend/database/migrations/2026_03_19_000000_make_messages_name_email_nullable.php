<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (Schema::hasColumn('messages', 'name')) {
                    $table->string('name')->nullable()->change();
                }
                if (Schema::hasColumn('messages', 'email')) {
                    $table->string('email')->nullable()->change();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (Schema::hasColumn('messages', 'name')) {
                    $table->string('name')->nullable(false)->change();
                }
                if (Schema::hasColumn('messages', 'email')) {
                    $table->string('email')->nullable(false)->change();
                }
            });
        }
    }
};