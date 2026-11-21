<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('villages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('municipality');
            $table->string('district');
            $table->string('province');
            $table->unsignedSmallInteger('ward_number');
            $table->string('verification_status')->default('unverified');
            $table->timestamps();
        });
        Schema::create('infrastructure_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('village_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('households')->nullable();
            $table->timestamps();
        });
        Schema::create('infrastructure_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('village_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_node_id')->constrained('infrastructure_nodes');
            $table->foreignId('to_node_id')->constrained('infrastructure_nodes');
            $table->string('type');
            $table->decimal('travel_minutes', 8, 2);
            $table->string('status')->default('unknown');
            $table->timestamps();
        });
        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('village_id')->constrained()->cascadeOnDelete();
            $table->foreignId('infrastructure_edge_id')->nullable()->constrained('infrastructure_edges')->nullOnDelete();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('severity')->default('unverified');
            $table->string('status')->default('reported');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('issues');
        Schema::dropIfExists('infrastructure_edges');
        Schema::dropIfExists('infrastructure_nodes');
        Schema::dropIfExists('villages');
    }
};
