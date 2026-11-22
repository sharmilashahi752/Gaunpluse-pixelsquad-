<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Allow nullable village_id on issues table and add settlement_name, transcript_language
        if (Schema::hasTable('issues')) {
            $driver = DB::getDriverName();

            if ($driver === 'mysql') {
                // Drop existing foreign key and index if present
                try {
                    DB::statement('ALTER TABLE `issues` DROP FOREIGN KEY `issues_village_id_foreign`');
                } catch (\Throwable $e) {
                    // Foreign key might not exist with that exact name
                }

                // Modify column to be nullable
                DB::statement('ALTER TABLE `issues` MODIFY `village_id` BIGINT UNSIGNED NULL');

                // Re-add foreign key with SET NULL on delete
                try {
                    DB::statement('ALTER TABLE `issues` ADD CONSTRAINT `issues_village_id_foreign` FOREIGN KEY (`village_id`) REFERENCES `villages` (`id`) ON DELETE SET NULL');
                } catch (\Throwable $e) {
                    // Ignored if already exists
                }
            }

            Schema::table('issues', function (Blueprint $table) {
                if (!Schema::hasColumn('issues', 'settlement_name')) {
                    $table->string('settlement_name')->nullable()->after('village_id');
                }
                if (!Schema::hasColumn('issues', 'transcript_language')) {
                    $table->string('transcript_language', 10)->nullable()->after('speech_transcript');
                }
            });
        }

        // 2. Add transcript_language to complaints table
        if (Schema::hasTable('complaints')) {
            Schema::table('complaints', function (Blueprint $table) {
                if (!Schema::hasColumn('complaints', 'transcript_language')) {
                    $table->string('transcript_language', 10)->nullable()->after('speech_transcript');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('issues')) {
            Schema::table('issues', function (Blueprint $table) {
                if (Schema::hasColumn('issues', 'transcript_language')) {
                    $table->dropColumn('transcript_language');
                }
                if (Schema::hasColumn('issues', 'settlement_name')) {
                    $table->dropColumn('settlement_name');
                }
            });
        }

        if (Schema::hasTable('complaints')) {
            Schema::table('complaints', function (Blueprint $table) {
                if (Schema::hasColumn('complaints', 'transcript_language')) {
                    $table->dropColumn('transcript_language');
                }
            });
        }
    }
};
