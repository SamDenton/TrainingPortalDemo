<?php
header('Content-Type: application/json');

// Path to the JSON file
$jsonFilePath = __DIR__ . '/../data/users.json';

// Receive the input data
$input = json_decode(file_get_contents('php://input'), true);

// Validate the received data
if (isset($input['name']) && !empty($input['name'])) {
    $newUserName = $input['name'];
    $newUserEmail = $input['email'];

    if (file_exists($jsonFilePath)) {
        $jsonContent = file_get_contents($jsonFilePath);
        $usersData = json_decode($jsonContent, true);

        // Generate a new unique identifier for the user (simple numeric increment)
        $newUserId = 'user' . (count($usersData['users']) + 1);
        $currentDateTime = date('Y-m-d H:i:s');

        // Add a new user entry
        $usersData['users'][$newUserId] = [
            'name' => $newUserName,
            'locked' => 'false',
            'lastInteraction' => $currentDateTime,
            'email' => $newUserEmail,
            'assignedTrainingUnits' => []
        ];

        // Write the updated data back to the file
        if (file_put_contents($jsonFilePath, json_encode($usersData, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true, 'message' => 'User added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error writing to file']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Users data file not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid user data received']);
}
