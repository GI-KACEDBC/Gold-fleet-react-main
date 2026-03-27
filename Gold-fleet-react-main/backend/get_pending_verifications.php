<?php

// Get pending verifications
$url = 'http://localhost:8000/api/dev/email/pending-verifications';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Accept: application/json',
    ]
]);

$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Error: Could not connect to API\n";
} else {
    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "Pending Verifications:\n\n";
        foreach ($data['users'] as $user) {
            echo "ID: {$user['id']} - {$user['name']} ({$user['email']}) - {$user['status']}\n";
            if (!$user['verified']) {
                echo "  Verification Link: {$user['verification_link']}\n";
                echo "  API Endpoint: {$user['api_verification_endpoint']}\n\n";
            }
        }
    } else {
        echo "Response: $response\n";
    }
}