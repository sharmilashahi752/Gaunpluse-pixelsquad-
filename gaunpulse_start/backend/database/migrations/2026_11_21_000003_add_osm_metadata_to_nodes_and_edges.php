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
        Schema::table('nodes', function (Blueprint $table) {
            if (!Schema::hasColumn('nodes', 'osm_id')) {
                $table->string('osm_id', 100)->nullable()->index()->after('node_code');
            }
            if (!Schema::hasColumn('nodes', 'osm_type')) {
                $table->string('osm_type', 50)->nullable()->after('osm_id'); // 'node', 'way', 'relation'
            }
            if (!Schema::hasColumn('nodes', 'import_batch_id')) {
                $table->string('import_batch_id', 100)->nullable()->index()->after('source');
            }
        });

        Schema::table('edges', function (Blueprint $table) {
            if (!Schema::hasColumn('edges', 'osm_id')) {
                $table->string('osm_id', 100)->nullable()->index()->after('edge_code');
            }
            if (!Schema::hasColumn('edges', 'osm_type')) {
                $table->string('osm_type', 50)->nullable()->after('osm_id');
            }
            if (!Schema::hasColumn('edges', 'highway_type')) {
                $table->string('highway_type', 50)->nullable()->after('infrastructure_type');
            }
            if (!Schema::hasColumn('edges', 'geometry')) {
                $table->json('geometry')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('edges', 'import_batch_id')) {
                $table->string('import_batch_id', 100)->nullable()->index()->after('source');
            }
        });

        Schema::table('villages', function (Blueprint $table) {
            if (!Schema::hasColumn('villages', 'last_imported_at')) {
                $table->timestamp('last_imported_at')->nullable()->after('metadata');
            }
            if (!Schema::hasColumn('villages', 'import_batch_id')) {
                $table->string('import_batch_id', 100)->nullable()->after('last_imported_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn(['osm_id', 'osm_type', 'import_batch_id']);
        });

        Schema::table('edges', function (Blueprint $table) {
            $table->dropColumn(['osm_id', 'osm_type', 'highway_type', 'geometry', 'import_batch_id']);
        });

        Schema::table('villages', function (Blueprint $table) {
            $table->dropColumn(['last_imported_at', 'import_batch_id']);
        });
    }
};
