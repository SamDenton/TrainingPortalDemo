<?php
header('Content-Type: application/json');

$jsonFilePath = __DIR__ . '/../data/users.json';

// Get JSON as a string from the input
$jsonInput = file_get_contents('php://input');

// Decode the input JSON to an array
$data = json_decode($jsonInput, true);

if (!isset($data['users']) || !is_array($data['users'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid user data provided']);
    exit;
}

// Ensure the file exists
if (file_exists($jsonFilePath)) {
    // Read the existing data
    $existingData = file_get_contents($jsonFilePath);
    $usersData = json_decode($existingData, true);
    $currentDateTime = date('Y-m-d H:i:s');

    // Update user data
    foreach ($data['users'] as $updatedUser) {
        foreach ($usersData['users'] as $key => $user) {
            if ($user['name'] === $updatedUser['name']) {
                // Update the specific user details in usersData
                $usersData['users'][$key]['assignedTrainingUnits'] = $updatedUser['assignedTrainingUnits'];
                // Update progress
                if (isset($updatedUser['progress'])) {
                    $usersData['users'][$key]['progress'] = $updatedUser['progress'];
                }
                // $usersData['users'][$key]['lastInteraction'] = $currentDateTime;
            }
        }
    }

    // Write the updated data back to the file
    if (file_put_contents($jsonFilePath, json_encode($usersData, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true, 'message' => 'Users updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to write to file']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Data file not found']);
}
?>