<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mode' => 'required|string',
            'duration' => 'nullable|integer',
            'word_count' => 'nullable|integer',
            'wpm' => 'required|integer',
            'raw_wpm' => 'required|integer',
            'accuracy' => 'required|numeric',
            'consistency' => 'nullable|numeric',
            'chars_data' => 'nullable|array',
        ]);

        $test = $request->user()?->tests()->create($validated) ?? \App\Models\Test::create($validated);

        return response()->json([
            'message' => 'Test saved successfully',
            'data' => $test
        ], 201);
    }
}
