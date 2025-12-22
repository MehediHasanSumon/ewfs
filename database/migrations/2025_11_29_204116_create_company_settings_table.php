<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->nullable();
            $table->text('company_details')->nullable();
            $table->string('proprietor_name')->nullable();
            $table->text('company_address')->nullable();
            $table->text('factory_address')->nullable();
            $table->string('company_mobile')->nullable();
            $table->string('company_phone')->nullable();
            $table->string('company_email')->nullable();
            $table->string('trade_license')->nullable();
            $table->string('tin_no')->nullable();
            $table->string('bin_no')->nullable();
            $table->string('vat_no')->nullable();
            $table->decimal('vat_rate', 5, 2)->nullable();
            $table->string('currency')->nullable();
            $table->string('company_logo')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
