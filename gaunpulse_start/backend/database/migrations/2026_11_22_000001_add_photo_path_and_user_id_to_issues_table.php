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
        Schema::table('issues', function (Blueprint $table) {
            if (!Schema::hasColumn('issues', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('village_id')->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('issues', 'photo_path')) {
                $table->string('photo_path', 500)->nullable()->after('longitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            if (Schema::hasColumn('issues', 'photo_path')) {
                $table->dropColumn('photo_path');
            }
            if (Schema::hasColumn('issues', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            }
        });
    }
};
