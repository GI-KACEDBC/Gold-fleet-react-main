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
        if (!Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('messages', 'company_id')) {
                $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            }
            if (!Schema::hasColumn('messages', 'from_user_id')) {
                $table->foreignId('from_user_id')->nullable()->constrained('users')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('messages', 'to_user_id')) {
                $table->foreignId('to_user_id')->nullable()->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('messages', 'from_type')) {
                $table->enum('from_type', ['platform', 'company'])->default('company');
            }
            if (!Schema::hasColumn('messages', 'to_type')) {
                $table->enum('to_type', ['platform', 'company'])->default('platform');
            }
            if (!Schema::hasColumn('messages', 'body')) {
                $table->longText('body')->nullable();
            }
            if (!Schema::hasColumn('messages', 'status')) {
                $table->enum('status', ['draft', 'sent', 'read', 'archived'])->default('sent');
            }
            if (!Schema::hasColumn('messages', 'read')) {
                $table->boolean('read')->default(false);
            }
            if (!Schema::hasColumn('messages', 'read_at')) {
                $table->timestamp('read_at')->nullable();
            }
            if (!Schema::hasColumn('messages', 'attachments')) {
                $table->json('attachments')->nullable();
            }
            if (!Schema::hasColumn('messages', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('messages')) {
            return;
        }

        Schema::table('messages', function (Blueprint $table) {
            // Drop added columns
            $table->dropForeignIdFor('Company::class', 'company_id');
            $table->dropForeignIdFor('User::class', 'from_user_id');
            $table->dropForeignIdFor('User::class', 'to_user_id');
            $table->dropColumn([
                'company_id',
                'from_user_id',
                'to_user_id',
                'from_type',
                'to_type',
                'body',
                'status',
                'read',
                'read_at',
                'attachments',
                'deleted_at'
            ]);
        });
    }
};
