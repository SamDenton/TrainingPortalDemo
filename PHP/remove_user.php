<?php
header('Content-Type: application/json');

// Get the POST data
$postData = file_get_contents('php://input');
$request = json_decode($postData, true);

// Validate the request data
if (!isset($request['name'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid user data']);
    exit;
}

// Path to the JSON file
$jsonFilePath = __DIR__ . '/../data/users.json';

// Read the existing users
if (file_exists($jsonFilePath)) {
    $jsonContent = file_get_contents($jsonFilePath);
    $data = json_decode($jsonContent, true);

    // Find the user by name and remove them
    $userFound = false;
    foreach ($data['users'] as $key => $user) {
        if ($user['name'] === $request['name']) {
            unset($data['users'][$key]);
            $userFound = true;
            break;
        }
    }

    if ($userFound) {
        // Save the updated users back to the file
        if (file_put_contents($jsonFilePath, json_encode($data, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error saving data']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Users data file not found']);
}
?>
