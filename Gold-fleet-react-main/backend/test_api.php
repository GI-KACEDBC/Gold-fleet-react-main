<?php

// Simple test script to check plans API
$url = 'http://localhost:8000/api/plans';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Accept: application/json',
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Error: Could not connect to API\n";
    echo "Make sure the Laravel server is running on http://localhost:8000\n";
} else {
    echo "API Response:\n";
    echo $response . "\n\n";

    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "Parsed JSON:\n";
        print_r($data);
    } else {
        echo "Response is not valid JSON\n";
    }
}