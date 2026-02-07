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
        Schema::table('dispenser_readings', function (Blueprint $table) {
            $table->dropColumn('end_reading');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dispenser_readings', function (Blueprint $table) {
            $table->decimal('end_reading', 10, 2)->default(0)->after('start_reading');
        });
    }
};
