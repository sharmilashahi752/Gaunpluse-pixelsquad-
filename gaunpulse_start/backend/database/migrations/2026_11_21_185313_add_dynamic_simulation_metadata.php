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
        Schema::table('villages', function (Blueprint $table) {
            $table->boolean('is_demo')->default(false)->index()->after('status');
        });

        Schema::table('simulations', function (Blueprint $table) {
            $table->foreignId('failed_edge_id')->nullable()->after('user_id')->constrained('edges')->nullOnDelete();
            $table->string('scenario_type', 50)->default('complete_closure')->after('failed_edge_id');
            $table->string('graph_version', 100)->nullable()->index()->after('blocked_edge_ids');
            $table->string('verification_level', 50)->nullable()->after('graph_version');
            $table->string('routing_metric', 50)->nullable()->after('verification_level');
        });

        DB::table('villages')
            ->where('name', 'Bhotenamlang (Demo Village)')
            ->where('municipality', 'Helambu Rural Municipality')
            ->update(['is_demo' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('simulations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('failed_edge_id');
            $table->dropIndex(['graph_version']);
            $table->dropColumn(['scenario_type', 'graph_version', 'verification_level', 'routing_metric']);
        });

        Schema::table('villages', function (Blueprint $table) {
            $table->dropIndex(['is_demo']);
            $table->dropColumn('is_demo');
        });
    }
};
