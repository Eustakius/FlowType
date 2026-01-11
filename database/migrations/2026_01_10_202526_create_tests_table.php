<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('mode'); // time, words, quote, zen, custom
            $table->integer('duration')->nullable();
            $table->integer('word_count')->nullable();
            $table->integer('wpm');
            $table->integer('raw_wpm');
            $table->float('accuracy');
            $table->float('consistency')->nullable();
            $table->json('chars_data')->nullable(); // correct, incorrect, extra, missed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
