<?php
header('Content-Type: application/json');

$jsonFilePath = __DIR__ . '/../data/users.json';

// Check if the username was provided as a GET parameter
$userName = isset($_GET['name']) ? $_GET['name'] : null;

if ($userName && file_exists($jsonFilePath)) {
    // Read the JSON data
    $jsonContent = file_get_contents($jsonFilePath);
    $usersData = json_decode($jsonContent, true);

    // Find the user by their name
    $userDetails = array_filter($usersData['users'], function ($user) use ($userName) {
        return $user['name'] === $userName;
    });

    // Return the first match (if any)
    echo json_encode(reset($userDetails) ?: ['error' => 'User not found']);
} else {
    echo json_encode(['error' => 'Invalid parameters or data file not found']);
}
