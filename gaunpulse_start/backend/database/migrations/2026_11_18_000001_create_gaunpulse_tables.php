<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('villages')) {
            Schema::create('villages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('municipality');
                $table->string('district');
                $table->string('province');
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_demo')->default(true)->index();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('nodes')) {
            Schema::create('nodes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('type')->index();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('edges')) {
            Schema::create('edges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->cascadeOnDelete();
                $table->foreignId('source_node_id')->constrained('nodes')->restrictOnDelete();
                $table->foreignId('target_node_id')->constrained('nodes')->restrictOnDelete();
                $table->string('name');
                $table->string('type')->index();
                $table->string('status')->default('operational')->index();
                $table->decimal('distance', 8, 2)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('facilities')) {
            Schema::create('facilities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->cascadeOnDelete();
                $table->foreignId('node_id')->constrained('nodes')->restrictOnDelete();
                $table->string('name');
                $table->string('type')->index();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('settlement_groups')) {
            Schema::create('settlement_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->cascadeOnDelete();
                $table->foreignId('node_id')->nullable()->constrained('nodes')->nullOnDelete();
                $table->string('name');
                $table->unsignedInteger('estimated_population')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('issues')) {
            Schema::create('issues', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->restrictOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('edge_id')->nullable()->constrained('edges')->nullOnDelete();
                $table->string('title');
                $table->string('category')->index();
                $table->text('description');
                $table->string('severity')->index();
                $table->string('status')->default('submitted')->index();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->string('photo_path')->nullable();
                $table->timestamps();
                $table->index(['village_id', 'status']);
            });
        }

        if (!Schema::hasTable('issue_updates')) {
            Schema::create('issue_updates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issue_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->restrictOnDelete();
                $table->string('old_status');
                $table->string('new_status');
                $table->text('comment')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('simulations')) {
            Schema::create('simulations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->restrictOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->json('blocked_edge_ids');
                $table->json('result');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('priority_scores')) {
            Schema::create('priority_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issue_id')->constrained()->cascadeOnDelete();
                $table->foreignId('simulation_id')->nullable()->constrained()->nullOnDelete();
                $table->decimal('severity_score', 5, 2);
                $table->decimal('population_score', 5, 2)->nullable();
                $table->decimal('service_score', 5, 2)->nullable();
                $table->decimal('verification_score', 5, 2);
                $table->decimal('total_score', 5, 2)->nullable()->index();
                $table->text('explanation');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('priority_scores');
        Schema::dropIfExists('simulations');
        Schema::dropIfExists('issue_updates');
        Schema::dropIfExists('issues');
        Schema::dropIfExists('settlement_groups');
        Schema::dropIfExists('facilities');
        Schema::dropIfExists('edges');
        Schema::dropIfExists('nodes');
        Schema::dropIfExists('villages');
        Schema::dropIfExists('personal_access_tokens');
    }
};
