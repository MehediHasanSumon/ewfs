<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->nullable();
            $table->string('ac_number', 150)->unique();
            $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->string('group_code', 150)->nullable();
            $table->decimal('due_amount', 18, 2)->default(0.00);
            $table->decimal('paid_amount', 18, 2)->default(0.00);
            $table->decimal('total_amount', 18, 2)->default(0.00);
            $table->boolean('status')->default(true);
            $table->timestamps();

            $table->foreign('group_code')->references('code')->on('groups')->onDelete('set null');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
