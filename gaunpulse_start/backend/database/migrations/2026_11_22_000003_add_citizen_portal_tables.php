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
        // 1. Additive columns to existing users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role', 30)->default('citizen')->index()->after('password');
            }
            if (!Schema::hasColumn('users', 'contact_number')) {
                $table->string('contact_number', 30)->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'ward_number')) {
                $table->unsignedTinyInteger('ward_number')->nullable()->after('contact_number');
            }
        });

        // 2. Complaints table linked to canonical villages, users, and issues
        if (!Schema::hasTable('complaints')) {
            Schema::create('complaints', function (Blueprint $table) {
                $table->id();
                $table->string('complaint_number')->unique();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('issue_id')->nullable()->constrained('issues')->nullOnDelete();
                $table->foreignId('village_id')->nullable()->constrained('villages')->nullOnDelete();
                $table->unsignedTinyInteger('ward_number')->nullable();
                $table->string('title');
                $table->string('category');
                $table->string('custom_category')->nullable();
                $table->text('description')->nullable();
                $table->string('contact_number', 30)->nullable();
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->string('status')->default('pending');
                $table->string('priority')->nullable();
                $table->text('official_response')->nullable();
                $table->timestamp('submitted_at')->useCurrent();
                $table->timestamps();

                $table->index(['user_id', 'status']);
                $table->index(['village_id', 'status']);
                $table->index('issue_id');
            });
        }

        // 3. Complaint media (images and voice recordings)
        if (!Schema::hasTable('complaint_media')) {
            Schema::create('complaint_media', function (Blueprint $table) {
                $table->id();
                $table->foreignId('complaint_id')->constrained('complaints')->cascadeOnDelete();
                $table->string('media_type');
                $table->string('file_path');
                $table->string('original_name');
                $table->string('mime_type');
                $table->unsignedBigInteger('file_size');
                $table->timestamps();
            });
        }

        // 4. Complaint updates timeline
        if (!Schema::hasTable('complaint_updates')) {
            Schema::create('complaint_updates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('complaint_id')->constrained('complaints')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('old_status')->nullable();
                $table->string('new_status')->nullable();
                $table->text('message');
                $table->timestamps();
            });
        }

        // 5. Citizen notifications
        if (!Schema::hasTable('citizen_notifications')) {
            Schema::create('citizen_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('complaint_id')->nullable()->constrained('complaints')->cascadeOnDelete();
                $table->string('title');
                $table->text('message');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citizen_notifications');
        Schema::dropIfExists('complaint_updates');
        Schema::dropIfExists('complaint_media');
        Schema::dropIfExists('complaints');

        Schema::table('users', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('users', 'ward_number')) $cols[] = 'ward_number';
            if (Schema::hasColumn('users', 'contact_number')) $cols[] = 'contact_number';
            if (Schema::hasColumn('users', 'role')) $cols[] = 'role';
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
