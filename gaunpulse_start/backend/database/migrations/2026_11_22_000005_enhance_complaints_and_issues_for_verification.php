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
        // 1. Enhance complaints table
        if (Schema::hasTable('complaints')) {
            Schema::table('complaints', function (Blueprint $table) {
                if (!Schema::hasColumn('complaints', 'municipality_id')) {
                    $table->unsignedBigInteger('municipality_id')->nullable()->index()->after('issue_id');
                }
                if (!Schema::hasColumn('complaints', 'settlement_name')) {
                    $table->string('settlement_name')->nullable()->after('village_id');
                }
                if (!Schema::hasColumn('complaints', 'speech_transcript')) {
                    $table->text('speech_transcript')->nullable()->after('description');
                }
                if (!Schema::hasColumn('complaints', 'verified_by')) {
                    $table->unsignedBigInteger('verified_by')->nullable()->after('official_response');
                }
                if (!Schema::hasColumn('complaints', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable()->after('verified_by');
                }
                if (!Schema::hasColumn('complaints', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('verified_at');
                }
            });
        }

        // 2. Enhance issues table for verification
        if (Schema::hasTable('issues')) {
            Schema::table('issues', function (Blueprint $table) {
                if (!Schema::hasColumn('issues', 'municipality_id')) {
                    $table->unsignedBigInteger('municipality_id')->nullable()->index()->after('village_id');
                }
                if (!Schema::hasColumn('issues', 'ward_no')) {
                    $table->unsignedTinyInteger('ward_no')->nullable()->index()->after('municipality_id');
                }
                if (!Schema::hasColumn('issues', 'verified_by')) {
                    $table->unsignedBigInteger('verified_by')->nullable()->after('status');
                }
                if (!Schema::hasColumn('issues', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable()->after('verified_by');
                }
                if (!Schema::hasColumn('issues', 'verification_notes')) {
                    $table->text('verification_notes')->nullable()->after('verified_at');
                }
                if (!Schema::hasColumn('issues', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('verification_notes');
                }
                if (!Schema::hasColumn('issues', 'speech_transcript')) {
                    $table->text('speech_transcript')->nullable()->after('description');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe nullable rollback
    }
};
