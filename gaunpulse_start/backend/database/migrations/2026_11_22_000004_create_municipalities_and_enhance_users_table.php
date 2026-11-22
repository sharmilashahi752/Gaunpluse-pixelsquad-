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
        // 1. Municipalities Table
        if (!Schema::hasTable('municipalities')) {
            Schema::create('municipalities', function (Blueprint $table) {
                $table->id();
                $table->string('name')->index();
                $table->string('code', 50)->unique();
                $table->string('district')->index();
                $table->string('province')->index();
                $table->string('type', 50)->default('municipality'); // 'municipality', 'rural_municipality', 'metropolitan'
                $table->unsignedSmallInteger('ward_count')->default(1);
                $table->decimal('center_lat', 10, 7)->nullable();
                $table->decimal('center_lng', 10, 7)->nullable();
                $table->timestamps();
            });
        }

        // 2. Enhance Users Table with Municipality & Workspace Attributes
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'municipality_id')) {
                $table->unsignedBigInteger('municipality_id')->nullable()->index()->after('password');
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role', 30)->default('citizen')->index()->after('municipality_id');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->index()->after('role');
            }
            if (!Schema::hasColumn('users', 'contact_number')) {
                $table->string('contact_number', 30)->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('users', 'ward_number')) {
                $table->unsignedTinyInteger('ward_number')->nullable()->index()->after('contact_number');
            }
            if (!Schema::hasColumn('users', 'preferred_language')) {
                $table->string('preferred_language', 10)->default('en')->after('ward_number');
            }
            if (!Schema::hasColumn('users', 'profile_photo_path')) {
                $table->string('profile_photo_path', 2048)->nullable()->after('preferred_language');
            }
        });

        // 3. Ensure Audit Logs has municipality_id
        if (Schema::hasTable('audit_logs')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('audit_logs', 'municipality_id')) {
                    $table->unsignedBigInteger('municipality_id')->nullable()->index()->after('village_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('municipalities');

        Schema::table('users', function (Blueprint $table) {
            $cols = [];
            foreach (['profile_photo_path', 'preferred_language', 'is_active', 'municipality_id'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $cols[] = $col;
                }
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
