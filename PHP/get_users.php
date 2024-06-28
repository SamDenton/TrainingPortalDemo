<?php
header('Content-Type: application/json');

// Specify the path to your JSON file
$jsonFilePath = __DIR__ . '/../data/users.json';

// Read the file contents and convert to an associative array
if (file_exists($jsonFilePath)) {
    $jsonContent = file_get_contents($jsonFilePath);
    $usersData = json_decode($jsonContent, true);

    // Extract only user names for the dropdown
    $userNames = array_map(function ($userDetails) {
        return $userDetails['name'];
    }, $usersData['users']);

    // Send back the names as a JSON array
    echo json_encode($userNames);
} else {
    echo json_encode(['error' => 'User data file not found']);
}
