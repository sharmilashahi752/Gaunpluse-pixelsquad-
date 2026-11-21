<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance villages table
        if (Schema::hasTable('villages')) {
            Schema::table('villages', function (Blueprint $table) {
                if (!Schema::hasColumn('villages', 'status')) {
                    $table->string('status', 30)->default('active')->index();
                }
                if (!Schema::hasColumn('villages', 'admin_code')) {
                    $table->string('admin_code', 100)->nullable()->index();
                }
                if (!Schema::hasColumn('villages', 'onboarding_step')) {
                    $table->unsignedTinyInteger('onboarding_step')->default(5);
                }
                if (!Schema::hasColumn('villages', 'boundary_geojson')) {
                    $table->longText('boundary_geojson')->nullable();
                }
                if (!Schema::hasColumn('villages', 'data_source')) {
                    $table->string('data_source', 255)->nullable();
                }
                if (!Schema::hasColumn('villages', 'reference_year')) {
                    $table->unsignedSmallInteger('reference_year')->nullable();
                }
                if (!Schema::hasColumn('villages', 'municipality_id')) {
                    $table->string('municipality_id', 100)->nullable()->index();
                }
                if (!Schema::hasColumn('villages', 'metadata')) {
                    $table->json('metadata')->nullable();
                }
            });
        }

        // 2. Enhance nodes table with verification & GIS provenance
        if (Schema::hasTable('nodes')) {
            Schema::table('nodes', function (Blueprint $table) {
                if (!Schema::hasColumn('nodes', 'node_code')) {
                    $table->string('node_code', 100)->nullable()->index();
                }
                if (!Schema::hasColumn('nodes', 'source')) {
                    $table->string('source', 100)->default('manual');
                }
                if (!Schema::hasColumn('nodes', 'verification_status')) {
                    $table->string('verification_status', 30)->default('verified')->index();
                }
                if (!Schema::hasColumn('nodes', 'verified_by')) {
                    $table->string('verified_by', 150)->nullable();
                }
                if (!Schema::hasColumn('nodes', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable();
                }
                if (!Schema::hasColumn('nodes', 'confidence_score')) {
                    $table->unsignedTinyInteger('confidence_score')->default(85);
                }
                if (!Schema::hasColumn('nodes', 'verification_notes')) {
                    $table->text('verification_notes')->nullable();
                }
                if (!Schema::hasColumn('nodes', 'change_history')) {
                    $table->json('change_history')->nullable();
                }
            });
        }

        // 3. Enhance edges table with verification & routing details
        if (Schema::hasTable('edges')) {
            Schema::table('edges', function (Blueprint $table) {
                if (!Schema::hasColumn('edges', 'edge_code')) {
                    $table->string('edge_code', 100)->nullable()->index();
                }
                if (!Schema::hasColumn('edges', 'infrastructure_type')) {
                    $table->string('infrastructure_type', 50)->nullable();
                }
                if (!Schema::hasColumn('edges', 'surface_type')) {
                    $table->string('surface_type', 50)->nullable();
                }
                if (!Schema::hasColumn('edges', 'length_meters')) {
                    $table->decimal('length_meters', 10, 2)->nullable();
                }
                if (!Schema::hasColumn('edges', 'is_critical')) {
                    $table->boolean('is_critical')->default(false);
                }
                if (!Schema::hasColumn('edges', 'source')) {
                    $table->string('source', 100)->default('manual');
                }
                if (!Schema::hasColumn('edges', 'verification_status')) {
                    $table->string('verification_status', 30)->default('verified')->index();
                }
                if (!Schema::hasColumn('edges', 'verified_by')) {
                    $table->string('verified_by', 150)->nullable();
                }
                if (!Schema::hasColumn('edges', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable();
                }
                if (!Schema::hasColumn('edges', 'confidence_score')) {
                    $table->unsignedTinyInteger('confidence_score')->default(85);
                }
                if (!Schema::hasColumn('edges', 'verification_notes')) {
                    $table->text('verification_notes')->nullable();
                }
                if (!Schema::hasColumn('edges', 'travel_minutes')) {
                    $table->decimal('travel_minutes', 6, 2)->nullable();
                }
                if (!Schema::hasColumn('edges', 'change_history')) {
                    $table->json('change_history')->nullable();
                }
            });
        }

        // 4. Enhance facilities table with verification
        if (Schema::hasTable('facilities')) {
            Schema::table('facilities', function (Blueprint $table) {
                if (!Schema::hasColumn('facilities', 'source')) {
                    $table->string('source', 100)->default('manual');
                }
                if (!Schema::hasColumn('facilities', 'verification_status')) {
                    $table->string('verification_status', 30)->default('verified')->index();
                }
                if (!Schema::hasColumn('facilities', 'verified_by')) {
                    $table->string('verified_by', 150)->nullable();
                }
                if (!Schema::hasColumn('facilities', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable();
                }
                if (!Schema::hasColumn('facilities', 'confidence_score')) {
                    $table->unsignedTinyInteger('confidence_score')->default(85);
                }
                if (!Schema::hasColumn('facilities', 'verification_notes')) {
                    $table->text('verification_notes')->nullable();
                }
            });
        }

        // 5. Create audit logs table for data verification and onboarding events
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('action_type', 50)->index(); // 'onboarded', 'verified', 'rejected', 'imported', 'status_changed'
                $table->string('entity_type', 50)->index(); // 'village', 'node', 'edge', 'facility'
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->string('performed_by', 150)->default('System Administrator');
                $table->text('summary');
                $table->json('details')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
