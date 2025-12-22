<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->string('product_code')->nullable();
            $table->string('product_name');
            $table->string('product_slug')->nullable();
            $table->string('country_Of_origin')->nullable();
            $table->longText('remarks')->nullable();
            $table->integer('status')->default(0);
            $table->timestamps();
            

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
