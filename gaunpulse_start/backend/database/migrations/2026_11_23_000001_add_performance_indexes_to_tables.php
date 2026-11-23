<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $driver = DB::getDriverName();
            if ($driver === 'sqlite') {
                $indexes = DB::select("PRAGMA index_list('{$table}')");
                foreach ($indexes as $index) {
                    if (($index->name ?? null) === $indexName) {
                        return true;
                    }
                }
                return false;
            }
            $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return !empty($indexes);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function up(): void
    {
        // 1. Villages indexes
        if (Schema::hasTable('villages')) {
            Schema::table('villages', function (Blueprint $table) {
                if (Schema::hasColumn('villages', 'ward_no') && !$this->indexExists('villages', 'villages_ward_no_index')) {
                    $table->index('ward_no', 'villages_ward_no_index');
                }
                if (Schema::hasColumn('villages', 'municipality_id') && Schema::hasColumn('villages', 'ward_no') && !$this->indexExists('villages', 'villages_muni_ward_index')) {
                    $table->index(['municipality_id', 'ward_no'], 'villages_muni_ward_index');
                }
                if (Schema::hasColumn('villages', 'municipality_id') && Schema::hasColumn('villages', 'status') && !$this->indexExists('villages', 'villages_muni_status_index')) {
                    $table->index(['municipality_id', 'status'], 'villages_muni_status_index');
                }
            });
        }

        // 2. Complaints indexes
        if (Schema::hasTable('complaints')) {
            Schema::table('complaints', function (Blueprint $table) {
                if (Schema::hasColumn('complaints', 'ward_number') && !$this->indexExists('complaints', 'complaints_ward_number_index')) {
                    $table->index('ward_number', 'complaints_ward_number_index');
                }
                if (Schema::hasColumn('complaints', 'municipality_id') && Schema::hasColumn('complaints', 'ward_number') && !$this->indexExists('complaints', 'complaints_muni_ward_index')) {
                    $table->index(['municipality_id', 'ward_number'], 'complaints_muni_ward_index');
                }
                if (Schema::hasColumn('complaints', 'municipality_id') && Schema::hasColumn('complaints', 'status') && !$this->indexExists('complaints', 'complaints_muni_status_index')) {
                    $table->index(['municipality_id', 'status'], 'complaints_muni_status_index');
                }
            });
        }

        // 3. Issues indexes
        if (Schema::hasTable('issues')) {
            Schema::table('issues', function (Blueprint $table) {
                if (Schema::hasColumn('issues', 'municipality_id') && Schema::hasColumn('issues', 'ward_no') && !$this->indexExists('issues', 'issues_muni_ward_index')) {
                    $table->index(['municipality_id', 'ward_no'], 'issues_muni_ward_index');
                }
                if (Schema::hasColumn('issues', 'municipality_id') && Schema::hasColumn('issues', 'status') && !$this->indexExists('issues', 'issues_muni_status_index')) {
                    $table->index(['municipality_id', 'status'], 'issues_muni_status_index');
                }
            });
        }

        // 4. Edges indexes
        if (Schema::hasTable('edges')) {
            Schema::table('edges', function (Blueprint $table) {
                if (Schema::hasColumn('edges', 'infrastructure_type') && !$this->indexExists('edges', 'edges_village_infra_type_index')) {
                    $table->index(['village_id', 'infrastructure_type'], 'edges_village_infra_type_index');
                }
            });
        }

        // 5. Simulations indexes
        if (Schema::hasTable('simulations')) {
            Schema::table('simulations', function (Blueprint $table) {
                if (!$this->indexExists('simulations', 'simulations_village_created_index')) {
                    $table->index(['village_id', 'created_at'], 'simulations_village_created_index');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('villages')) {
            Schema::table('villages', function (Blueprint $table) {
                $table->dropIndex('villages_ward_no_index');
                $table->dropIndex('villages_muni_ward_index');
                $table->dropIndex('villages_muni_status_index');
            });
        }

        if (Schema::hasTable('complaints')) {
            Schema::table('complaints', function (Blueprint $table) {
                $table->dropIndex('complaints_ward_number_index');
                $table->dropIndex('complaints_muni_ward_index');
                $table->dropIndex('complaints_muni_status_index');
            });
        }

        if (Schema::hasTable('issues')) {
            Schema::table('issues', function (Blueprint $table) {
                $table->dropIndex('issues_muni_ward_index');
                $table->dropIndex('issues_muni_status_index');
            });
        }

        if (Schema::hasTable('edges')) {
            Schema::table('edges', function (Blueprint $table) {
                $table->dropIndex('edges_village_infra_type_index');
            });
        }

        if (Schema::hasTable('simulations')) {
            Schema::table('simulations', function (Blueprint $table) {
                $table->dropIndex('simulations_village_created_index');
            });
        }
    }
};
