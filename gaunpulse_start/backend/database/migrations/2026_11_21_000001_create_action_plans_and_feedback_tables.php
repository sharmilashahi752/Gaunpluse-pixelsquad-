<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('action_plans')) {
            Schema::create('action_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->constrained()->cascadeOnDelete();
                $table->foreignId('issue_id')->nullable()->constrained('issues')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('ward')->nullable();
                $table->string('priority')->default('Medium'); // Critical, High, Medium, Low
                $table->string('responsible_team')->default('Municipal Infrastructure Unit');
                $table->date('start_date')->nullable();
                $table->date('target_completion_date')->nullable();
                $table->string('status')->default('in_progress'); // pending, in_progress, completed, delayed, on_hold
                $table->unsignedTinyInteger('progress_percentage')->default(0); // 0 to 100
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('community_feedbacks')) {
            Schema::create('community_feedbacks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('village_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('issue_id')->nullable()->constrained('issues')->nullOnDelete();
                $table->string('resident_name')->default('Community Resident');
                $table->string('ward')->default('Ward 4');
                $table->text('message');
                $table->string('tag')->default('Safety'); // Safety, Water access, Roads, Access, General
                $table->string('status')->default('submitted'); // submitted, acknowledged, addressed
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_feedbacks');
        Schema::dropIfExists('action_plans');
    }
};
