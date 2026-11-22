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
        Schema::table('villages', function (Blueprint $table) {
            if (!Schema::hasColumn('villages', 'is_coordinates_confirmed')) {
                $table->boolean('is_coordinates_confirmed')->default(false)->after('center_lng');
            }
            if (!Schema::hasColumn('villages', 'coordinates_confirmed_at')) {
                $table->timestamp('coordinates_confirmed_at')->nullable()->after('is_coordinates_confirmed');
            }
            if (!Schema::hasColumn('villages', 'search_radius_meters')) {
                $table->integer('search_radius_meters')->default(2000)->after('coordinates_confirmed_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('villages', function (Blueprint $table) {
            if (Schema::hasColumn('villages', 'search_radius_meters')) {
                $table->dropColumn('search_radius_meters');
            }
            if (Schema::hasColumn('villages', 'coordinates_confirmed_at')) {
                $table->dropColumn('coordinates_confirmed_at');
            }
            if (Schema::hasColumn('villages', 'is_coordinates_confirmed')) {
                $table->dropColumn('is_coordinates_confirmed');
            }
        });
    }
};
