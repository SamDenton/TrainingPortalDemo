<?php
header('Content-Type: application/json');

// Path to the JSON file
$jsonFilePath = __DIR__ . '/../data/units.json';

// Get the POST data
$postData = file_get_contents('php://input');
$newModule = json_decode($postData, true);

// Validate the new module data (basic validation)
if (!isset($newModule['type'], $newModule['name'], $newModule['id'], $newModule['approxLength'], $newModule['difficultyRating'], $newModule['section'], $newModule['subSection'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid module data']);
    exit;
}

// Read the existing units
if (file_exists($jsonFilePath)) {
    $jsonContent = file_get_contents($jsonFilePath);
    $data = json_decode($jsonContent, true);

    // Add the new module to the units array
    $data['units'][] = $newModule;

    // Save the updated units back to the file
    if (file_put_contents($jsonFilePath, json_encode($data, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error saving data']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Training units data file not found']);
}
?>