<?php

// Test login for Willy
$url = 'http://localhost:8000/api/login';
$data = json_encode(['email' => 'willy@gmail.com', 'password' => 'password']); // Correct password

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Error: Could not connect to API\n";
    $error = error_get_last();
    echo "Error details: " . $error['message'] . "\n";
} else {
    echo 'Login Response: ' . $response . "\n";

    $result = json_decode($response, true);
    if ($result && isset($result['success'])) {
        if ($result['success']) {
            echo "✓ Login successful! Token: " . substr($result['token'], 0, 20) . "...\n";
        } else {
            echo "✗ Login failed: " . $result['message'] . "\n";
        }
    }
}